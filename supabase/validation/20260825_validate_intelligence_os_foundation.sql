-- Issue #318, Phase B staging validation.
-- Run only after 20260825090000_create_intelligence_os_foundation.sql succeeds.
-- This script creates synthetic records inside a transaction and always rolls them back.
-- Expected result: one row containing PASS.

BEGIN;

SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';

DO $validation$
DECLARE
    required_relation TEXT;
    table_name TEXT;
    privilege_name TEXT;
    member_uuid UUID := gen_random_uuid();
    action_uuid UUID := gen_random_uuid();
    experiment_uuid UUID := gen_random_uuid();
    blocked BOOLEAN;
    conflict_count BIGINT;
    member_tier TEXT;
    member_conflict_count BIGINT;
BEGIN
    FOREACH required_relation IN ARRAY ARRAY[
        'public.canonical_members',
        'public.member_identity_links',
        'public.member_memberships',
        'public.member_operational_profiles',
        'public.business_metrics_daily',
        'public.intelligence_signals',
        'public.experiments',
        'public.agent_events',
        'public.agent_tasks',
        'public.agent_actions',
        'public.agent_runs',
        'public.member_360',
        'public.member_authority_conflicts'
    ]
    LOOP
        IF to_regclass(required_relation) IS NULL THEN
            RAISE EXCEPTION 'Missing required Phase B relation: %', required_relation;
        END IF;
    END LOOP;

    FOREACH table_name IN ARRAY ARRAY[
        'canonical_members',
        'member_identity_links',
        'member_memberships',
        'member_operational_profiles',
        'business_metrics_daily',
        'intelligence_signals',
        'experiments',
        'agent_events',
        'agent_tasks',
        'agent_actions',
        'agent_runs'
    ]
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_class AS relation
            JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
            WHERE namespace.nspname = 'public'
              AND relation.relname = table_name
              AND relation.relrowsecurity
        ) THEN
            RAISE EXCEPTION 'RLS is not enabled on public.%', table_name;
        END IF;

        FOREACH privilege_name IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']
        LOOP
            IF has_table_privilege('anon', format('public.%I', table_name), privilege_name) THEN
                RAISE EXCEPTION 'anon unexpectedly has % on public.%', privilege_name, table_name;
            END IF;

            IF has_table_privilege('authenticated', format('public.%I', table_name), privilege_name) THEN
                RAISE EXCEPTION 'authenticated unexpectedly has % on public.%', privilege_name, table_name;
            END IF;

            IF NOT has_table_privilege('service_role', format('public.%I', table_name), privilege_name) THEN
                RAISE EXCEPTION 'service_role is missing % on public.%', privilege_name, table_name;
            END IF;
        END LOOP;
    END LOOP;

    IF has_table_privilege('anon', 'public.member_360', 'SELECT')
       OR has_table_privilege('authenticated', 'public.member_360', 'SELECT') THEN
        RAISE EXCEPTION 'member_360 is unexpectedly readable by anon or authenticated';
    END IF;

    IF has_table_privilege('anon', 'public.member_authority_conflicts', 'SELECT')
       OR has_table_privilege('authenticated', 'public.member_authority_conflicts', 'SELECT') THEN
        RAISE EXCEPTION 'member_authority_conflicts is unexpectedly readable by anon or authenticated';
    END IF;

    IF NOT has_table_privilege('service_role', 'public.member_360', 'SELECT')
       OR NOT has_table_privilege('service_role', 'public.member_authority_conflicts', 'SELECT') THEN
        RAISE EXCEPTION 'service_role cannot read one or both private member views';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_class AS relation
        JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = 'public'
          AND relation.relname = 'member_360'
          AND coalesce(relation.reloptions, ARRAY[]::TEXT[]) @> ARRAY['security_invoker=true']::TEXT[]
    ) THEN
        RAISE EXCEPTION 'member_360 is not configured as a security-invoker view';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_class AS relation
        JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = 'public'
          AND relation.relname = 'member_authority_conflicts'
          AND coalesce(relation.reloptions, ARRAY[]::TEXT[]) @> ARRAY['security_invoker=true']::TEXT[]
    ) THEN
        RAISE EXCEPTION 'member_authority_conflicts is not configured as a security-invoker view';
    END IF;

    INSERT INTO public.canonical_members (
        id,
        primary_email,
        identity_status,
        data_quality_status,
        data_quality_score
    )
    VALUES (
        member_uuid,
        'phase-b-validation@example.invalid',
        'resolved',
        'complete',
        1
    );

    INSERT INTO public.member_memberships (
        member_id,
        source_system,
        source_record_id,
        is_authoritative,
        authority_rank,
        membership_tier,
        membership_status,
        plan_uid,
        snapshot_at,
        completeness,
        confidence,
        idempotency_key
    )
    VALUES (
        member_uuid,
        'outseta',
        'validation-outseta-subscription',
        true,
        100,
        'pro',
        'active',
        'validation-pro-plan',
        now(),
        1,
        1,
        'validation:membership:outseta:' || member_uuid::TEXT
    );

    INSERT INTO public.member_memberships (
        member_id,
        source_system,
        source_record_id,
        is_authoritative,
        authority_rank,
        membership_tier,
        membership_status,
        plan_uid,
        snapshot_at,
        completeness,
        confidence,
        idempotency_key
    )
    VALUES (
        member_uuid,
        'activecampaign',
        'validation-activecampaign-contact',
        false,
        0,
        'free',
        'active',
        'validation-free-plan',
        now(),
        1,
        1,
        'validation:membership:activecampaign:' || member_uuid::TEXT
    );

    SELECT count(*)
    INTO conflict_count
    FROM public.member_authority_conflicts
    WHERE member_id = member_uuid
      AND conflict_type = 'tier_mismatch';

    IF conflict_count <> 1 THEN
        RAISE EXCEPTION 'Expected one tier mismatch, found %', conflict_count;
    END IF;

    SELECT membership_tier, authority_conflict_count
    INTO member_tier, member_conflict_count
    FROM public.member_360
    WHERE member_id = member_uuid;

    IF member_tier IS DISTINCT FROM 'pro' THEN
        RAISE EXCEPTION 'member_360 did not preserve authoritative Pro membership';
    END IF;

    IF member_conflict_count < 1 THEN
        RAISE EXCEPTION 'member_360 did not expose the authority conflict';
    END IF;

    blocked := false;
    BEGIN
        INSERT INTO public.member_memberships (
            member_id,
            source_system,
            source_record_id,
            is_authoritative,
            authority_rank,
            membership_tier,
            membership_status,
            snapshot_at,
            idempotency_key
        )
        VALUES (
            member_uuid,
            'activecampaign',
            'validation-illegal-authority',
            true,
            90,
            'elite',
            'active',
            now(),
            'validation:illegal-activecampaign-authority:' || member_uuid::TEXT
        );
    EXCEPTION
        WHEN check_violation THEN
            blocked := true;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'ActiveCampaign was incorrectly accepted as a membership authority';
    END IF;

    blocked := false;
    BEGIN
        INSERT INTO public.business_metrics_daily (
            metric_date,
            metric_name,
            domain,
            numeric_value,
            value_state,
            source_system,
            idempotency_key
        )
        VALUES (
            current_date,
            'validation.unknown_metric',
            'revenue',
            0,
            'unknown',
            'validation',
            'validation:metric:invalid-unknown'
        );
    EXCEPTION
        WHEN check_violation THEN
            blocked := true;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'Unknown metric incorrectly accepted an invented numeric value';
    END IF;

    INSERT INTO public.business_metrics_daily (
        metric_date,
        metric_name,
        domain,
        numeric_value,
        value_state,
        source_system,
        provenance,
        idempotency_key
    )
    VALUES (
        current_date,
        'validation.unknown_metric',
        'revenue',
        NULL,
        'unknown',
        'validation',
        jsonb_build_object('reason', 'Synthetic staging validation'),
        'validation:metric:valid-unknown'
    );

    blocked := false;
    BEGIN
        INSERT INTO public.experiments (
            id,
            name,
            hypothesis,
            status,
            primary_metric,
            minimum_sample_size,
            minimum_duration_days,
            observed_sample_size,
            observed_duration_days,
            analysis_state,
            result,
            decision,
            idempotency_key
        )
        VALUES (
            experiment_uuid,
            'Validation experiment',
            'Insufficient evidence must not produce a conclusion.',
            'completed',
            'validation.primary_metric',
            20,
            7,
            3,
            1,
            'conclusive',
            jsonb_build_object('winner', 'variant'),
            'ship',
            'validation:experiment:insufficient'
        );
    EXCEPTION
        WHEN check_violation THEN
            blocked := true;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'Experiment incorrectly concluded before minimum evidence thresholds';
    END IF;

    INSERT INTO public.experiments (
        id,
        name,
        hypothesis,
        status,
        primary_metric,
        minimum_sample_size,
        minimum_duration_days,
        idempotency_key
    )
    VALUES (
        experiment_uuid,
        'Validation experiment',
        'Sufficient evidence may support a reviewed conclusion.',
        'draft',
        'validation.primary_metric',
        20,
        7,
        'validation:experiment:valid'
    );

    UPDATE public.experiments
    SET
        status = 'completed',
        observed_sample_size = 20,
        observed_duration_days = 7,
        analysis_state = 'ready',
        result = jsonb_build_object('result', 'thresholds-met'),
        decision = 'review'
    WHERE id = experiment_uuid;

    blocked := false;
    BEGIN
        INSERT INTO public.agent_actions (
            action_type,
            target_system,
            requested_by_agent,
            payload,
            concise_rationale,
            risk_level,
            approval_required,
            idempotency_key
        )
        VALUES (
            'external.send_email',
            'activecampaign',
            'validation-agent',
            jsonb_build_object('audience', 'synthetic'),
            'Validate that a high-risk action cannot bypass approval.',
            'high',
            false,
            'validation:action:approval-bypass'
        );
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLSTATE = '23514'
               OR position('must require approval' IN SQLERRM) > 0 THEN
                blocked := true;
            ELSE
                RAISE;
            END IF;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'High-risk action incorrectly bypassed approval requirements';
    END IF;

    blocked := false;
    BEGIN
        INSERT INTO public.agent_actions (
            action_type,
            target_system,
            requested_by_agent,
            payload,
            concise_rationale,
            risk_level,
            approval_required,
            status,
            idempotency_key
        )
        VALUES (
            'external.send_email',
            'activecampaign',
            'validation-agent',
            jsonb_build_object('audience', 'synthetic'),
            'Validate that actions cannot skip the proposed state.',
            'high',
            true,
            'awaiting_approval',
            'validation:action:skip-proposed'
        );
    EXCEPTION
        WHEN OTHERS THEN
            IF position('must be inserted in proposed status' IN SQLERRM) > 0 THEN
                blocked := true;
            ELSE
                RAISE;
            END IF;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'Action incorrectly skipped the proposed state';
    END IF;

    INSERT INTO public.agent_actions (
        id,
        action_type,
        target_system,
        requested_by_agent,
        payload,
        concise_rationale,
        risk_level,
        approval_required,
        idempotency_key
    )
    VALUES (
        action_uuid,
        'external.send_email',
        'activecampaign',
        'validation-agent',
        jsonb_build_object('audience', 'synthetic'),
        'Validate the owner approval state machine.',
        'high',
        true,
        'validation:action:owner-approval'
    );

    UPDATE public.agent_actions
    SET status = 'awaiting_approval'
    WHERE id = action_uuid;

    blocked := false;
    BEGIN
        UPDATE public.agent_actions
        SET payload = jsonb_build_object('audience', 'changed-after-review')
        WHERE id = action_uuid;
    EXCEPTION
        WHEN OTHERS THEN
            IF position('action contract is immutable' IN SQLERRM) > 0 THEN
                blocked := true;
            ELSE
                RAISE;
            END IF;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'Approval-pending action payload was incorrectly mutable';
    END IF;

    blocked := false;
    BEGIN
        UPDATE public.agent_actions
        SET status = 'approved'
        WHERE id = action_uuid;
    EXCEPTION
        WHEN OTHERS THEN
            IF position('explicit owner approval is required' IN SQLERRM) > 0 THEN
                blocked := true;
            ELSE
                RAISE;
            END IF;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'Approval-required action was approved without an owner record';
    END IF;

    UPDATE public.agent_actions
    SET
        status = 'approved',
        approved_by = 'autumn',
        approved_at = now(),
        approval_authority = 'owner',
        approval_context = jsonb_build_object('source', 'staging-validation')
    WHERE id = action_uuid;

    blocked := false;
    BEGIN
        UPDATE public.agent_actions
        SET
            status = 'verified',
            executor_key = 'validation-only',
            execution_started_at = now(),
            executed_at = now(),
            verification_status = 'verified',
            verified_at = now()
        WHERE id = action_uuid;
    EXCEPTION
        WHEN OTHERS THEN
            IF position('invalid agent action transition' IN SQLERRM) > 0 THEN
                blocked := true;
            ELSE
                RAISE;
            END IF;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'Action incorrectly skipped required execution lifecycle states';
    END IF;

    RAISE NOTICE 'PASS: Phase B staging schema, authority, metrics, experiments, RLS, privileges, views, and approval lifecycle validated.';
END;
$validation$;

SELECT 'PASS: Intelligence OS Phase B staging validation completed. Synthetic records were rolled back.' AS validation_result;

ROLLBACK;
