-- Issue #318, AC-004/AC-007/AC-008. Narrow Production destination and durable
-- claim support for the Free journey field executor. This migration does not insert or
-- activate the Production binding. Apply only through the separately approved migration process.

BEGIN;

ALTER TABLE public.agent_runtime_destination_bindings
    DROP CONSTRAINT IF EXISTS agent_runtime_destination_bindings_environment_check;
ALTER TABLE public.agent_runtime_destination_bindings
    ADD CONSTRAINT agent_runtime_destination_bindings_environment_check
    CHECK (environment IN ('staging', 'production'));

CREATE OR REPLACE FUNCTION public.verify_free_journey_runtime_destination(
    p_binding_key TEXT,
    p_policy_version TEXT,
    p_project_ref TEXT,
    p_destination_fingerprint TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for destination verification';
    END IF;
    IF p_binding_key IS DISTINCT FROM 'nested-objects-free-journey-production'
       OR p_policy_version IS DISTINCT FROM 'free-journey-production-v1'
       OR lower(btrim(p_project_ref)) IS DISTINCT FROM 'lzzghrjjsyzlvofpidis'
       OR lower(btrim(p_destination_fingerprint)) IS DISTINCT FROM '1a1e94c0f81a4880dd2aeb34150bd0c84b8e1cfd4bef375ad2a0e71180a4a2a9' THEN
        RAISE EXCEPTION 'free journey destination binding is invalid';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.agent_runtime_destination_bindings AS binding
        WHERE binding.binding_key = p_binding_key
          AND binding.policy_version = p_policy_version
          AND binding.environment = 'production'
          AND binding.project_ref = lower(btrim(p_project_ref))
          AND binding.destination_fingerprint = lower(btrim(p_destination_fingerprint))
          AND binding.review_status = 'approved'
          AND binding.active
    ) THEN
        RAISE EXCEPTION 'free journey Production destination sentinel is not active and approved';
    END IF;
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_free_journey_operation_run(
    p_agent_name TEXT,
    p_workflow_name TEXT,
    p_workflow_version TEXT,
    p_workflow_run_id TEXT,
    p_durable_workflow_id TEXT,
    p_runtime_version TEXT,
    p_input JSONB,
    p_idempotency_key TEXT,
    p_max_attempts INTEGER,
    p_lease_seconds INTEGER,
    p_requested_at TIMESTAMPTZ,
    p_correlation_id UUID,
    p_causation_id UUID,
    p_trace_id TEXT,
    p_destination_fingerprint TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    run_record public.agent_runs%ROWTYPE;
    disposition TEXT;
    now_at TIMESTAMPTZ := clock_timestamp();
    created BOOLEAN := false;
    stale_attempt INTEGER;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for durable run claims';
    END IF;
    IF p_agent_name IS DISTINCT FROM 'activecampaign-lifecycle'
       OR p_workflow_name IS DISTINCT FROM 'free_journey_operation'
       OR p_durable_workflow_id IS DISTINCT FROM ('free_journey_operation@' || p_workflow_version) THEN
        RAISE EXCEPTION 'free journey workflow identity is invalid';
    END IF;
    IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
        RAISE EXCEPTION 'durable run input must be a JSON object';
    END IF;
    IF p_max_attempts < 1 OR p_max_attempts > 10 OR p_lease_seconds < 30 OR p_lease_seconds > 3600 THEN
        RAISE EXCEPTION 'durable run retry or lease bounds are invalid';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.agent_runtime_destination_bindings AS binding
        WHERE binding.binding_key = 'nested-objects-free-journey-production'
          AND binding.policy_version = 'free-journey-production-v1'
          AND binding.environment = 'production'
          AND binding.project_ref = 'lzzghrjjsyzlvofpidis'
          AND binding.destination_fingerprint = '1a1e94c0f81a4880dd2aeb34150bd0c84b8e1cfd4bef375ad2a0e71180a4a2a9'
          AND binding.destination_fingerprint = p_destination_fingerprint
          AND binding.review_status = 'approved'
          AND binding.active
    ) THEN
        RAISE EXCEPTION 'free journey Production destination sentinel is not active and approved';
    END IF;

    INSERT INTO public.agent_runs (
        agent_name,
        workflow_name,
        workflow_version,
        workflow_run_id,
        durable_workflow_id,
        runtime_version,
        status,
        input,
        attempt,
        max_attempts,
        started_at,
        last_heartbeat_at,
        stale_after,
        trace_id,
        correlation_id,
        causation_id,
        idempotency_key,
        verification_status,
        destination_fingerprint,
        created_at
    ) VALUES (
        p_agent_name,
        p_workflow_name,
        p_workflow_version,
        p_workflow_run_id,
        p_durable_workflow_id,
        p_runtime_version,
        'running',
        p_input,
        1,
        p_max_attempts,
        now_at,
        now_at,
        now_at + make_interval(secs => p_lease_seconds),
        p_trace_id,
        p_correlation_id,
        p_causation_id,
        p_idempotency_key,
        'pending',
        p_destination_fingerprint,
        LEAST(now_at, p_requested_at)
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING * INTO run_record;

    IF FOUND THEN
        created := true;
        disposition := 'claimed';
    ELSE
        SELECT * INTO run_record
        FROM public.agent_runs
        WHERE idempotency_key = p_idempotency_key
        FOR UPDATE;

        IF run_record.input IS DISTINCT FROM p_input THEN
            RAISE EXCEPTION 'durable run idempotency key was reused with a different input payload';
        END IF;
        IF run_record.workflow_name IS DISTINCT FROM p_workflow_name
           OR run_record.workflow_version IS DISTINCT FROM p_workflow_version
           OR run_record.destination_fingerprint IS DISTINCT FROM p_destination_fingerprint THEN
            RAISE EXCEPTION 'durable run idempotency key was reused across a different workflow or destination';
        END IF;

        IF run_record.status = 'succeeded' THEN
            disposition := 'reused';
        ELSIF run_record.status = 'running' AND run_record.stale_after > now_at THEN
            disposition := 'busy';
        ELSIF run_record.status = 'failed' AND run_record.retry_after > now_at THEN
            disposition := 'busy';
        ELSIF run_record.attempt >= run_record.max_attempts THEN
            disposition := 'exhausted';
        ELSE
            stale_attempt := run_record.attempt;
            IF run_record.status = 'running' AND run_record.stale_after <= now_at THEN
                INSERT INTO public.agent_events (
                    event_type, producer, subject_type, subject_id, payload,
                    correlation_id, causation_id, trace_id, idempotency_key
                ) VALUES (
                    'agent.workflow.stale', p_workflow_name, 'agent_run', run_record.id::TEXT,
                    jsonb_build_object('attempt', stale_attempt), p_correlation_id, p_causation_id,
                    p_trace_id, 'workflow-run:' || run_record.id::TEXT || ':attempt:' || stale_attempt || ':stale'
                ) ON CONFLICT (idempotency_key) DO NOTHING;
            END IF;

            UPDATE public.agent_runs
            SET
                status = 'running',
                workflow_run_id = COALESCE(workflow_run_id, p_workflow_run_id),
                attempt = attempt + 1,
                retry_after = NULL,
                completed_at = NULL,
                last_heartbeat_at = now_at,
                stale_after = now_at + make_interval(secs => p_lease_seconds),
                error = NULL,
                verification_status = 'pending',
                verification_summary = '{}'::jsonb
            WHERE id = run_record.id
            RETURNING * INTO run_record;
            disposition := 'claimed';
        END IF;
    END IF;

    IF disposition = 'claimed' THEN
        INSERT INTO public.agent_events (
            event_type, producer, subject_type, subject_id, payload,
            correlation_id, causation_id, trace_id, idempotency_key
        ) VALUES (
            CASE WHEN created THEN 'agent.workflow.started' ELSE 'agent.workflow.retried' END,
            p_workflow_name,
            'agent_run',
            run_record.id::TEXT,
            jsonb_build_object('attempt', run_record.attempt, 'workflowVersion', p_workflow_version),
            p_correlation_id,
            p_causation_id,
            p_trace_id,
            'workflow-run:' || run_record.id::TEXT || ':attempt:' || run_record.attempt || ':started'
        ) ON CONFLICT (idempotency_key) DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'disposition', disposition,
        'run', public.agent_workflow_run_snapshot(run_record)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_free_journey_runtime_destination(TEXT, TEXT, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_free_journey_operation_run(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, INTEGER, TIMESTAMPTZ, UUID, UUID, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_free_journey_runtime_destination(TEXT, TEXT, TEXT, TEXT)
    TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_free_journey_operation_run(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, INTEGER, TIMESTAMPTZ, UUID, UUID, TEXT, TEXT)
    TO service_role;

COMMENT ON FUNCTION public.verify_free_journey_runtime_destination IS
    'Verifies only the inactive-by-default reviewed Production binding for the Free journey executor.';
COMMENT ON FUNCTION public.claim_free_journey_operation_run IS
    'Claims only free_journey_operation runs for the exact reviewed Production destination. Field steps retain one-attempt claim tokens.';

COMMIT;

-- Operational rollback preserves evidence: unset the executor environment gates and set the
-- exact binding active=false. Keep agent_runs, agent_workflow_steps and agent_events for review;
-- never delete them to compensate for an uncertain provider response.
