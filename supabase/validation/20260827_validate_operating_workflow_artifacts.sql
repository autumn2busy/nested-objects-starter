-- Issue #318, Phase C5 staging validation.
-- Creates synthetic operating-review artifacts in one transaction and always rolls them back.

BEGIN;

SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';

DO $validation$
DECLARE
    correlation_uuid UUID := gen_random_uuid();
    run_claim JSONB;
    quiet_run_claim JSONB;
    run_uuid UUID;
    quiet_run_uuid UUID;
    signal_uuid UUID := gen_random_uuid();
    recommendation_uuid UUID := gen_random_uuid();
    task_uuid UUID := gen_random_uuid();
    experiment_uuid UUID := gen_random_uuid();
    action_uuid UUID := gen_random_uuid();
    review_uuid UUID := gen_random_uuid();
    quiet_review_uuid UUID := gen_random_uuid();
    counts JSONB;
    duplicate_counts JSONB;
    disposition TEXT;
    blocked BOOLEAN := false;
BEGIN
    IF to_regclass('public.agent_orchestrator_states') IS NULL
       OR to_regclass('public.agent_recommendations') IS NULL
       OR to_regclass('public.agent_operating_reviews') IS NULL THEN
        RAISE EXCEPTION 'Missing one or more Phase C5 operating workflow tables';
    END IF;
    IF has_table_privilege('service_role', 'public.agent_operating_reviews', 'INSERT')
       OR has_table_privilege('service_role', 'public.agent_recommendations', 'UPDATE')
       OR has_table_privilege('anon', 'public.agent_orchestrator_states', 'SELECT') THEN
        RAISE EXCEPTION 'Operating workflow table privileges exceed the server-only read boundary';
    END IF;

    INSERT INTO public.agent_runtime_destination_bindings (
        binding_key, policy_version, environment, project_ref, destination_fingerprint,
        review_status, reviewed_by, reviewed_at, review_evidence
    ) VALUES (
        'phase-c5-validation-binding', 'phase-c5-validation', 'staging',
        'syntheticstaging318', repeat('b', 64), 'approved', 'autumn', now(),
        jsonb_build_object('scope', 'transactional synthetic Phase C5 validation')
    );

    PERFORM set_config('request.jwt.claim.role', 'service_role', true);

    disposition := public.persist_agent_orchestrator_state(
        'phase-c5:state:conversion',
        'conversion_review',
        jsonb_build_object('status', 'completed', 'priorities', jsonb_build_array()),
        correlation_uuid,
        NULL
    );
    IF disposition <> 'created' THEN RAISE EXCEPTION 'First orchestrator state was not created'; END IF;
    disposition := public.persist_agent_orchestrator_state(
        'phase-c5:state:conversion',
        'conversion_review',
        jsonb_build_object('status', 'completed', 'priorities', jsonb_build_array()),
        correlation_uuid,
        NULL
    );
    IF disposition <> 'reused' THEN RAISE EXCEPTION 'Duplicate orchestrator state was not reused'; END IF;

    blocked := false;
    BEGIN
        PERFORM public.persist_agent_orchestrator_state(
            'phase-c5:state:conversion', 'conversion_review',
            jsonb_build_object('status', 'changed'), correlation_uuid, NULL
        );
    EXCEPTION WHEN OTHERS THEN
        IF position('different state' IN SQLERRM) > 0 THEN blocked := true; ELSE RAISE; END IF;
    END;
    IF NOT blocked THEN RAISE EXCEPTION 'Changed orchestrator state reused an idempotency key'; END IF;

    run_claim := public.claim_agent_workflow_run(
        'operations-orchestrator', 'conversion_review', 'phase-c5-v1',
        'wrun_phase_c5_validation_conversion', 'conversion_review@phase-c5-v1',
        'phase-c5-v1', jsonb_build_object('fixture', 'synthetic-conversion'),
        'phase-c5:validation:conversion', 3, 300, now(), correlation_uuid,
        NULL, 'trace-phase-c5-validation', repeat('b', 64)
    );
    run_uuid := (run_claim#>>'{run,runId}')::UUID;

    counts := public.persist_agent_operating_workflow_batch(
        run_uuid,
        'conversion_review',
        jsonb_build_object(
            'id', review_uuid,
            'run_id', run_uuid,
            'workflow_name', 'conversion_review',
            'review_date', '2026-08-27',
            'status', 'completed',
            'executive_summary', 'Synthetic conversion review.',
            'priorities', jsonb_build_array(jsonb_build_object('rank', 1, 'signalId', signal_uuid)),
            'autumn_decisions', jsonb_build_array(jsonb_build_object('id', gen_random_uuid(), 'actionId', action_uuid)),
            'output', jsonb_build_object('priorityCount', 1),
            'idempotency_key', 'phase-c5:review:conversion',
            'correlation_id', correlation_uuid,
            'causation_id', NULL
        ),
        jsonb_build_array(jsonb_build_object(
            'id', signal_uuid,
            'signal_type', 'growth.synthetic_conversion_anomaly',
            'domain', 'growth',
            'producer', 'growth-agent',
            'title', 'Synthetic conversion anomaly',
            'summary', 'Synthetic bounded validation signal.',
            'evidence', jsonb_build_array(),
            'source_refs', jsonb_build_array(),
            'confidence', 1,
            'severity', 'high',
            'priority', 90,
            'business_impact', 'Synthetic validation impact.',
            'affected_entities', jsonb_build_array(),
            'recommended_follow_up', 'Review synthetic evidence.',
            'fingerprint', 'phase-c5-validation-conversion-signal',
            'idempotency_key', 'phase-c5:signal:conversion',
            'status', 'new',
            'first_detected_at', now(),
            'last_detected_at', now(),
            'correlation_id', correlation_uuid,
            'causation_id', NULL
        )),
        jsonb_build_array(jsonb_build_object(
            'id', recommendation_uuid,
            'recommendation_type', 'growth',
            'title', 'Review synthetic conversion anomaly',
            'summary', 'Review evidence before acting.',
            'priority', 90,
            'source_refs', jsonb_build_array(),
            'recommended_follow_up', 'Review synthetic evidence.',
            'fingerprint', 'phase-c5-validation-recommendation',
            'idempotency_key', 'phase-c5:recommendation:conversion',
            'correlation_id', correlation_uuid,
            'causation_id', signal_uuid
        )),
        jsonb_build_array(jsonb_build_object(
            'id', task_uuid,
            'task_type', 'investigate_signal',
            'assigned_agent', 'growth-agent',
            'status', 'pending',
            'priority', 90,
            'input', jsonb_build_object('signalId', signal_uuid),
            'concise_rationale', 'Review synthetic signal.',
            'signal_id', signal_uuid,
            'idempotency_key', 'phase-c5:task:conversion',
            'max_attempts', 3,
            'correlation_id', correlation_uuid,
            'causation_id', signal_uuid,
            'trace_id', 'trace-phase-c5-validation'
        )),
        jsonb_build_array(jsonb_build_object(
            'id', experiment_uuid,
            'name', 'Synthetic conversion experiment',
            'hypothesis', 'A synthetic proposal can be persisted without execution.',
            'status', 'draft',
            'audience', jsonb_build_object('audienceDefinitionId', 'synthetic-audience'),
            'primary_metric', 'subscriptions.upgraded.confirmed',
            'minimum_sample_size', 100,
            'minimum_duration_days', 14,
            'guardrails', jsonb_build_object('rules', jsonb_build_array('No mutation')),
            'idempotency_key', 'phase-c5:experiment:conversion',
            'correlation_id', correlation_uuid,
            'causation_id', signal_uuid
        )),
        jsonb_build_array(jsonb_build_object(
            'id', action_uuid,
            'action_type', 'activecampaign.change_campaign',
            'target_system', 'activecampaign',
            'requested_by_agent', 'marketing-agent',
            'task_id', task_uuid,
            'experiment_id', experiment_uuid,
            'signal_ids', jsonb_build_array(signal_uuid),
            'payload', jsonb_build_object('mutationAllowed', false, 'operation', 'review_only'),
            'evidence', jsonb_build_array(),
            'source_refs', jsonb_build_array(),
            'concise_rationale', 'Synthetic proposal requiring Autumn approval.',
            'risk_level', 'high',
            'approval_required', true,
            'status', 'proposed',
            'execution_guard_version', 'phase-b-v1',
            'verification_status', 'not_started',
            'idempotency_key', 'phase-c5:action:conversion',
            'correlation_id', correlation_uuid,
            'causation_id', signal_uuid,
            'trace_id', 'trace-phase-c5-validation'
        ))
    );
    IF counts <> jsonb_build_object(
        'signalCount', 1, 'recommendationCount', 1, 'taskCount', 1,
        'experimentCount', 1, 'actionCount', 1, 'reviewCount', 1
    ) THEN RAISE EXCEPTION 'Operating artifact counts do not match the input batch'; END IF;

    duplicate_counts := public.persist_agent_operating_workflow_batch(
        run_uuid,
        'conversion_review',
        (SELECT jsonb_build_object(
            'id', id, 'run_id', run_id, 'workflow_name', workflow_name,
            'review_date', review_date, 'status', status,
            'executive_summary', executive_summary, 'priorities', priorities,
            'autumn_decisions', autumn_decisions, 'output', output,
            'idempotency_key', idempotency_key, 'correlation_id', correlation_id,
            'causation_id', causation_id
        ) FROM public.agent_operating_reviews WHERE id = review_uuid),
        jsonb_build_array((SELECT to_jsonb(s) - 'created_at' - 'updated_at' - 'experiment_id' - 'data_quality'
            FROM public.intelligence_signals AS s WHERE id = signal_uuid)),
        jsonb_build_array((SELECT to_jsonb(r) - 'created_at' - 'updated_at'
            FROM public.agent_recommendations AS r WHERE id = recommendation_uuid)),
        jsonb_build_array((SELECT to_jsonb(t) - 'created_at' - 'updated_at' - 'output' - 'parent_task_id'
            - 'experiment_id' - 'retry_after' - 'started_at' - 'completed_at' - 'error'
            FROM public.agent_tasks AS t WHERE id = task_uuid)),
        jsonb_build_array((SELECT to_jsonb(e) - 'created_at' - 'updated_at' - 'secondary_metrics'
            - 'baseline' - 'target' - 'observed_sample_size' - 'observed_duration_days'
            - 'analysis_state' - 'started_at' - 'ended_at' - 'result' - 'confidence'
            - 'decision' - 'source_action_ids'
            FROM public.experiments AS e WHERE id = experiment_uuid)),
        jsonb_build_array(jsonb_build_object(
            'id', action_uuid, 'action_type', 'activecampaign.change_campaign',
            'target_system', 'activecampaign', 'requested_by_agent', 'marketing-agent',
            'task_id', task_uuid, 'experiment_id', experiment_uuid,
            'signal_ids', jsonb_build_array(signal_uuid),
            'payload', jsonb_build_object('mutationAllowed', false, 'operation', 'review_only'),
            'evidence', jsonb_build_array(), 'source_refs', jsonb_build_array(),
            'concise_rationale', 'Synthetic proposal requiring Autumn approval.',
            'risk_level', 'high', 'approval_required', true, 'status', 'proposed',
            'execution_guard_version', 'phase-b-v1', 'verification_status', 'not_started',
            'idempotency_key', 'phase-c5:action:conversion',
            'correlation_id', correlation_uuid, 'causation_id', signal_uuid,
            'trace_id', 'trace-phase-c5-validation'
        ))
    );
    IF duplicate_counts IS DISTINCT FROM counts THEN
        RAISE EXCEPTION 'Duplicate operating batch did not return stable verification counts';
    END IF;

    blocked := false;
    BEGIN
        PERFORM public.persist_agent_operating_workflow_batch(
            run_uuid,
            'conversion_review',
            (SELECT jsonb_build_object(
                'id', id, 'run_id', run_id, 'workflow_name', workflow_name,
                'review_date', review_date, 'status', status,
                'executive_summary', executive_summary, 'priorities', priorities,
                'autumn_decisions', autumn_decisions, 'output', output,
                'idempotency_key', idempotency_key, 'correlation_id', correlation_id,
                'causation_id', causation_id
            ) FROM public.agent_operating_reviews WHERE id = review_uuid),
            '[]'::jsonb,
            jsonb_build_array(jsonb_build_object(
                'id', recommendation_uuid,
                'recommendation_type', 'growth',
                'title', 'Review synthetic conversion anomaly',
                'summary', 'Changed output must fail closed.',
                'priority', 90,
                'source_refs', jsonb_build_array(),
                'recommended_follow_up', 'Review synthetic evidence.',
                'fingerprint', 'phase-c5-validation-recommendation',
                'idempotency_key', 'phase-c5:recommendation:conversion',
                'correlation_id', correlation_uuid,
                'causation_id', signal_uuid
            )),
            '[]'::jsonb, '[]'::jsonb, '[]'::jsonb
        );
    EXCEPTION WHEN OTHERS THEN
        IF position('recommendation idempotency key was reused with different output' IN SQLERRM) > 0 THEN
            blocked := true;
        ELSE
            RAISE;
        END IF;
    END;
    IF NOT blocked THEN
        RAISE EXCEPTION 'Changed recommendation reused an idempotency key';
    END IF;

    IF (SELECT count(*) FROM public.agent_operating_reviews WHERE id = review_uuid) <> 1
       OR (SELECT count(*) FROM public.agent_tasks WHERE id = task_uuid) <> 1
       OR (SELECT count(*) FROM public.agent_actions WHERE id = action_uuid) <> 1 THEN
        RAISE EXCEPTION 'Duplicate operating batch created duplicate artifacts';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.agent_actions
        WHERE id = action_uuid AND status = 'proposed' AND approval_required
          AND executor_key IS NULL AND execution_started_at IS NULL AND executed_at IS NULL
    ) THEN RAISE EXCEPTION 'Proposed action escaped the no-execution approval boundary'; END IF;

    quiet_run_claim := public.claim_agent_workflow_run(
        'operations-orchestrator', 'daily_business_health', 'phase-c5-v1',
        'wrun_phase_c5_validation_quiet', 'daily_business_health@phase-c5-v1',
        'phase-c5-v1', jsonb_build_object('fixture', 'synthetic-healthy'),
        'phase-c5:validation:daily-quiet', 3, 300, now(), correlation_uuid,
        NULL, 'trace-phase-c5-validation', repeat('b', 64)
    );
    quiet_run_uuid := (quiet_run_claim#>>'{run,runId}')::UUID;
    counts := public.persist_agent_operating_workflow_batch(
        quiet_run_uuid,
        'daily_business_health',
        jsonb_build_object(
            'id', quiet_review_uuid, 'run_id', quiet_run_uuid,
            'workflow_name', 'daily_business_health', 'review_date', '2026-08-27',
            'status', 'quiet', 'executive_summary', 'Synthetic healthy daily review.',
            'priorities', jsonb_build_array(), 'autumn_decisions', jsonb_build_array(),
            'output', jsonb_build_object('priorityCount', 0, 'notificationRequired', false),
            'idempotency_key', 'phase-c5:review:daily-quiet',
            'correlation_id', correlation_uuid, 'causation_id', NULL
        ),
        '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb
    );
    IF counts->>'signalCount' <> '0'
       OR NOT EXISTS (
           SELECT 1 FROM public.agent_operating_reviews
           WHERE id = quiet_review_uuid AND status = 'quiet'
             AND jsonb_array_length(priorities) = 0
             AND jsonb_array_length(autumn_decisions) = 0
       ) THEN RAISE EXCEPTION 'Healthy daily workflow did not persist a quiet zero-signal review'; END IF;

    RAISE NOTICE 'PASS: Phase C5 operating state, atomic artifacts, duplicate reuse, approval boundary, and quiet daily review validated.';
END;
$validation$;

SELECT 'PASS: Intelligence OS Phase C5 operating workflow validation completed. Synthetic records were rolled back.' AS validation_result;

ROLLBACK;
