-- Issue #318, AC-004/AC-007/AC-008. Read-only validation for the exact
-- Production durable Free journey prerequisites. Run after the three migrations
-- listed below and before creating or activating the Production binding:
--   20260825090000_create_intelligence_os_foundation.sql
--   20260827090000_create_durable_workflow_foundation.sql
--   20261010120000_enable_bounded_free_journey_durable_claims.sql

BEGIN;

DO $validation$
DECLARE
    table_name TEXT;
    column_name TEXT;
    procedure_signature TEXT;
    procedure_oid REGPROCEDURE;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'agent_runs',
        'agent_events',
        'agent_runtime_destination_bindings',
        'agent_workflow_steps'
    ] LOOP
        IF to_regclass('public.' || table_name) IS NULL THEN
            RAISE EXCEPTION 'Missing durable Free journey prerequisite table: public.%', table_name;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM pg_class AS relation
            JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
            WHERE namespace.nspname = 'public'
              AND relation.relname = table_name
              AND relation.relrowsecurity
        ) THEN
            RAISE EXCEPTION 'RLS is not enabled on durable Free journey table: public.%', table_name;
        END IF;
    END LOOP;

    FOREACH column_name IN ARRAY ARRAY[
        'agent_runs.id',
        'agent_runs.workflow_name',
        'agent_runs.workflow_version',
        'agent_runs.workflow_run_id',
        'agent_runs.durable_workflow_id',
        'agent_runs.runtime_version',
        'agent_runs.status',
        'agent_runs.input',
        'agent_runs.output',
        'agent_runs.attempt',
        'agent_runs.max_attempts',
        'agent_runs.idempotency_key',
        'agent_runs.verification_status',
        'agent_runs.destination_fingerprint',
        'agent_runtime_destination_bindings.binding_key',
        'agent_runtime_destination_bindings.policy_version',
        'agent_runtime_destination_bindings.environment',
        'agent_runtime_destination_bindings.project_ref',
        'agent_runtime_destination_bindings.destination_fingerprint',
        'agent_runtime_destination_bindings.review_status',
        'agent_runtime_destination_bindings.active',
        'agent_workflow_steps.run_id',
        'agent_workflow_steps.step_key',
        'agent_workflow_steps.workflow_step_id',
        'agent_workflow_steps.claim_token',
        'agent_workflow_steps.status',
        'agent_workflow_steps.input',
        'agent_workflow_steps.output',
        'agent_workflow_steps.attempt',
        'agent_workflow_steps.max_attempts',
        'agent_events.idempotency_key'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = split_part(column_name, '.', 1)
              AND columns.column_name = split_part(column_name, '.', 2)
        ) THEN
            RAISE EXCEPTION 'Missing durable Free journey prerequisite column: public.%', column_name;
        END IF;
    END LOOP;

    FOREACH procedure_signature IN ARRAY ARRAY[
        'public.agent_workflow_run_snapshot(public.agent_runs)',
        'public.agent_workflow_step_snapshot(public.agent_workflow_steps)',
        'public.claim_agent_workflow_step(uuid,text,text,jsonb,integer,integer,uuid,uuid,text)',
        'public.complete_agent_workflow_step(uuid,text,uuid,jsonb,jsonb,uuid,uuid,text)',
        'public.fail_agent_workflow_step(uuid,text,uuid,jsonb,timestamp with time zone,uuid,uuid,text)',
        'public.complete_agent_workflow_run(uuid,jsonb,jsonb,bigint,bigint,numeric,jsonb,uuid,uuid,text)',
        'public.fail_agent_workflow_run(uuid,jsonb,timestamp with time zone,uuid,uuid,text)',
        'public.verify_free_journey_runtime_destination(text,text,text,text)',
        'public.claim_free_journey_operation_run(text,text,text,text,text,text,jsonb,text,integer,integer,timestamp with time zone,uuid,uuid,text,text)'
    ] LOOP
        procedure_oid := to_regprocedure(procedure_signature);
        IF procedure_oid IS NULL THEN
            RAISE EXCEPTION 'Missing durable Free journey prerequisite function: %', procedure_signature;
        END IF;
        IF NOT has_function_privilege('service_role', procedure_oid, 'EXECUTE') THEN
            RAISE EXCEPTION 'service_role lacks EXECUTE on durable Free journey function: %', procedure_signature;
        END IF;
        IF has_function_privilege('anon', procedure_oid, 'EXECUTE')
           OR has_function_privilege('authenticated', procedure_oid, 'EXECUTE') THEN
            RAISE EXCEPTION 'Browser role can execute durable Free journey function: %', procedure_signature;
        END IF;
    END LOOP;

    IF EXISTS (
        SELECT 1 FROM public.agent_runtime_destination_bindings
        WHERE binding_key = 'nested-objects-free-journey-production'
          AND active
    ) THEN
        RAISE EXCEPTION 'Production Free journey binding is already active; preactivation validation must be zero-write';
    END IF;
    IF EXISTS (
        SELECT 1 FROM public.agent_runtime_destination_bindings
        WHERE binding_key = 'nested-objects-free-journey-production'
          AND (
            policy_version IS DISTINCT FROM 'free-journey-production-v1'
            OR environment IS DISTINCT FROM 'production'
            OR project_ref IS DISTINCT FROM 'lzzghrjjsyzlvofpidis'
            OR destination_fingerprint IS DISTINCT FROM '1a1e94c0f81a4880dd2aeb34150bd0c84b8e1cfd4bef375ad2a0e71180a4a2a9'
            OR review_status IS DISTINCT FROM 'approved'
          )
    ) THEN
        RAISE EXCEPTION 'Existing inactive Free journey binding does not match the reviewed Production destination';
    END IF;

    RAISE NOTICE 'PASS: durable Free journey tables, columns, RLS, function signatures, grants, and inactive binding state are ready.';
END;
$validation$;

ROLLBACK;
