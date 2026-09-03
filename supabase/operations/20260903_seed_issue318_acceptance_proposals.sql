-- Issue #318: bounded synthetic approval fixtures; manually reviewed operator action.
-- NOT a migration. Execute only after positively selecting nested-objects-staging
-- (wqstirwszdbsygstnvbn) and verifying the isolated Preview configuration.
-- The user approved synthetic-only staging acceptance writes. No member data,
-- owner/binding changes, grants, schema changes, cleanup, or execution are included.
-- Protected event triggers map to conversion_review, NOT daily_business_health.
-- Reruns reuse only exact, still-proposed fixtures; decided/conflicting rows abort.

BEGIN;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.agent_approvers, public.agent_runtime_destination_bindings IN SHARE MODE;

DO $seed$
DECLARE
    expected_owner CONSTANT TEXT := '9P66YMPm';
    expected_fingerprint CONSTANT TEXT := 'be8e4a36f85fbecf5109502e9acfc0830a4d4258a25c518cfdbf700d8b8f7954';
    expected_run_key CONSTANT TEXT := 'phase-c5:conversion_review:synthetic-event-review:2026-09-03:001';
    expected_source_event_id CONSTANT TEXT := 'synthetic-event:issue318:2026-09-03:v1:integration-failure';
    expected_observed_at CONSTANT TEXT := '2026-09-03T12:00:00.000Z';
    expected_event_signal_id CONSTANT UUID := '9e450c88-9515-59e9-8e53-5500dae57947';
    expected_signal_causation_id CONSTANT UUID := '8f4cc541-3ace-53f4-853d-64612b8adcbf';
    expected_run_causation_id CONSTANT UUID := '216fcd28-87c1-54e9-8286-61251163aee2';
    expected_run_correlation_id CONSTANT UUID := '4b7cedb9-56b0-5eea-aa33-a1ebccaaf0b9';
    fixture_agent CONSTANT TEXT := 'synthetic-issue318-acceptance';
    fixture_trace CONSTANT TEXT := 'synthetic-issue318:acceptance:2026-09-03:v1';
    event_run public.agent_runs%ROWTYPE;
    stored_action public.agent_actions%ROWTYPE;
    expected_event_source_ref JSONB;
    expected_event_signal JSONB;
    expected_run_input JSONB;
    expected_durable_signal JSONB;
    durable_event_signal JSONB;
    fixture JSONB;
    source_ref JSONB;
    expected_action JSONB;
    inserted_rows INTEGER;
    inserted_total INTEGER := 0;
BEGIN
    -- Serialize only concurrent executions of this fixture operator action.
    PERFORM pg_advisory_xact_lock(318, 20260903);

    IF (SELECT count(*) FROM public.agent_approvers WHERE active) <> 1
       OR NOT EXISTS (
           SELECT 1 FROM public.agent_approvers
           WHERE subject_id = expected_owner AND approver_kind = 'owner'
             AND active AND scopes @> '["intelligence_os"]'::jsonb
       ) THEN
        RAISE EXCEPTION 'Acceptance seed requires the sole active reviewed owner 9P66YMPm';
    END IF;
    IF (SELECT count(*) FROM public.agent_runtime_destination_bindings WHERE active) <> 1
       OR NOT EXISTS (
           SELECT 1 FROM public.agent_runtime_destination_bindings
           WHERE binding_key = 'nested-objects-agent-runtime-staging'
             AND policy_version = 'phase-c3-v1' AND environment = 'staging'
             AND project_ref = 'wqstirwszdbsygstnvbn'
             AND destination_fingerprint = expected_fingerprint
             AND review_status = 'approved' AND reviewed_by = expected_owner AND active
       ) THEN
        RAISE EXCEPTION 'Acceptance seed requires the exact sole active reviewed staging sentinel';
    END IF;

    -- Supply only transaction-local JWT role context to the existing guards.
    -- This does not change the operator database role, privileges, or owner rows.
    PERFORM set_config('request.jwt.claim.role', 'service_role', true);
    PERFORM public.assert_agent_owner_subject(expected_owner);
    IF public.verify_agent_runtime_destination(
        'nested-objects-agent-runtime-staging', 'phase-c3-v1',
        'wqstirwszdbsygstnvbn', expected_fingerprint
    ) IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Reviewed staging destination verification failed';
    END IF;

    SELECT * INTO event_run FROM public.agent_runs
    WHERE idempotency_key = expected_run_key FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Required namespaced synthetic event run is absent; queue and verify it first';
    END IF;
    IF event_run.workflow_name IS DISTINCT FROM 'conversion_review'
       OR event_run.workflow_version IS DISTINCT FROM 'phase-c5-v1'
       OR event_run.status IS DISTINCT FROM 'succeeded'
       OR event_run.verification_status IS DISTINCT FROM 'verified'
       OR event_run.destination_fingerprint IS DISTINCT FROM expected_fingerprint
       OR event_run.trace_id IS DISTINCT FROM 'phase-c7-protected-trigger'
       OR event_run.correlation_id IS DISTINCT FROM expected_run_correlation_id
       OR event_run.causation_id IS DISTINCT FROM expected_run_causation_id
       OR event_run.completed_at IS NULL OR event_run.error IS NOT NULL
       OR event_run.model IS NOT NULL OR event_run.provider IS NOT NULL
       OR event_run.output->>'state' IS DISTINCT FROM 'succeeded'
       OR event_run.output->>'verificationStatus' IS DISTINCT FROM 'verified'
       OR event_run.output->>'correlationId' IS DISTINCT FROM event_run.correlation_id::TEXT THEN
        RAISE EXCEPTION 'Event run is not a verified, succeeded, model-free protected staging run';
    END IF;

    expected_event_source_ref := jsonb_build_object(
        'sourceSystem', 'synthetic-c7-trigger',
        'sourceType', 'critical_integration_failure',
        'sourceId', expected_source_event_id,
        'observedAt', expected_observed_at
    );
    expected_event_signal := jsonb_build_object(
        'id', expected_event_signal_id,
        'signalType', 'operations.event.critical_integration_failure',
        'domain', 'growth',
        'producer', 'synthetic-c7-trigger',
        'title', 'Synthetic critical integration failure trigger',
        'summary', 'Deterministic synthetic event used to validate the protected event-trigger contract.',
        'evidence', jsonb_build_array(jsonb_build_object(
            'evidenceType', 'test',
            'summary', 'Synthetic C7 trigger fixture; no customer record or external mutation.',
            'sourceRef', expected_event_source_ref,
            'confidence', 1
        )),
        'sourceRefs', jsonb_build_array(expected_event_source_ref),
        'confidence', 1,
        'severity', 'high',
        'priority', 90,
        'businessImpact', 'Validates one shared event-driven decision path without creating an independent agent cron.',
        'affectedEntities', '[]'::jsonb,
        'recommendedFollowUp', 'Review the synthetic workflow trace only.',
        'fingerprint', 'synthetic-c7-trigger:critical_integration_failure:synthetic-event:issue318:2026-09-03:v1:integration-failure',
        'idempotencyKey', 'signal:synthetic-c7-trigger:critical_integration_failure:synthetic-event:issue318:2026-09-03:v1:integration-failure',
        'status', 'new',
        'firstDetectedAt', expected_observed_at,
        'lastDetectedAt', expected_observed_at,
        'correlation', jsonb_build_object(
            'correlationId', expected_run_correlation_id,
            'causationId', expected_signal_causation_id,
            'traceId', 'synthetic-c7-protected-trigger'
        )
    );
    expected_run_input := jsonb_build_object(
        'reviewDate', '2026-09-03',
        'metrics', '[]'::jsonb,
        'lifecycleSignals', jsonb_build_array(expected_event_signal),
        'sourceHealth', '[]'::jsonb,
        'industryObservations', '[]'::jsonb,
        'persistedSignals', '[]'::jsonb,
        'experiments', '[]'::jsonb,
        'tasks', '[]'::jsonb,
        'priorActions', '[]'::jsonb,
        'sensorReports', '[]'::jsonb,
        'specialists', jsonb_build_object(
            'revenue', jsonb_build_object('currentMetrics', '[]'::jsonb, 'comparisonMetrics', '[]'::jsonb),
            'growth', jsonb_build_object('metrics', '[]'::jsonb, 'currentWeekEnd', '2026-09-03'),
            'marketing', jsonb_build_object(
                'marketingMetrics', '[]'::jsonb,
                'lifecycleSignals', jsonb_build_array(expected_event_signal)
            )
        )
    );
    IF event_run.input IS DISTINCT FROM expected_run_input THEN
        RAISE EXCEPTION 'Event run input is not the exact bounded synthetic protected-trigger fixture';
    END IF;

    expected_durable_signal := jsonb_build_object(
        'id', expected_event_signal_id,
        'signal_type', 'operations.event.critical_integration_failure',
        'domain', 'growth',
        'producer', 'synthetic-c7-trigger',
        'title', 'Synthetic critical integration failure trigger',
        'summary', 'Deterministic synthetic event used to validate the protected event-trigger contract.',
        'evidence', expected_event_signal->'evidence',
        'source_refs', expected_event_signal->'sourceRefs',
        'confidence', 1,
        'severity', 'high',
        'priority', 90,
        'business_impact', 'Validates one shared event-driven decision path without creating an independent agent cron.',
        'affected_entities', '[]'::jsonb,
        'recommended_follow_up', 'Review the synthetic workflow trace only.',
        'fingerprint', expected_event_signal->>'fingerprint',
        'idempotency_key', expected_event_signal->>'idempotencyKey',
        'status', 'new',
        'first_detected_at', '2026-09-03T12:00:00+00:00',
        'last_detected_at', '2026-09-03T12:00:00+00:00',
        'experiment_id', NULL,
        'data_quality', '{}'::jsonb,
        'correlation_id', expected_run_correlation_id,
        'causation_id', expected_signal_causation_id
    );
    SELECT to_jsonb(signal_row) - 'created_at' - 'updated_at'
    INTO durable_event_signal
    FROM public.intelligence_signals AS signal_row
    WHERE id = expected_event_signal_id
    FOR SHARE;
    IF NOT FOUND OR durable_event_signal IS DISTINCT FROM expected_durable_signal THEN
        RAISE EXCEPTION 'Durable event signal is absent or differs from the exact synthetic acceptance evidence';
    END IF;

    FOR fixture IN SELECT value FROM jsonb_array_elements('[
        {
            "id": "31800000-0000-4000-8000-202609030001",
            "action_type": "synthetic.acceptance_approval",
            "target_system": "synthetic_noop",
            "payload": {"fixtureId": "issue318-approval", "intendedDecision": "approved", "externalMutationAllowed": false},
            "concise_rationale": "Synthetic acceptance approval fixture only; record a decision without executing an external action.",
            "risk_level": "high",
            "idempotency_key": "synthetic-issue318:acceptance:2026-09-03:v1:proposal:approval"
        },
        {
            "id": "31800000-0000-4000-8000-202609030002",
            "action_type": "synthetic.acceptance_rejection",
            "target_system": "synthetic_noop",
            "payload": {"fixtureId": "issue318-rejection", "intendedDecision": "rejected", "externalMutationAllowed": false},
            "concise_rationale": "Synthetic acceptance rejection fixture only; no content will be published or executed.",
            "risk_level": "medium",
            "idempotency_key": "synthetic-issue318:acceptance:2026-09-03:v1:proposal:rejection"
        }
    ]'::jsonb)
    LOOP
        source_ref := jsonb_build_object(
            'sourceSystem', fixture_agent, 'sourceType', 'operator-fixture',
            'sourceId', fixture->>'idempotency_key', 'observedAt', '2026-09-03T12:00:00.000Z'
        );
        expected_action := fixture || jsonb_build_object(
            'requested_by_agent', fixture_agent, 'task_id', NULL, 'run_id', event_run.id,
            'experiment_id', NULL, 'signal_ids', jsonb_build_array(expected_event_signal_id),
            'evidence', jsonb_build_array(jsonb_build_object(
                'evidenceType', 'test', 'summary', 'User-approved synthetic staging acceptance fixture; no real member or external execution.',
                'sourceRef', source_ref, 'confidence', 1
            )),
            'source_refs', jsonb_build_array(source_ref),
            'approval_required', true, 'status', 'proposed',
            'approved_by', NULL, 'approved_at', NULL, 'approval_authority', NULL,
            'approval_context', '{}'::jsonb, 'rejected_by', NULL, 'rejected_at', NULL,
            'rejection_reason', NULL, 'executor_key', NULL,
            'execution_guard_version', 'phase-c7-no-executor-v1',
            'execution_started_at', NULL, 'executed_at', NULL, 'execution_result', NULL,
            'verification_status', 'not_started', 'verified_at', NULL,
            'correlation_id', expected_run_correlation_id, 'causation_id', expected_event_signal_id,
            'trace_id', fixture_trace, 'decision_version', 0,
            'approved_payload', NULL, 'approved_payload_digest', NULL, 'decision_idempotency_key', NULL
        );
        INSERT INTO public.agent_actions (
            id, action_type, target_system, requested_by_agent, run_id, signal_ids,
            payload, evidence, source_refs, concise_rationale, risk_level,
            approval_required, status, execution_guard_version, verification_status,
            correlation_id, causation_id, trace_id, idempotency_key
        ) VALUES (
            (fixture->>'id')::UUID, fixture->>'action_type', fixture->>'target_system',
            fixture_agent, event_run.id, ARRAY[expected_event_signal_id], fixture->'payload',
            expected_action->'evidence', expected_action->'source_refs',
            fixture->>'concise_rationale', fixture->>'risk_level', true, 'proposed',
            'phase-c7-no-executor-v1', 'not_started', expected_run_correlation_id,
            expected_event_signal_id, fixture_trace, fixture->>'idempotency_key'
        ) ON CONFLICT DO NOTHING;
        GET DIAGNOSTICS inserted_rows = ROW_COUNT;
        inserted_total := inserted_total + inserted_rows;

        SELECT * INTO stored_action FROM public.agent_actions
        WHERE id = (fixture->>'id')::UUID FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Synthetic fixture key conflicts with a different action ID';
        END IF;
        -- Compare every business field, including decision/executor state; never reset it.
        -- Unrecognized additional schema fields also fail closed for operator review.
        IF (to_jsonb(stored_action) - 'created_at' - 'updated_at') IS DISTINCT FROM expected_action THEN
            RAISE EXCEPTION 'Synthetic action % is changed, decided, or conflicting; no fixture overwrite is allowed', fixture->>'id';
        END IF;
    END LOOP;
    IF (
        SELECT count(*) FROM public.agent_actions
        WHERE requested_by_agent = fixture_agent OR trace_id = fixture_trace
    ) <> 2 THEN
        RAISE EXCEPTION 'Synthetic acceptance namespace must contain exactly two action fixtures';
    END IF;
    RAISE NOTICE 'Issue 318 synthetic proposal seed verified exactly 2 fixtures; inserted %, reused %; no decisions or execution performed', inserted_total, 2 - inserted_total;
END;
$seed$;

COMMIT;

-- Read back only these two explicitly namespaced synthetic fixture rows.
SELECT id, run_id, correlation_id, status, decision_version, approval_required,
       executor_key, execution_started_at, executed_at, idempotency_key
FROM public.agent_actions
WHERE id IN ('31800000-0000-4000-8000-202609030001', '31800000-0000-4000-8000-202609030002')
  AND requested_by_agent = 'synthetic-issue318-acceptance'
  AND idempotency_key IN (
      'synthetic-issue318:acceptance:2026-09-03:v1:proposal:approval',
      'synthetic-issue318:acceptance:2026-09-03:v1:proposal:rejection'
  )
ORDER BY id;
