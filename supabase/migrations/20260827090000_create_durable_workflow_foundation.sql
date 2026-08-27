-- Issue #318, Phase C3. Durable staging workflow claims, steps, verification,
-- destination binding, heartbeats, and stale-run recovery.
-- Apply through the reviewed staging migration process only. Do not run this
-- migration directly against Production from an agent session.

BEGIN;

ALTER TABLE public.agent_runs
    ADD COLUMN IF NOT EXISTS workflow_version TEXT NOT NULL DEFAULT 'phase-b-v1',
    ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'failed')),
    ADD COLUMN IF NOT EXISTS verification_summary JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(verification_summary) = 'object'),
    ADD COLUMN IF NOT EXISTS destination_fingerprint TEXT;

CREATE TABLE IF NOT EXISTS public.agent_runtime_destination_bindings (
    binding_key TEXT PRIMARY KEY CHECK (char_length(binding_key) BETWEEN 1 AND 160),
    policy_version TEXT NOT NULL CHECK (char_length(policy_version) BETWEEN 1 AND 80),
    environment TEXT NOT NULL CHECK (environment = 'staging'),
    project_ref TEXT NOT NULL UNIQUE CHECK (project_ref ~ '^[a-z0-9]{15,30}$'),
    destination_fingerprint TEXT NOT NULL UNIQUE CHECK (destination_fingerprint ~ '^[a-f0-9]{64}$'),
    review_status TEXT NOT NULL CHECK (review_status = 'approved'),
    reviewed_by TEXT NOT NULL CHECK (btrim(reviewed_by) <> ''),
    reviewed_at TIMESTAMPTZ NOT NULL,
    review_evidence JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(review_evidence) = 'object'),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
    step_key TEXT NOT NULL CHECK (char_length(step_key) BETWEEN 1 AND 160),
    workflow_step_id TEXT NOT NULL CHECK (char_length(workflow_step_id) BETWEEN 1 AND 256),
    claim_token UUID,
    status TEXT NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'succeeded', 'failed', 'stale')),
    input JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(input) = 'object'),
    output JSONB,
    tool_calls JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(tool_calls) = 'array'),
    attempt INTEGER NOT NULL DEFAULT 1 CHECK (attempt > 0),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
    retry_after TIMESTAMPTZ,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    stale_after TIMESTAMPTZ NOT NULL,
    error JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (run_id, step_key),
    CHECK (attempt <= max_attempts),
    CHECK (output IS NULL OR jsonb_typeof(output) = 'object'),
    CHECK (error IS NULL OR jsonb_typeof(error) = 'object'),
    CHECK (completed_at IS NULL OR completed_at >= started_at),
    CHECK (
        (status = 'running' AND claim_token IS NOT NULL AND completed_at IS NULL)
        OR (status <> 'running' AND claim_token IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS agent_workflow_steps_status_stale_idx
    ON public.agent_workflow_steps (status, stale_after)
    WHERE status = 'running';

CREATE INDEX IF NOT EXISTS agent_workflow_steps_run_idx
    ON public.agent_workflow_steps (run_id, created_at);

DROP TRIGGER IF EXISTS agent_runtime_destination_bindings_set_updated_at
    ON public.agent_runtime_destination_bindings;
CREATE TRIGGER agent_runtime_destination_bindings_set_updated_at
    BEFORE UPDATE ON public.agent_runtime_destination_bindings
    FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at();

DROP TRIGGER IF EXISTS agent_workflow_steps_set_updated_at
    ON public.agent_workflow_steps;
CREATE TRIGGER agent_workflow_steps_set_updated_at
    BEFORE UPDATE ON public.agent_workflow_steps
    FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at();

CREATE OR REPLACE FUNCTION public.agent_workflow_run_snapshot(p_run public.agent_runs)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'runId', p_run.id,
        'status', p_run.status,
        'attempt', p_run.attempt,
        'maxAttempts', p_run.max_attempts,
        'workflowRunId', p_run.workflow_run_id,
        'durableWorkflowId', p_run.durable_workflow_id,
        'output', p_run.output,
        'verificationStatus', p_run.verification_status,
        'lastHeartbeatAt', p_run.last_heartbeat_at,
        'staleAfter', p_run.stale_after,
        'retryAfter', p_run.retry_after
    );
$$;

CREATE OR REPLACE FUNCTION public.agent_workflow_step_snapshot(p_step public.agent_workflow_steps)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'stepId', p_step.id,
        'runId', p_step.run_id,
        'stepKey', p_step.step_key,
        'workflowStepId', p_step.workflow_step_id,
        'claimToken', p_step.claim_token,
        'status', p_step.status,
        'attempt', p_step.attempt,
        'maxAttempts', p_step.max_attempts,
        'output', p_step.output,
        'toolCalls', p_step.tool_calls,
        'retryAfter', p_step.retry_after
    );
$$;

CREATE OR REPLACE FUNCTION public.verify_agent_runtime_destination(
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

    IF NOT EXISTS (
        SELECT 1
        FROM public.agent_runtime_destination_bindings AS binding
        WHERE binding.binding_key = p_binding_key
          AND binding.policy_version = p_policy_version
          AND binding.environment = 'staging'
          AND binding.project_ref = lower(btrim(p_project_ref))
          AND binding.destination_fingerprint = lower(btrim(p_destination_fingerprint))
          AND binding.review_status = 'approved'
          AND binding.active
    ) THEN
        RAISE EXCEPTION 'runtime destination does not match an active reviewed staging sentinel';
    END IF;

    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_agent_workflow_run(
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
    IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
        RAISE EXCEPTION 'durable run input must be a JSON object';
    END IF;
    IF p_max_attempts < 1 OR p_max_attempts > 10 OR p_lease_seconds < 30 OR p_lease_seconds > 3600 THEN
        RAISE EXCEPTION 'durable run retry or lease bounds are invalid';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.agent_runtime_destination_bindings AS binding
        WHERE binding.destination_fingerprint = p_destination_fingerprint
          AND binding.environment = 'staging'
          AND binding.review_status = 'approved'
          AND binding.active
    ) THEN
        RAISE EXCEPTION 'durable run destination sentinel is not active and approved';
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

CREATE OR REPLACE FUNCTION public.claim_agent_workflow_step(
    p_run_id UUID,
    p_step_key TEXT,
    p_workflow_step_id TEXT,
    p_input JSONB,
    p_max_attempts INTEGER,
    p_lease_seconds INTEGER,
    p_correlation_id UUID,
    p_causation_id UUID,
    p_trace_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    step_record public.agent_workflow_steps%ROWTYPE;
    run_record public.agent_runs%ROWTYPE;
    disposition TEXT;
    now_at TIMESTAMPTZ := clock_timestamp();
    stale_attempt INTEGER;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for durable step claims';
    END IF;
    IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
        RAISE EXCEPTION 'durable step input must be a JSON object';
    END IF;
    IF p_max_attempts < 1 OR p_max_attempts > 10 OR p_lease_seconds < 30 OR p_lease_seconds > 3600 THEN
        RAISE EXCEPTION 'durable step retry or lease bounds are invalid';
    END IF;

    SELECT * INTO run_record FROM public.agent_runs WHERE id = p_run_id FOR UPDATE;
    IF NOT FOUND OR run_record.status <> 'running' THEN
        RAISE EXCEPTION 'durable step requires a running agent run';
    END IF;

    INSERT INTO public.agent_workflow_steps (
        run_id, step_key, workflow_step_id, claim_token, status, input,
        attempt, max_attempts, started_at, last_heartbeat_at, stale_after
    ) VALUES (
        p_run_id, p_step_key, p_workflow_step_id, gen_random_uuid(), 'running', p_input,
        1, p_max_attempts, now_at, now_at, now_at + make_interval(secs => p_lease_seconds)
    )
    ON CONFLICT (run_id, step_key) DO NOTHING
    RETURNING * INTO step_record;

    IF FOUND THEN
        disposition := 'claimed';
    ELSE
        SELECT * INTO step_record
        FROM public.agent_workflow_steps
        WHERE run_id = p_run_id AND step_key = p_step_key
        FOR UPDATE;

        IF step_record.input IS DISTINCT FROM p_input THEN
            RAISE EXCEPTION 'durable step key was reused with a different input payload';
        END IF;
        IF step_record.status = 'succeeded' THEN
            disposition := 'reused';
        ELSIF step_record.status = 'running' AND step_record.stale_after > now_at THEN
            disposition := 'busy';
        ELSIF step_record.status = 'failed' AND step_record.retry_after > now_at THEN
            disposition := 'busy';
        ELSIF step_record.attempt >= step_record.max_attempts THEN
            disposition := 'exhausted';
        ELSE
            stale_attempt := step_record.attempt;
            IF step_record.status = 'running' AND step_record.stale_after <= now_at THEN
                INSERT INTO public.agent_events (
                    event_type, producer, subject_type, subject_id, payload,
                    correlation_id, causation_id, trace_id, idempotency_key
                ) VALUES (
                    'agent.workflow_step.stale', run_record.workflow_name, 'agent_workflow_step', step_record.id::TEXT,
                    jsonb_build_object('stepKey', p_step_key, 'attempt', stale_attempt),
                    p_correlation_id, p_causation_id, p_trace_id,
                    'workflow-step:' || step_record.id::TEXT || ':attempt:' || stale_attempt || ':stale'
                ) ON CONFLICT (idempotency_key) DO NOTHING;
            END IF;

            UPDATE public.agent_workflow_steps
            SET
                workflow_step_id = p_workflow_step_id,
                claim_token = gen_random_uuid(),
                status = 'running',
                attempt = attempt + 1,
                retry_after = NULL,
                completed_at = NULL,
                last_heartbeat_at = now_at,
                stale_after = now_at + make_interval(secs => p_lease_seconds),
                error = NULL
            WHERE id = step_record.id
            RETURNING * INTO step_record;
            disposition := 'claimed';
        END IF;
    END IF;

    IF disposition = 'claimed' THEN
        UPDATE public.agent_runs
        SET last_heartbeat_at = now_at,
            stale_after = now_at + make_interval(secs => p_lease_seconds)
        WHERE id = p_run_id AND status = 'running';

        INSERT INTO public.agent_events (
            event_type, producer, subject_type, subject_id, payload,
            correlation_id, causation_id, trace_id, idempotency_key
        ) VALUES (
            CASE WHEN step_record.attempt = 1 THEN 'agent.workflow_step.started' ELSE 'agent.workflow_step.retried' END,
            run_record.workflow_name,
            'agent_workflow_step',
            step_record.id::TEXT,
            jsonb_build_object('stepKey', p_step_key, 'attempt', step_record.attempt),
            p_correlation_id,
            p_causation_id,
            p_trace_id,
            'workflow-step:' || step_record.id::TEXT || ':attempt:' || step_record.attempt || ':started'
        ) ON CONFLICT (idempotency_key) DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'disposition', disposition,
        'step', public.agent_workflow_step_snapshot(step_record)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_agent_workflow_step(
    p_run_id UUID,
    p_step_key TEXT,
    p_claim_token UUID,
    p_output JSONB,
    p_tool_calls JSONB,
    p_correlation_id UUID,
    p_causation_id UUID,
    p_trace_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    step_record public.agent_workflow_steps%ROWTYPE;
    run_name TEXT;
    now_at TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for durable step completion';
    END IF;
    IF jsonb_typeof(p_output) <> 'object' OR jsonb_typeof(p_tool_calls) <> 'array' THEN
        RAISE EXCEPTION 'durable step completion payload shape is invalid';
    END IF;

    SELECT * INTO step_record
    FROM public.agent_workflow_steps
    WHERE run_id = p_run_id AND step_key = p_step_key
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'durable workflow step does not exist'; END IF;
    IF step_record.status = 'succeeded' THEN
        RETURN public.agent_workflow_step_snapshot(step_record);
    END IF;
    IF step_record.status <> 'running' OR step_record.claim_token IS DISTINCT FROM p_claim_token THEN
        RAISE EXCEPTION 'durable workflow step claim is stale or invalid';
    END IF;

    UPDATE public.agent_workflow_steps
    SET status = 'succeeded', claim_token = NULL, output = p_output,
        tool_calls = p_tool_calls, completed_at = now_at,
        last_heartbeat_at = now_at, stale_after = now_at, retry_after = NULL, error = NULL
    WHERE id = step_record.id
    RETURNING * INTO step_record;

    UPDATE public.agent_runs
    SET last_heartbeat_at = now_at, stale_after = now_at + interval '5 minutes'
    WHERE id = p_run_id AND status = 'running'
    RETURNING workflow_name INTO run_name;

    INSERT INTO public.agent_events (
        event_type, producer, subject_type, subject_id, payload,
        correlation_id, causation_id, trace_id, idempotency_key
    ) VALUES (
        'agent.workflow_step.completed', COALESCE(run_name, 'durable-workflow'),
        'agent_workflow_step', step_record.id::TEXT,
        jsonb_build_object('stepKey', p_step_key, 'attempt', step_record.attempt),
        p_correlation_id, p_causation_id, p_trace_id,
        'workflow-step:' || step_record.id::TEXT || ':completed'
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN public.agent_workflow_step_snapshot(step_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_agent_workflow_step(
    p_run_id UUID,
    p_step_key TEXT,
    p_claim_token UUID,
    p_error JSONB,
    p_retry_after TIMESTAMPTZ,
    p_correlation_id UUID,
    p_causation_id UUID,
    p_trace_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    step_record public.agent_workflow_steps%ROWTYPE;
    run_name TEXT;
    now_at TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for durable step failure';
    END IF;
    IF jsonb_typeof(p_error) <> 'object' THEN RAISE EXCEPTION 'durable step error must be an object'; END IF;

    SELECT * INTO step_record
    FROM public.agent_workflow_steps
    WHERE run_id = p_run_id AND step_key = p_step_key
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'durable workflow step does not exist'; END IF;
    IF step_record.status <> 'running' OR step_record.claim_token IS DISTINCT FROM p_claim_token THEN
        RAISE EXCEPTION 'durable workflow step claim is stale or invalid';
    END IF;

    UPDATE public.agent_workflow_steps
    SET status = 'failed', claim_token = NULL, error = p_error,
        retry_after = p_retry_after, completed_at = now_at,
        last_heartbeat_at = now_at, stale_after = now_at
    WHERE id = step_record.id
    RETURNING * INTO step_record;

    SELECT workflow_name INTO run_name FROM public.agent_runs WHERE id = p_run_id;
    INSERT INTO public.agent_events (
        event_type, producer, subject_type, subject_id, payload,
        correlation_id, causation_id, trace_id, idempotency_key
    ) VALUES (
        'agent.workflow_step.failed', COALESCE(run_name, 'durable-workflow'),
        'agent_workflow_step', step_record.id::TEXT,
        jsonb_build_object('stepKey', p_step_key, 'attempt', step_record.attempt, 'errorCode', p_error->>'code'),
        p_correlation_id, p_causation_id, p_trace_id,
        'workflow-step:' || step_record.id::TEXT || ':attempt:' || step_record.attempt || ':failed'
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN public.agent_workflow_step_snapshot(step_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.persist_agent_workflow_signals(
    p_run_id UUID,
    p_signals JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    signal_record JSONB;
    signal_count INTEGER;
    run_record public.agent_runs%ROWTYPE;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for durable signal persistence';
    END IF;
    IF jsonb_typeof(p_signals) <> 'array' THEN RAISE EXCEPTION 'durable signals payload must be an array'; END IF;
    signal_count := jsonb_array_length(p_signals);
    IF signal_count > 50 THEN RAISE EXCEPTION 'durable signal batch exceeds the 50-record bound'; END IF;

    SELECT * INTO run_record FROM public.agent_runs WHERE id = p_run_id FOR UPDATE;
    IF NOT FOUND OR run_record.status <> 'running' THEN
        RAISE EXCEPTION 'durable signals require a running agent run';
    END IF;

    FOR signal_record IN SELECT value FROM jsonb_array_elements(p_signals)
    LOOP
        INSERT INTO public.intelligence_signals (
            id, signal_type, domain, producer, title, summary, evidence, source_refs,
            confidence, severity, priority, business_impact, affected_entities,
            recommended_follow_up, fingerprint, idempotency_key, status,
            first_detected_at, last_detected_at, correlation_id, causation_id
        ) VALUES (
            (signal_record->>'id')::UUID,
            signal_record->>'signal_type',
            signal_record->>'domain',
            signal_record->>'producer',
            signal_record->>'title',
            signal_record->>'summary',
            COALESCE(signal_record->'evidence', '[]'::jsonb),
            COALESCE(signal_record->'source_refs', '[]'::jsonb),
            (signal_record->>'confidence')::NUMERIC,
            signal_record->>'severity',
            (signal_record->>'priority')::SMALLINT,
            signal_record->>'business_impact',
            COALESCE(signal_record->'affected_entities', '[]'::jsonb),
            signal_record->>'recommended_follow_up',
            signal_record->>'fingerprint',
            signal_record->>'idempotency_key',
            signal_record->>'status',
            (signal_record->>'first_detected_at')::TIMESTAMPTZ,
            (signal_record->>'last_detected_at')::TIMESTAMPTZ,
            (signal_record->>'correlation_id')::UUID,
            NULLIF(signal_record->>'causation_id', '')::UUID
        )
        ON CONFLICT (producer, fingerprint) DO UPDATE
        SET
            title = EXCLUDED.title,
            summary = EXCLUDED.summary,
            evidence = EXCLUDED.evidence,
            source_refs = EXCLUDED.source_refs,
            confidence = EXCLUDED.confidence,
            severity = EXCLUDED.severity,
            priority = EXCLUDED.priority,
            business_impact = EXCLUDED.business_impact,
            affected_entities = EXCLUDED.affected_entities,
            recommended_follow_up = EXCLUDED.recommended_follow_up,
            first_detected_at = LEAST(public.intelligence_signals.first_detected_at, EXCLUDED.first_detected_at),
            last_detected_at = GREATEST(public.intelligence_signals.last_detected_at, EXCLUDED.last_detected_at),
            correlation_id = EXCLUDED.correlation_id,
            causation_id = EXCLUDED.causation_id;
    END LOOP;

    INSERT INTO public.agent_events (
        event_type, producer, subject_type, subject_id, payload,
        correlation_id, causation_id, trace_id, idempotency_key
    ) VALUES (
        'agent.workflow.signals_persisted', run_record.workflow_name, 'agent_run', p_run_id::TEXT,
        jsonb_build_object('signalCount', signal_count), run_record.correlation_id,
        run_record.causation_id, run_record.trace_id,
        'workflow-run:' || p_run_id::TEXT || ':signals-persisted'
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN signal_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_agent_workflow_run(
    p_run_id UUID,
    p_output JSONB,
    p_tool_calls JSONB,
    p_input_tokens BIGINT,
    p_output_tokens BIGINT,
    p_estimated_cost NUMERIC,
    p_verification_summary JSONB,
    p_correlation_id UUID,
    p_causation_id UUID,
    p_trace_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    run_record public.agent_runs%ROWTYPE;
    now_at TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for durable run completion';
    END IF;
    IF jsonb_typeof(p_output) <> 'object' OR jsonb_typeof(p_tool_calls) <> 'array'
       OR jsonb_typeof(p_verification_summary) <> 'object' THEN
        RAISE EXCEPTION 'durable run completion payload shape is invalid';
    END IF;

    SELECT * INTO run_record FROM public.agent_runs WHERE id = p_run_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'durable workflow run does not exist'; END IF;
    IF run_record.status = 'succeeded' THEN RETURN public.agent_workflow_run_snapshot(run_record); END IF;
    IF run_record.status <> 'running' THEN RAISE EXCEPTION 'only a running durable workflow can complete'; END IF;

    UPDATE public.agent_runs
    SET status = 'succeeded', output = p_output, tool_calls = p_tool_calls,
        input_tokens = p_input_tokens, output_tokens = p_output_tokens,
        estimated_cost = p_estimated_cost, completed_at = now_at,
        last_heartbeat_at = now_at, stale_after = NULL,
        duration_ms = GREATEST(0, floor(extract(epoch FROM (now_at - started_at)) * 1000)::BIGINT),
        retry_after = NULL, error = NULL, verification_status = 'verified',
        verification_summary = p_verification_summary
    WHERE id = p_run_id
    RETURNING * INTO run_record;

    INSERT INTO public.agent_events (
        event_type, producer, subject_type, subject_id, payload,
        correlation_id, causation_id, trace_id, idempotency_key
    ) VALUES (
        'agent.workflow.completed', run_record.workflow_name, 'agent_run', p_run_id::TEXT,
        jsonb_build_object('attempt', run_record.attempt, 'verificationStatus', 'verified'),
        p_correlation_id, p_causation_id, p_trace_id,
        'workflow-run:' || p_run_id::TEXT || ':completed'
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN public.agent_workflow_run_snapshot(run_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_agent_workflow_run(
    p_run_id UUID,
    p_error JSONB,
    p_retry_after TIMESTAMPTZ,
    p_correlation_id UUID,
    p_causation_id UUID,
    p_trace_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    run_record public.agent_runs%ROWTYPE;
    now_at TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for durable run failure';
    END IF;
    IF jsonb_typeof(p_error) <> 'object' THEN RAISE EXCEPTION 'durable run error must be an object'; END IF;

    SELECT * INTO run_record FROM public.agent_runs WHERE id = p_run_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'durable workflow run does not exist'; END IF;
    IF run_record.status = 'succeeded' THEN RETURN public.agent_workflow_run_snapshot(run_record); END IF;

    UPDATE public.agent_runs
    SET status = 'failed', error = p_error, retry_after = p_retry_after,
        completed_at = now_at, last_heartbeat_at = now_at, stale_after = NULL,
        duration_ms = GREATEST(0, floor(extract(epoch FROM (now_at - started_at)) * 1000)::BIGINT),
        verification_status = 'failed',
        verification_summary = jsonb_build_object('errorCode', p_error->>'code')
    WHERE id = p_run_id
    RETURNING * INTO run_record;

    INSERT INTO public.agent_events (
        event_type, producer, subject_type, subject_id, payload,
        correlation_id, causation_id, trace_id, idempotency_key
    ) VALUES (
        'agent.workflow.failed', run_record.workflow_name, 'agent_run', p_run_id::TEXT,
        jsonb_build_object('attempt', run_record.attempt, 'errorCode', p_error->>'code'),
        p_correlation_id, p_causation_id, p_trace_id,
        'workflow-run:' || p_run_id::TEXT || ':attempt:' || run_record.attempt || ':failed'
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN public.agent_workflow_run_snapshot(run_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_stale_agent_workflow_runs(p_limit INTEGER DEFAULT 50)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    run_record public.agent_runs%ROWTYPE;
    marked INTEGER := 0;
    now_at TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for stale-run detection';
    END IF;
    IF p_limit < 1 OR p_limit > 100 THEN RAISE EXCEPTION 'stale-run sweep limit must be between 1 and 100'; END IF;

    FOR run_record IN
        SELECT * FROM public.agent_runs
        WHERE status = 'running' AND stale_after <= now_at
        ORDER BY stale_after, id
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE public.agent_runs
        SET status = 'stale', completed_at = now_at, last_heartbeat_at = now_at,
            stale_after = NULL, verification_status = 'failed',
            verification_summary = jsonb_build_object('reason', 'heartbeat_lease_expired'),
            error = jsonb_build_object(
                'code', 'STALE_RUN',
                'message', 'The durable workflow heartbeat lease expired.',
                'retryable', true,
                'details', '{}'::jsonb,
                'occurredAt', now_at
            )
        WHERE id = run_record.id;

        UPDATE public.agent_workflow_steps
        SET status = 'stale', claim_token = NULL, completed_at = now_at,
            last_heartbeat_at = now_at, stale_after = now_at,
            error = jsonb_build_object(
                'code', 'STALE_STEP',
                'message', 'The durable workflow step heartbeat lease expired.',
                'retryable', true,
                'details', '{}'::jsonb,
                'occurredAt', now_at
            )
        WHERE run_id = run_record.id AND status = 'running' AND stale_after <= now_at;

        INSERT INTO public.agent_events (
            event_type, producer, subject_type, subject_id, payload,
            correlation_id, causation_id, trace_id, idempotency_key
        ) VALUES (
            'agent.workflow.stale', run_record.workflow_name, 'agent_run', run_record.id::TEXT,
            jsonb_build_object('attempt', run_record.attempt, 'reason', 'heartbeat_lease_expired'),
            run_record.correlation_id, run_record.causation_id, run_record.trace_id,
            'workflow-run:' || run_record.id::TEXT || ':attempt:' || run_record.attempt || ':stale'
        ) ON CONFLICT (idempotency_key) DO NOTHING;
        marked := marked + 1;
    END LOOP;

    RETURN marked;
END;
$$;

COMMENT ON TABLE public.agent_runtime_destination_bindings IS
    'Server-only database sentinel for code-reviewed staging destinations. No runtime secret is stored here.';
COMMENT ON TABLE public.agent_workflow_steps IS
    'Atomic bounded step claims and resume-safe results for durable Intelligence OS workflows.';
COMMENT ON FUNCTION public.claim_agent_workflow_run IS
    'Atomically claims one business-idempotent run. Completed runs are reusable and are never reset by retries.';

ALTER TABLE public.agent_runtime_destination_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_workflow_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can read agent runtime destination bindings"
    ON public.agent_runtime_destination_bindings;
CREATE POLICY "Service role can read agent runtime destination bindings"
    ON public.agent_runtime_destination_bindings
    FOR SELECT USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage agent workflow steps"
    ON public.agent_workflow_steps;
CREATE POLICY "Service role can manage agent workflow steps"
    ON public.agent_workflow_steps
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

REVOKE ALL ON TABLE public.agent_runtime_destination_bindings FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.agent_runtime_destination_bindings TO service_role;
REVOKE ALL ON TABLE public.agent_workflow_steps FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agent_workflow_steps TO service_role;

REVOKE ALL ON FUNCTION public.agent_workflow_run_snapshot(public.agent_runs) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.agent_workflow_step_snapshot(public.agent_workflow_steps) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_agent_runtime_destination(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_agent_workflow_run(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, INTEGER, TIMESTAMPTZ, UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_agent_workflow_step(UUID, TEXT, TEXT, JSONB, INTEGER, INTEGER, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_agent_workflow_step(UUID, TEXT, UUID, JSONB, JSONB, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_agent_workflow_step(UUID, TEXT, UUID, JSONB, TIMESTAMPTZ, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.persist_agent_workflow_signals(UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_agent_workflow_run(UUID, JSONB, JSONB, BIGINT, BIGINT, NUMERIC, JSONB, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_agent_workflow_run(UUID, JSONB, TIMESTAMPTZ, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_stale_agent_workflow_runs(INTEGER) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.verify_agent_runtime_destination(TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_agent_workflow_run(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, INTEGER, TIMESTAMPTZ, UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_agent_workflow_step(UUID, TEXT, TEXT, JSONB, INTEGER, INTEGER, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_agent_workflow_step(UUID, TEXT, UUID, JSONB, JSONB, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_agent_workflow_step(UUID, TEXT, UUID, JSONB, TIMESTAMPTZ, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.persist_agent_workflow_signals(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_agent_workflow_run(UUID, JSONB, JSONB, BIGINT, BIGINT, NUMERIC, JSONB, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_agent_workflow_run(UUID, JSONB, TIMESTAMPTZ, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_stale_agent_workflow_runs(INTEGER) TO service_role;

COMMIT;
