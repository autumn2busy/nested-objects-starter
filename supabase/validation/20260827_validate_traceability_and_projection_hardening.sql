-- Issue #318, Phase C8 staging validation.
-- Creates only synthetic records in a transaction and always rolls them back.

BEGIN;

SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';

DO $validation$
DECLARE
    owner_subject TEXT := 'synthetic-autumn-stable-subject-c8';
    correlation_uuid UUID := gen_random_uuid();
    member_uuid UUID := gen_random_uuid();
    run_uuid UUID;
    action_uuid UUID := gen_random_uuid();
    experiment_uuid UUID := gen_random_uuid();
    outcome_uuid UUID := gen_random_uuid();
    plan_measurement_uuid UUID := gen_random_uuid();
    completed_measurement_uuid UUID := gen_random_uuid();
    learning_uuid UUID := gen_random_uuid();
    trace_link_uuid UUID := gen_random_uuid();
    run_claim JSONB;
    counts JSONB;
    trace_result JSONB;
    blocked BOOLEAN := false;
BEGIN
    IF to_regclass('public.agent_trace_links') IS NULL
       OR to_regclass('public.agent_outcomes') IS NULL
       OR to_regclass('public.agent_measurements') IS NULL
       OR to_regclass('public.agent_learnings') IS NULL THEN
        RAISE EXCEPTION 'Missing one or more Phase C8 traceability tables';
    END IF;
    IF has_table_privilege('service_role', 'public.member_identity_links', 'UPDATE')
       OR has_table_privilege('service_role', 'public.agent_trace_links', 'INSERT')
       OR has_table_privilege('service_role', 'public.agent_outcomes', 'DELETE')
       OR has_table_privilege('anon', 'public.agent_learnings', 'SELECT') THEN
        RAISE EXCEPTION 'Phase C8 direct privileges exceed the server-only RPC boundary';
    END IF;

    INSERT INTO public.canonical_members (id, identity_status, data_quality_status)
    VALUES (member_uuid, 'resolved', 'partial');
    INSERT INTO public.agent_approvers (
        subject_id, approver_kind, display_name, active, scopes,
        reviewed_by, reviewed_at, review_evidence
    ) VALUES (
        owner_subject, 'owner', 'Synthetic C8 owner', true,
        '["intelligence_os"]'::jsonb, owner_subject, now(),
        jsonb_build_object('fixture', true, 'production', false)
    );
    INSERT INTO public.agent_runtime_destination_bindings (
        binding_key, policy_version, environment, project_ref, destination_fingerprint,
        review_status, reviewed_by, reviewed_at, review_evidence
    ) VALUES (
        'phase-c8-validation-binding', 'phase-c8-validation', 'staging',
        'syntheticstaging318', repeat('b', 64), 'approved', owner_subject, now(),
        jsonb_build_object('scope', 'transactional synthetic Phase C8 validation')
    );

    PERFORM set_config('request.jwt.claim.role', 'service_role', true);

    counts := public.sync_member_identity_links(
        member_uuid,
        jsonb_build_array(
            jsonb_build_object(
                'member_id', member_uuid, 'source_system', 'supabase',
                'identifier_type', 'profile_id', 'external_id', member_uuid::TEXT,
                'normalized_external_id', member_uuid::TEXT, 'status', 'active',
                'is_primary', true, 'confidence', 1, 'verified_at', now(),
                'source_refs', jsonb_build_array(jsonb_build_object('sourceSystem', 'supabase', 'sourceType', 'profiles', 'observedAt', now())),
                'provenance', jsonb_build_object('projection', 'profiles-and-conversion-events'),
                'idempotency_key', 'phase-c8:identity:profile'
            ),
            jsonb_build_object(
                'member_id', member_uuid, 'source_system', 'conversion_events',
                'identifier_type', 'anonymous_id', 'external_id', 'synthetic-anon-c8',
                'normalized_external_id', 'synthetic-anon-c8', 'status', 'active',
                'is_primary', false, 'confidence', 1, 'verified_at', now(),
                'source_refs', jsonb_build_array(jsonb_build_object('sourceSystem', 'conversion_events', 'sourceType', 'anonymous_id', 'observedAt', now())),
                'provenance', jsonb_build_object('projection', 'profiles-and-conversion-events'),
                'idempotency_key', 'phase-c8:identity:anonymous'
            )
        ),
        now()
    );
    IF counts->>'activeCount' <> '2' THEN RAISE EXCEPTION 'Initial identity sync was incomplete'; END IF;

    counts := public.sync_member_identity_links(
        member_uuid,
        jsonb_build_array(jsonb_build_object(
            'member_id', member_uuid, 'source_system', 'supabase',
            'identifier_type', 'profile_id', 'external_id', member_uuid::TEXT,
            'normalized_external_id', member_uuid::TEXT, 'status', 'active',
            'is_primary', true, 'confidence', 1, 'verified_at', now(),
            'source_refs', jsonb_build_array(jsonb_build_object('sourceSystem', 'supabase', 'sourceType', 'profiles', 'observedAt', now())),
            'provenance', jsonb_build_object('projection', 'profiles-and-conversion-events'),
            'idempotency_key', 'phase-c8:identity:profile'
        )),
        now()
    );
    IF counts->>'revokedCount' <> '1'
       OR NOT EXISTS (
          SELECT 1 FROM public.member_identity_links
          WHERE idempotency_key = 'phase-c8:identity:anonymous'
            AND status = 'revoked'
            AND provenance->>'revocationReason' = 'absent_from_current_projection'
       )
       OR NOT EXISTS (
          SELECT 1 FROM public.member_identity_links
          WHERE idempotency_key = 'phase-c8:identity:profile' AND status = 'active'
       ) THEN
        RAISE EXCEPTION 'Stale identity link was not auditably revoked while the current link remained active';
    END IF;

    run_claim := public.claim_agent_workflow_run(
        'operations-orchestrator', 'conversion_review', 'phase-c8-v1',
        'wrun_phase_c8_validation', 'conversion_review@phase-c8-v1',
        'phase-c8-v1', jsonb_build_object('fixture', 'synthetic-c8'),
        'phase-c8:validation:run', 3, 300, now(), correlation_uuid,
        NULL, 'trace-phase-c8-validation', repeat('b', 64)
    );
    run_uuid := (run_claim#>>'{run,runId}')::UUID;

    INSERT INTO public.experiments (
        id, name, hypothesis, status, audience, primary_metric,
        minimum_sample_size, minimum_duration_days, guardrails,
        correlation_id, causation_id, idempotency_key
    ) VALUES (
        experiment_uuid, 'Synthetic C8 experiment', 'A bounded synthetic change produces a measurable result.',
        'draft', jsonb_build_object('fixture', true), 'conversion.rate', 100, 7,
        jsonb_build_object('mutationAllowed', false), correlation_uuid, NULL,
        'phase-c8:validation:experiment'
    );
    INSERT INTO public.agent_actions (
        id, action_type, target_system, requested_by_agent, run_id, experiment_id,
        signal_ids, payload, evidence, source_refs, concise_rationale, risk_level,
        approval_required, status, execution_guard_version, verification_status,
        correlation_id, causation_id, trace_id, idempotency_key
    ) VALUES (
        action_uuid, 'synthetic.review_candidate', 'synthetic', 'phase-c8-validation',
        run_uuid, experiment_uuid, '{}'::UUID[], jsonb_build_object('mutationAllowed', false),
        '[]'::jsonb, '[]'::jsonb, 'Synthetic traceability and approval validation.',
        'high', true, 'proposed', 'phase-c8-no-executor-v1', 'not_started',
        correlation_uuid, run_uuid, 'trace-phase-c8-validation', 'phase-c8:validation:action'
    );

    counts := public.persist_agent_trace_links(run_uuid, jsonb_build_array(jsonb_build_object(
        'id', trace_link_uuid, 'relationship', 'workflow_persisted_artifact',
        'from_type', 'agent_run', 'from_id', run_uuid::TEXT,
        'to_type', 'agent_action', 'to_id', action_uuid::TEXT,
        'run_id', run_uuid, 'experiment_id', experiment_uuid,
        'evidence', jsonb_build_array(), 'source_refs', jsonb_build_array(),
        'idempotency_key', 'phase-c8:trace:run-action', 'record_checksum', repeat('1', 64),
        'correlation_id', correlation_uuid, 'causation_id', run_uuid,
        'trace_id', 'trace-phase-c8-validation'
    )));
    IF counts->>'linkCount' <> '1' THEN RAISE EXCEPTION 'Trace link was not persisted'; END IF;
    PERFORM public.persist_agent_trace_links(run_uuid, jsonb_build_array(jsonb_build_object(
        'id', trace_link_uuid, 'relationship', 'workflow_persisted_artifact',
        'from_type', 'agent_run', 'from_id', run_uuid::TEXT,
        'to_type', 'agent_action', 'to_id', action_uuid::TEXT,
        'run_id', run_uuid, 'experiment_id', experiment_uuid,
        'evidence', jsonb_build_array(), 'source_refs', jsonb_build_array(),
        'idempotency_key', 'phase-c8:trace:run-action', 'record_checksum', repeat('1', 64),
        'correlation_id', correlation_uuid, 'causation_id', run_uuid,
        'trace_id', 'trace-phase-c8-validation'
    )));
    blocked := false;
    BEGIN
        PERFORM public.persist_agent_trace_links(run_uuid, jsonb_build_array(jsonb_build_object(
            'id', trace_link_uuid, 'relationship', 'workflow_persisted_artifact',
            'from_type', 'agent_run', 'from_id', run_uuid::TEXT,
            'to_type', 'agent_action', 'to_id', action_uuid::TEXT,
            'run_id', run_uuid, 'experiment_id', experiment_uuid,
            'evidence', jsonb_build_array(), 'source_refs', jsonb_build_array(),
            'idempotency_key', 'phase-c8:trace:run-action', 'record_checksum', repeat('2', 64),
            'correlation_id', correlation_uuid, 'causation_id', run_uuid,
            'trace_id', 'trace-phase-c8-validation'
        )));
    EXCEPTION WHEN OTHERS THEN
        IF position('different content' IN SQLERRM) > 0 THEN blocked := true; ELSE RAISE; END IF;
    END;
    IF NOT blocked THEN RAISE EXCEPTION 'Changed trace content reused an idempotency key'; END IF;

    PERFORM public.persist_agent_learning_trace(
        '[]'::jsonb,
        jsonb_build_array(jsonb_build_object(
            'id', plan_measurement_uuid, 'metric_name', 'conversion.rate',
            'action_id', action_uuid, 'run_id', run_uuid, 'experiment_id', experiment_uuid,
            'outcome_id', NULL, 'plan_measurement_id', NULL, 'status', 'planned',
            'numeric_value', NULL, 'value_state', 'unknown', 'unit', 'ratio',
            'minimum_sample_size', 100, 'minimum_duration_days', 7,
            'observed_sample_size', 0, 'observed_duration_days', 0,
            'evidence', jsonb_build_array(), 'source_refs', jsonb_build_array(),
            'measured_at', NULL, 'idempotency_key', 'phase-c8:measurement:plan',
            'record_checksum', repeat('3', 64), 'correlation_id', correlation_uuid,
            'causation_id', action_uuid, 'trace_id', 'trace-phase-c8-validation'
        )),
        '[]'::jsonb,
        '[]'::jsonb
    );

    counts := public.persist_agent_learning_trace(
        jsonb_build_array(jsonb_build_object(
            'id', outcome_uuid, 'outcome_type', 'experiment_conversion_lift',
            'action_id', action_uuid, 'run_id', run_uuid, 'experiment_id', experiment_uuid,
            'signal_ids', jsonb_build_array(), 'state', 'verified',
            'summary', 'Synthetic outcome cleared the committed thresholds.',
            'evidence', jsonb_build_array(), 'source_refs', jsonb_build_array(),
            'observed_at', now(), 'verification_status', 'verified',
            'idempotency_key', 'phase-c8:outcome', 'record_checksum', repeat('4', 64),
            'correlation_id', correlation_uuid, 'causation_id', action_uuid,
            'trace_id', 'trace-phase-c8-validation'
        )),
        jsonb_build_array(jsonb_build_object(
            'id', completed_measurement_uuid, 'metric_name', 'conversion.rate',
            'action_id', action_uuid, 'run_id', run_uuid, 'experiment_id', experiment_uuid,
            'outcome_id', outcome_uuid, 'plan_measurement_id', plan_measurement_uuid,
            'status', 'complete', 'numeric_value', 0.12, 'value_state', 'known', 'unit', 'ratio',
            'minimum_sample_size', 100, 'minimum_duration_days', 7,
            'observed_sample_size', 120, 'observed_duration_days', 14,
            'evidence', jsonb_build_array(), 'source_refs', jsonb_build_array(), 'measured_at', now(),
            'idempotency_key', 'phase-c8:measurement:complete', 'record_checksum', repeat('5', 64),
            'correlation_id', correlation_uuid, 'causation_id', outcome_uuid,
            'trace_id', 'trace-phase-c8-validation'
        )),
        jsonb_build_array(jsonb_build_object(
            'id', learning_uuid, 'learning_type', 'experiment_result',
            'action_id', action_uuid, 'experiment_id', experiment_uuid, 'outcome_id', outcome_uuid,
            'measurement_ids', jsonb_build_array(completed_measurement_uuid),
            'summary', 'Synthetic thresholds support a candidate learning.',
            'decision', 'Retain for owner review; never auto-execute.', 'confidence', 0.9,
            'review_status', 'candidate', 'evidence', jsonb_build_array(), 'source_refs', jsonb_build_array(),
            'learned_at', now(), 'idempotency_key', 'phase-c8:learning', 'record_checksum', repeat('6', 64),
            'correlation_id', correlation_uuid, 'causation_id', outcome_uuid,
            'trace_id', 'trace-phase-c8-validation'
        )),
        jsonb_build_array(
            jsonb_build_object(
                'id', gen_random_uuid(), 'relationship', 'action_produced_outcome',
                'from_type', 'agent_action', 'from_id', action_uuid::TEXT,
                'to_type', 'agent_outcome', 'to_id', outcome_uuid::TEXT,
                'run_id', run_uuid, 'experiment_id', experiment_uuid,
                'evidence', jsonb_build_array(), 'source_refs', jsonb_build_array(),
                'idempotency_key', 'phase-c8:trace:action-outcome', 'record_checksum', repeat('7', 64),
                'correlation_id', correlation_uuid, 'causation_id', action_uuid,
                'trace_id', 'trace-phase-c8-validation'
            ),
            jsonb_build_object(
                'id', gen_random_uuid(), 'relationship', 'outcome_measured_by',
                'from_type', 'agent_outcome', 'from_id', outcome_uuid::TEXT,
                'to_type', 'agent_measurement', 'to_id', completed_measurement_uuid::TEXT,
                'run_id', run_uuid, 'experiment_id', experiment_uuid,
                'evidence', jsonb_build_array(), 'source_refs', jsonb_build_array(),
                'idempotency_key', 'phase-c8:trace:outcome-measurement', 'record_checksum', repeat('8', 64),
                'correlation_id', correlation_uuid, 'causation_id', outcome_uuid,
                'trace_id', 'trace-phase-c8-validation'
            ),
            jsonb_build_object(
                'id', gen_random_uuid(), 'relationship', 'measurement_produced_learning',
                'from_type', 'agent_measurement', 'from_id', completed_measurement_uuid::TEXT,
                'to_type', 'agent_learning', 'to_id', learning_uuid::TEXT,
                'run_id', run_uuid, 'experiment_id', experiment_uuid,
                'evidence', jsonb_build_array(), 'source_refs', jsonb_build_array(),
                'idempotency_key', 'phase-c8:trace:measurement-learning', 'record_checksum', repeat('9', 64),
                'correlation_id', correlation_uuid, 'causation_id', outcome_uuid,
                'trace_id', 'trace-phase-c8-validation'
            )
        )
    );
    IF counts->>'outcomeCount' <> '1' OR counts->>'measurementCount' <> '1'
       OR counts->>'learningCount' <> '1' OR counts->>'linkCount' <> '3' THEN
        RAISE EXCEPTION 'Outcome, measurement, learning, and trace batch was incomplete';
    END IF;

    PERFORM public.decide_agent_action(
        action_uuid, 'approved', 0, jsonb_build_object('mutationAllowed', false),
        repeat('d', 64), 'Synthetic owner reviewed the complete C8 trace.', owner_subject,
        repeat('a', 64), now() + interval '5 minutes', now(), 'phase-c8:decision:approval'
    );
    IF NOT EXISTS (
        SELECT 1 FROM public.agent_trace_links
        WHERE relationship = 'action_has_approval_state'
          AND from_id = action_uuid::TEXT
          AND correlation_id = correlation_uuid
    ) THEN RAISE EXCEPTION 'Approval state did not preserve the action correlation'; END IF;

    trace_result := public.get_agent_correlation_trace(owner_subject, correlation_uuid);
    IF jsonb_array_length(trace_result->'links') < 5
       OR jsonb_array_length(trace_result->'outcomes') <> 1
       OR jsonb_array_length(trace_result->'measurements') <> 2
       OR jsonb_array_length(trace_result->'learnings') <> 1 THEN
        RAISE EXCEPTION 'Owner correlation trace omitted part of the operating thread';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('agent_trace_links', 'agent_outcomes', 'agent_measurements', 'agent_learnings')
          AND column_name ~* '(chain.?of.?thought|private.?reasoning|hidden.?reasoning|scratchpad)'
    ) THEN RAISE EXCEPTION 'A private chain-of-thought storage column exists'; END IF;

    RAISE NOTICE 'PASS: Phase C8 identity revocation, immutable artifact trace, approval correlation, later measurement, and candidate learning validated.';
END;
$validation$;

ROLLBACK;

DO $post_rollback$
BEGIN
    IF EXISTS (SELECT 1 FROM public.member_identity_links WHERE idempotency_key LIKE 'phase-c8:%')
       OR EXISTS (SELECT 1 FROM public.agent_trace_links WHERE idempotency_key LIKE 'phase-c8:%')
       OR EXISTS (SELECT 1 FROM public.agent_learnings WHERE idempotency_key LIKE 'phase-c8:%') THEN
        RAISE EXCEPTION 'Synthetic Phase C8 records survived rollback';
    END IF;
    RAISE NOTICE 'PASS: Synthetic Phase C8 records were rolled back.';
END;
$post_rollback$;
