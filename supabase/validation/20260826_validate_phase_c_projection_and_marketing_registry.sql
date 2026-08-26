-- Issue #318, Phase C staging validation.
-- Creates synthetic rows inside a transaction and always rolls them back.
-- Expected result: one row containing PASS.

BEGIN;

SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';

DO $validation$
DECLARE
    required_table TEXT;
    privilege_name TEXT;
    member_uuid UUID := gen_random_uuid();
    asset_uuid UUID := gen_random_uuid();
    blocked BOOLEAN;
BEGIN
    FOREACH required_table IN ARRAY ARRAY[
        'projection_runs',
        'activecampaign_asset_registry',
        'marketing_contact_classifications'
    ]
    LOOP
        IF to_regclass('public.' || required_table) IS NULL THEN
            RAISE EXCEPTION 'Missing required Phase C table: public.%', required_table;
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_class AS relation
            JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
            WHERE namespace.nspname = 'public'
              AND relation.relname = required_table
              AND relation.relrowsecurity
        ) THEN
            RAISE EXCEPTION 'RLS is not enabled on public.%', required_table;
        END IF;

        FOREACH privilege_name IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']
        LOOP
            IF has_table_privilege('anon', format('public.%I', required_table), privilege_name)
               OR has_table_privilege('authenticated', format('public.%I', required_table), privilege_name) THEN
                RAISE EXCEPTION 'A public role unexpectedly has % on public.%', privilege_name, required_table;
            END IF;

            IF NOT has_table_privilege('service_role', format('public.%I', required_table), privilege_name) THEN
                RAISE EXCEPTION 'service_role is missing % on public.%', privilege_name, required_table;
            END IF;
        END LOOP;
    END LOOP;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'marketing_contact_classifications'
          AND column_name = 'email'
    ) THEN
        RAISE EXCEPTION 'marketing_contact_classifications must not persist contact email addresses';
    END IF;

    INSERT INTO public.canonical_members (
        id,
        primary_email,
        identity_status,
        data_quality_status,
        data_quality_score
    ) VALUES (
        member_uuid,
        'phase-c-validation@example.invalid',
        'resolved',
        'complete',
        1
    );

    INSERT INTO public.projection_runs (
        projection_name,
        projection_version,
        status,
        input_records,
        output_records,
        conflict_records,
        unmatched_records,
        completeness,
        confidence,
        idempotency_key,
        started_at,
        completed_at
    ) VALUES (
        'member-360-projection',
        'phase-c-v1',
        'succeeded',
        3,
        1,
        0,
        2,
        1,
        1,
        'validation:projection-run',
        now(),
        now()
    );

    INSERT INTO public.activecampaign_asset_registry (
        id,
        asset_type,
        external_id,
        asset_name,
        business_scope,
        lifecycle_status,
        read_allowed,
        mutation_allowed,
        classification_source,
        classification_evidence,
        confidence,
        review_status,
        last_seen_at,
        idempotency_key
    ) VALUES (
        asset_uuid,
        'automation',
        'validation-automation',
        'Validation Member Welcome',
        'nested_objects',
        'review_required',
        false,
        false,
        'staging-validation',
        jsonb_build_object('reason', 'synthetic'),
        1,
        'pending',
        now(),
        'validation:activecampaign-asset'
    );

    blocked := false;
    BEGIN
        UPDATE public.activecampaign_asset_registry
        SET mutation_allowed = true
        WHERE id = asset_uuid;
    EXCEPTION
        WHEN check_violation THEN
            blocked := true;
    END;
    IF NOT blocked THEN
        RAISE EXCEPTION 'Phase C incorrectly allowed an ActiveCampaign mutation executor';
    END IF;

    blocked := false;
    BEGIN
        UPDATE public.activecampaign_asset_registry
        SET read_allowed = true
        WHERE id = asset_uuid;
    EXCEPTION
        WHEN check_violation THEN
            blocked := true;
    END;
    IF NOT blocked THEN
        RAISE EXCEPTION 'Asset read access incorrectly bypassed owner review';
    END IF;

    UPDATE public.activecampaign_asset_registry
    SET
        read_allowed = true,
        lifecycle_status = 'active',
        review_status = 'approved',
        reviewed_by = 'autumn',
        reviewed_at = now(),
        review_notes = 'Synthetic validation only'
    WHERE id = asset_uuid;

    INSERT INTO public.marketing_contact_classifications (
        source_contact_id,
        canonical_member_id,
        classification,
        engagement_state,
        membership_truth_state,
        excluded_from_marketing_analysis,
        exclusion_reason,
        evidence,
        confidence,
        recommended_disposition,
        last_observed_at,
        idempotency_key
    ) VALUES (
        'validation-contact',
        member_uuid,
        'current_member',
        'opened',
        'known',
        false,
        NULL,
        jsonb_build_array(jsonb_build_object('type', 'authoritative_membership')),
        1,
        'retain',
        now(),
        'validation:marketing-contact-classification'
    );

    blocked := false;
    BEGIN
        INSERT INTO public.marketing_contact_classifications (
            source_contact_id,
            classification,
            engagement_state,
            membership_truth_state,
            excluded_from_marketing_analysis,
            exclusion_reason,
            confidence,
            recommended_disposition,
            last_observed_at,
            idempotency_key
        ) VALUES (
            'validation-cold-contact',
            'cold_import',
            'never_engaged',
            'unknown',
            true,
            NULL,
            1,
            'suppress_candidate',
            now(),
            'validation:cold-contact-missing-reason'
        );
    EXCEPTION
        WHEN check_violation THEN
            blocked := true;
    END;
    IF NOT blocked THEN
        RAISE EXCEPTION 'Excluded contact classification incorrectly omitted its reason';
    END IF;

    RAISE NOTICE 'PASS: Phase C projection run, private marketing registry, RLS, owner review, mutation denial, and privacy constraints validated.';
END;
$validation$;

SELECT 'PASS: Intelligence OS Phase C projection and marketing registry validation completed. Synthetic records were rolled back.' AS validation_result;

ROLLBACK;
