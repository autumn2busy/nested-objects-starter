-- Issue #318, Phase C3 staging validation.
-- Creates only synthetic rows inside a transaction and always rolls them back.
-- Expected result: one row containing PASS.

BEGIN;

SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';

DO $validation$
DECLARE
    required_function TEXT;
    privilege_name TEXT;
    correlation_uuid UUID := gen_random_uuid();
    first_claim JSONB;
    duplicate_claim JSONB;
    completed_claim JSONB;
    step_claim JSONB;
    completed_step JSONB;
    retry_claim JSONB;
    stale_claim JSONB;
    run_uuid UUID;
    stale_run_uuid UUID;
    claim_token UUID;
    blocked BOOLEAN := false;
    stale_count INTEGER;
BEGIN
    IF to_regclass('public.agent_runtime_destination_bindings') IS NULL
       OR to_regclass('public.agent_workflow_steps') IS NULL THEN
        RAISE EXCEPTION 'Missing one or more Phase C3 durable workflow tables';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'agent_runs'
          AND column_name = 'verification_status'
    ) THEN
        RAISE EXCEPTION 'agent_runs is missing Phase C3 verification state';
    END IF;

    FOREACH required_function IN ARRAY ARRAY[
        'verify_agent_runtime_destination',
        'claim_agent_workflow_run',
        'claim_agent_workflow_step',
        'complete_agent_workflow_step',
        'fail_agent_workflow_step',
        'persist_agent_workflow_signals',
        'complete_agent_workflow_run',
        'fail_agent_workflow_run',
        'mark_stale_agent_workflow_runs'
    ]
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc AS procedure
            JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
            WHERE namespace.nspname = 'public' AND procedure.proname = required_function
        ) THEN
            RAISE EXCEPTION 'Missing Phase C3 function: public.%', required_function;
        END IF;
    END LOOP;

    FOREACH privilege_name IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE']
    LOOP
        IF has_table_privilege('service_role', 'public.agent_runtime_destination_bindings', privilege_name) THEN
            RAISE EXCEPTION 'Runtime service role unexpectedly has % on the reviewed destination sentinel', privilege_name;
        END IF;
    END LOOP;
    IF NOT has_table_privilege('service_role', 'public.agent_runtime_destination_bindings', 'SELECT') THEN
        RAISE EXCEPTION 'Runtime service role cannot verify the reviewed destination sentinel';
    END IF;
    IF has_table_privilege('anon', 'public.agent_workflow_steps', 'SELECT')
       OR has_table_privilege('authenticated', 'public.agent_workflow_steps', 'SELECT') THEN
        RAISE EXCEPTION 'Durable workflow steps are unexpectedly visible to a public role';
    END IF;

    INSERT INTO public.agent_runtime_destination_bindings (
        binding_key,
        policy_version,
        environment,
        project_ref,
        destination_fingerprint,
        review_status,
        reviewed_by,
        reviewed_at,
        review_evidence
    ) VALUES (
        'validation-staging-binding',
        'phase-c3-validation',
        'staging',
        'syntheticstaging318',
        repeat('a', 64),
        'approved',
        'autumn',
        now(),
        jsonb_build_object('scope', 'transactional synthetic validation')
    );

    PERFORM set_config('request.jwt.claim.role', 'service_role', true);

    IF NOT public.verify_agent_runtime_destination(
        'validation-staging-binding',
        'phase-c3-validation',
        'syntheticstaging318',
        repeat('a', 64)
    ) THEN
        RAISE EXCEPTION 'Reviewed staging destination sentinel did not verify';
    END IF;

    first_claim := public.claim_agent_workflow_run(
        'operations-orchestrator',
        'lifecycle-integrity-check',
        'phase-c3-v1',
        'wrun_validation_first',
        'lifecycle-integrity-check@phase-c3-v1',
        'phase-c3-v1',
        jsonb_build_object('fixture', 'synthetic-validation'),
        'phase-c3:validation:duplicate-run',
        3,
        300,
        now(),
        correlation_uuid,
        NULL,
        'trace-validation',
        repeat('a', 64)
    );
    IF first_claim->>'disposition' <> 'claimed' THEN
        RAISE EXCEPTION 'First durable run delivery was not claimed';
    END IF;
    run_uuid := (first_claim#>>'{run,runId}')::UUID;

    duplicate_claim := public.claim_agent_workflow_run(
        'operations-orchestrator',
        'lifecycle-integrity-check',
        'phase-c3-v1',
        'wrun_validation_duplicate',
        'lifecycle-integrity-check@phase-c3-v1',
        'phase-c3-v1',
        jsonb_build_object('fixture', 'synthetic-validation'),
        'phase-c3:validation:duplicate-run',
        3,
        300,
        now(),
        correlation_uuid,
        NULL,
        'trace-validation',
        repeat('a', 64)
    );
    IF duplicate_claim->>'disposition' <> 'busy'
       OR (duplicate_claim#>>'{run,runId}')::UUID <> run_uuid THEN
        RAISE EXCEPTION 'Duplicate durable run delivery did not converge on the first run';
    END IF;

    step_claim := public.claim_agent_workflow_step(
        run_uuid,
        'validation-step',
        'step_validation_first',
        jsonb_build_object('fixtureCount', 1),
        3,
        180,
        correlation_uuid,
        NULL,
        'trace-validation'
    );
    IF step_claim->>'disposition' <> 'claimed' THEN
        RAISE EXCEPTION 'First durable step delivery was not claimed';
    END IF;
    claim_token := (step_claim#>>'{step,claimToken}')::UUID;

    completed_step := public.complete_agent_workflow_step(
        run_uuid,
        'validation-step',
        claim_token,
        jsonb_build_object('result', 'synthetic'),
        '[]'::jsonb,
        correlation_uuid,
        NULL,
        'trace-validation'
    );
    IF completed_step->>'status' <> 'succeeded' THEN
        RAISE EXCEPTION 'Durable step did not persist successful completion';
    END IF;

    step_claim := public.claim_agent_workflow_step(
        run_uuid,
        'validation-step',
        'step_validation_resume',
        jsonb_build_object('fixtureCount', 1),
        3,
        180,
        correlation_uuid,
        NULL,
        'trace-validation'
    );
    IF step_claim->>'disposition' <> 'reused'
       OR step_claim#>>'{step,output,result}' <> 'synthetic' THEN
        RAISE EXCEPTION 'Completed durable step output was not reused on resume';
    END IF;

    retry_claim := public.claim_agent_workflow_step(
        run_uuid,
        'validation-retry-step',
        'step_validation_retry_first',
        jsonb_build_object('fixtureCount', 1),
        3,
        180,
        correlation_uuid,
        NULL,
        'trace-validation'
    );
    claim_token := (retry_claim#>>'{step,claimToken}')::UUID;
    PERFORM public.fail_agent_workflow_step(
        run_uuid,
        'validation-retry-step',
        claim_token,
        jsonb_build_object(
            'code', 'SYNTHETIC_TRANSIENT',
            'message', 'Synthetic retry validation.',
            'retryable', true,
            'details', '{}'::jsonb,
            'occurredAt', now()
        ),
        now() + interval '5 minutes',
        correlation_uuid,
        NULL,
        'trace-validation'
    );
    retry_claim := public.claim_agent_workflow_step(
        run_uuid,
        'validation-retry-step',
        'step_validation_retry_early',
        jsonb_build_object('fixtureCount', 1),
        3,
        180,
        correlation_uuid,
        NULL,
        'trace-validation'
    );
    IF retry_claim->>'disposition' <> 'busy' THEN
        RAISE EXCEPTION 'Retry backoff was not enforced before retry_after';
    END IF;
    UPDATE public.agent_workflow_steps
    SET retry_after = now() - interval '1 second'
    WHERE run_id = run_uuid AND step_key = 'validation-retry-step';
    retry_claim := public.claim_agent_workflow_step(
        run_uuid,
        'validation-retry-step',
        'step_validation_retry_second',
        jsonb_build_object('fixtureCount', 1),
        3,
        180,
        correlation_uuid,
        NULL,
        'trace-validation'
    );
    IF retry_claim->>'disposition' <> 'claimed'
       OR (retry_claim#>>'{step,attempt}')::INTEGER <> 2 THEN
        RAISE EXCEPTION 'Retry did not become claimable after retry_after';
    END IF;
    claim_token := (retry_claim#>>'{step,claimToken}')::UUID;
    PERFORM public.complete_agent_workflow_step(
        run_uuid,
        'validation-retry-step',
        claim_token,
        jsonb_build_object('result', 'synthetic-retry-complete'),
        '[]'::jsonb,
        correlation_uuid,
        NULL,
        'trace-validation'
    );

    IF public.persist_agent_workflow_signals(run_uuid, '[]'::jsonb) <> 0 THEN
        RAISE EXCEPTION 'Empty bounded signal batch returned a nonzero persistence count';
    END IF;

    PERFORM public.complete_agent_workflow_run(
        run_uuid,
        jsonb_build_object('signalCount', 0, 'persistedSignalCount', 0),
        '[]'::jsonb,
        NULL,
        NULL,
        NULL,
        jsonb_build_object('status', 'verified', 'signalCount', 0, 'persistedSignalCount', 0),
        correlation_uuid,
        NULL,
        'trace-validation'
    );

    completed_claim := public.claim_agent_workflow_run(
        'operations-orchestrator',
        'lifecycle-integrity-check',
        'phase-c3-v1',
        'wrun_validation_after_completion',
        'lifecycle-integrity-check@phase-c3-v1',
        'phase-c3-v1',
        jsonb_build_object('fixture', 'synthetic-validation'),
        'phase-c3:validation:duplicate-run',
        3,
        300,
        now(),
        correlation_uuid,
        NULL,
        'trace-validation',
        repeat('a', 64)
    );
    IF completed_claim->>'disposition' <> 'reused'
       OR completed_claim#>>'{run,status}' <> 'succeeded'
       OR (completed_claim#>>'{run,runId}')::UUID <> run_uuid THEN
        RAISE EXCEPTION 'A duplicate delivery reset or failed to reuse a completed run';
    END IF;

    blocked := false;
    BEGIN
        PERFORM public.claim_agent_workflow_run(
            'operations-orchestrator', 'lifecycle-integrity-check', 'phase-c3-v1',
            'wrun_validation_payload_mismatch', 'lifecycle-integrity-check@phase-c3-v1',
            'phase-c3-v1', jsonb_build_object('fixture', 'different'),
            'phase-c3:validation:duplicate-run', 3, 300, now(), correlation_uuid,
            NULL, 'trace-validation', repeat('a', 64)
        );
    EXCEPTION WHEN OTHERS THEN
        IF position('different input payload' IN SQLERRM) > 0 THEN blocked := true; ELSE RAISE; END IF;
    END;
    IF NOT blocked THEN
        RAISE EXCEPTION 'Idempotency key incorrectly accepted a different payload';
    END IF;

    stale_claim := public.claim_agent_workflow_run(
        'operations-orchestrator', 'lifecycle-integrity-check', 'phase-c3-v1',
        'wrun_validation_stale', 'lifecycle-integrity-check@phase-c3-v1',
        'phase-c3-v1', jsonb_build_object('fixture', 'stale'),
        'phase-c3:validation:stale-run', 3, 300, now(), correlation_uuid,
        NULL, 'trace-validation', repeat('a', 64)
    );
    stale_run_uuid := (stale_claim#>>'{run,runId}')::UUID;
    UPDATE public.agent_runs SET stale_after = now() - interval '1 minute' WHERE id = stale_run_uuid;
    stale_count := public.mark_stale_agent_workflow_runs(10);
    IF stale_count < 1 OR NOT EXISTS (
        SELECT 1 FROM public.agent_runs WHERE id = stale_run_uuid AND status = 'stale'
    ) THEN
        RAISE EXCEPTION 'Expired durable run was not marked stale';
    END IF;

    RAISE NOTICE 'PASS: Phase C3 destination sentinel, atomic run and step claims, duplicate delivery, resume reuse, verification, and stale detection validated.';
END;
$validation$;

SELECT 'PASS: Intelligence OS Phase C3 durable workflow validation completed. Synthetic records were rolled back.' AS validation_result;

ROLLBACK;
