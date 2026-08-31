-- Issue #318, Phase C6 staging validation.
-- Creates synthetic sensor and ActiveCampaign inventory records in one transaction and always rolls them back.

BEGIN;

SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';

DO $validation$
DECLARE
    correlation_uuid UUID := gen_random_uuid();
    sensor_run_uuid UUID := gen_random_uuid();
    observation_uuid UUID := gen_random_uuid();
    next_sensor_run_uuid UUID := gen_random_uuid();
    next_observation_uuid UUID := gen_random_uuid();
    asset_uuid UUID := gen_random_uuid();
    first_result JSONB;
    duplicate_result JSONB;
    next_result JSONB;
    blocked BOOLEAN := false;
    refreshed_count INTEGER;
BEGIN
    IF to_regclass('public.agent_sensor_runs') IS NULL
       OR to_regclass('public.sensor_observations') IS NULL THEN
        RAISE EXCEPTION 'Missing Phase C6 sensor ledger tables';
    END IF;
    IF has_table_privilege('service_role', 'public.agent_sensor_runs', 'INSERT')
       OR has_table_privilege('service_role', 'public.sensor_observations', 'UPDATE')
       OR has_table_privilege('service_role', 'public.activecampaign_asset_registry', 'DELETE')
       OR has_table_privilege('anon', 'public.sensor_observations', 'SELECT') THEN
        RAISE EXCEPTION 'Phase C6 direct table privileges exceed the read-only server boundary';
    END IF;

    PERFORM set_config('request.jwt.claim.role', 'service_role', true);

    first_result := public.persist_agent_sensor_batch(
        jsonb_build_object(
            'id', sensor_run_uuid,
            'sensor_name', 'seo-content-monitor',
            'provenance_mode', 'fixture',
            'observed_at', '2026-08-27T16:00:00.000Z',
            'source_generated_at', '2026-08-27T16:00:00.000Z',
            'checksum', repeat('a', 64),
            'health_status', 'healthy',
            'source_health', jsonb_build_array(jsonb_build_object(
                'sourceId', 'seo-content-monitor:synthetic',
                'status', 'healthy',
                'detail', 'Synthetic fixture.',
                'observedAt', '2026-08-27T16:00:00.000Z',
                'recordCount', 1,
                'staleAfterHours', 216,
                'errorCode', NULL
            )),
            'observation_count', 1,
            'idempotency_key', 'sensor-run:seo-content-monitor:phase-c6-validation',
            'correlation_id', correlation_uuid,
            'causation_id', NULL
        ),
        jsonb_build_array(jsonb_build_object(
            'id', observation_uuid,
            'sensor_run_id', sensor_run_uuid,
            'sensor_name', 'seo-content-monitor',
            'observation_type', 'seo_content_opportunity',
            'source_record_id', 'synthetic-seo-opportunity',
            'provenance_mode', 'fixture',
            'observed_at', '2026-08-27T16:00:00.000Z',
            'source_generated_at', '2026-08-27T16:00:00.000Z',
            'checksum', repeat('b', 64),
            'payload', jsonb_build_object('title', 'Synthetic SEO opportunity', 'mutationAllowed', false),
            'source_refs', jsonb_build_array(jsonb_build_object(
                'sourceSystem', 'seo-content-monitor',
                'sourceType', 'seo_content_opportunity',
                'sourceId', 'synthetic-seo-opportunity',
                'checksum', repeat('a', 64)
            )),
            'source_health', jsonb_build_array(),
            'idempotency_key', 'sensor-observation:seo-content-monitor:synthetic-seo-opportunity',
            'correlation_id', correlation_uuid,
            'causation_id', NULL
        ))
    );
    IF first_result <> jsonb_build_object(
        'disposition', 'created', 'runCount', 1, 'observationCount', 1
    ) THEN RAISE EXCEPTION 'First sensor batch did not return verified created counts'; END IF;

    duplicate_result := public.persist_agent_sensor_batch(
        jsonb_build_object(
            'id', sensor_run_uuid, 'sensor_name', 'seo-content-monitor',
            'provenance_mode', 'fixture', 'observed_at', '2026-08-27T17:00:00.000Z',
            'source_generated_at', '2026-08-27T16:00:00.000Z', 'checksum', repeat('a', 64),
            'health_status', 'healthy', 'source_health', jsonb_build_array(),
            'observation_count', 1,
            'idempotency_key', 'sensor-run:seo-content-monitor:phase-c6-validation',
            'correlation_id', correlation_uuid, 'causation_id', NULL
        ),
        jsonb_build_array(jsonb_build_object(
            'id', observation_uuid, 'sensor_run_id', sensor_run_uuid,
            'sensor_name', 'seo-content-monitor', 'observation_type', 'seo_content_opportunity',
            'source_record_id', 'synthetic-seo-opportunity', 'provenance_mode', 'fixture',
            'observed_at', '2026-08-27T17:00:00.000Z',
            'source_generated_at', '2026-08-27T16:00:00.000Z', 'checksum', repeat('b', 64),
            'payload', jsonb_build_object('title', 'Synthetic SEO opportunity', 'mutationAllowed', false),
            'source_refs', jsonb_build_array(jsonb_build_object(
                'sourceSystem', 'seo-content-monitor', 'sourceType', 'seo_content_opportunity',
                'sourceId', 'synthetic-seo-opportunity', 'checksum', repeat('a', 64)
            )),
            'source_health', jsonb_build_array(),
            'idempotency_key', 'sensor-observation:seo-content-monitor:synthetic-seo-opportunity',
            'correlation_id', correlation_uuid, 'causation_id', NULL
        ))
    );
    IF duplicate_result <> jsonb_build_object(
        'disposition', 'reused', 'runCount', 1, 'observationCount', 1
    ) THEN RAISE EXCEPTION 'Duplicate sensor batch was not reused'; END IF;
    IF (SELECT count(*) FROM public.agent_sensor_runs WHERE id = sensor_run_uuid) <> 1
       OR (SELECT count(*) FROM public.sensor_observations WHERE id = observation_uuid) <> 1 THEN
        RAISE EXCEPTION 'Duplicate sensor delivery created duplicate records';
    END IF;

    blocked := false;
    BEGIN
        PERFORM public.persist_agent_sensor_batch(
            jsonb_build_object(
                'id', sensor_run_uuid, 'sensor_name', 'seo-content-monitor',
                'provenance_mode', 'fixture', 'observed_at', '2026-08-27T18:00:00.000Z',
                'source_generated_at', '2026-08-27T16:00:00.000Z', 'checksum', repeat('a', 64),
                'health_status', 'healthy', 'source_health', jsonb_build_array(),
                'observation_count', 1,
                'idempotency_key', 'sensor-run:seo-content-monitor:phase-c6-validation',
                'correlation_id', correlation_uuid, 'causation_id', NULL
            ),
            jsonb_build_array(jsonb_build_object(
                'id', observation_uuid, 'sensor_run_id', sensor_run_uuid,
                'sensor_name', 'seo-content-monitor', 'observation_type', 'seo_content_opportunity',
                'source_record_id', 'synthetic-seo-opportunity', 'provenance_mode', 'fixture',
                'observed_at', '2026-08-27T18:00:00.000Z',
                'source_generated_at', '2026-08-27T16:00:00.000Z', 'checksum', repeat('b', 64),
                'payload', jsonb_build_object('title', 'Changed output must fail closed.'),
                'source_refs', jsonb_build_array(jsonb_build_object(
                    'sourceSystem', 'seo-content-monitor', 'sourceType', 'seo_content_opportunity',
                    'sourceId', 'synthetic-seo-opportunity', 'checksum', repeat('a', 64)
                )),
                'source_health', jsonb_build_array(),
                'idempotency_key', 'sensor-observation:seo-content-monitor:synthetic-seo-opportunity',
                'correlation_id', correlation_uuid, 'causation_id', NULL
            ))
        );
    EXCEPTION WHEN OTHERS THEN
        IF position('sensor observation idempotency key was reused with different content' IN SQLERRM) > 0 THEN
            blocked := true;
        ELSE
            RAISE;
        END IF;
    END;
    IF NOT blocked THEN RAISE EXCEPTION 'Changed sensor observation reused an idempotency key'; END IF;

    next_result := public.persist_agent_sensor_batch(
        jsonb_build_object(
            'id', next_sensor_run_uuid, 'sensor_name', 'seo-content-monitor',
            'provenance_mode', 'fixture', 'observed_at', '2026-08-28T16:00:00.000Z',
            'source_generated_at', '2026-08-28T16:00:00.000Z', 'checksum', repeat('c', 64),
            'health_status', 'healthy', 'source_health', jsonb_build_array(),
            'observation_count', 1,
            'idempotency_key', 'sensor-run:seo-content-monitor:phase-c6-validation-next-run',
            'correlation_id', correlation_uuid, 'causation_id', sensor_run_uuid
        ),
        jsonb_build_array(jsonb_build_object(
            'id', next_observation_uuid, 'sensor_run_id', next_sensor_run_uuid,
            'sensor_name', 'seo-content-monitor', 'observation_type', 'seo_content_opportunity',
            'source_record_id', 'synthetic-seo-opportunity', 'provenance_mode', 'fixture',
            'observed_at', '2026-08-28T16:00:00.000Z',
            'source_generated_at', '2026-08-28T16:00:00.000Z', 'checksum', repeat('b', 64),
            'payload', jsonb_build_object('title', 'Synthetic SEO opportunity', 'mutationAllowed', false),
            'source_refs', jsonb_build_array(jsonb_build_object(
                'sourceSystem', 'seo-content-monitor', 'sourceType', 'seo_content_opportunity',
                'sourceId', 'synthetic-seo-opportunity', 'checksum', repeat('c', 64)
            )),
            'source_health', jsonb_build_array(),
            'idempotency_key', 'sensor-observation:seo-content-monitor:phase-c6-validation-next-run:synthetic-seo-opportunity',
            'correlation_id', correlation_uuid, 'causation_id', sensor_run_uuid
        ))
    );
    IF next_result->>'disposition' <> 'created'
       OR (SELECT count(*) FROM public.sensor_observations
           WHERE sensor_name = 'seo-content-monitor'
             AND source_record_id = 'synthetic-seo-opportunity'
             AND checksum = repeat('b', 64)) <> 2 THEN
        RAISE EXCEPTION 'A recurring collector run could not retain an unchanged source observation';
    END IF;

    INSERT INTO public.activecampaign_asset_registry (
        id, source_system, asset_type, external_id, asset_name, business_scope,
        lifecycle_status, read_allowed, mutation_allowed, classification_source,
        classification_evidence, confidence, review_status, reviewed_by, reviewed_at,
        review_notes, last_seen_at, source_refs, idempotency_key
    ) VALUES (
        asset_uuid, 'activecampaign', 'automation', 'synthetic-automation-c6',
        'Synthetic approved onboarding', 'nested_objects', 'active', true, false,
        'owner-reviewed-validation', jsonb_build_object('review', 'synthetic'), 1,
        'approved', 'autumn-stable-subject', '2026-08-27T15:00:00.000Z',
        'Synthetic transaction-only approval.', '2026-08-27T15:00:00.000Z',
        jsonb_build_array(), 'activecampaign-asset:automation:synthetic-automation-c6'
    );

    refreshed_count := public.upsert_activecampaign_asset_inventory(jsonb_build_array(jsonb_build_object(
        'source_system', 'activecampaign', 'asset_type', 'automation',
        'external_id', 'synthetic-automation-c6', 'asset_name', 'Synthetic refreshed onboarding',
        'business_scope', 'unknown', 'lifecycle_status', 'inactive',
        'read_allowed', false, 'mutation_allowed', false,
        'classification_source', 'phase-c6-recurring-inventory',
        'classification_evidence', jsonb_build_object('reason', 'synthetic refresh'),
        'confidence', 0.5, 'review_status', 'pending',
        'last_seen_at', '2026-08-27T16:00:00.000Z',
        'source_refs', jsonb_build_array(),
        'idempotency_key', 'activecampaign-asset:automation:synthetic-automation-c6'
    )));
    IF refreshed_count <> 1 THEN RAISE EXCEPTION 'ActiveCampaign inventory refresh count was wrong'; END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.activecampaign_asset_registry
        WHERE id = asset_uuid
          AND asset_name = 'Synthetic refreshed onboarding'
          AND lifecycle_status = 'inactive'
          AND business_scope = 'nested_objects'
          AND read_allowed
          AND NOT mutation_allowed
          AND review_status = 'approved'
          AND reviewed_by = 'autumn-stable-subject'
          AND reviewed_at = '2026-08-27T15:00:00.000Z'::TIMESTAMPTZ
          AND review_notes = 'Synthetic transaction-only approval.'
    ) THEN
        RAISE EXCEPTION 'Recurring ActiveCampaign inventory reset or changed owner approval state';
    END IF;

    RAISE NOTICE 'PASS: Phase C6 sensor idempotency, provenance, permissions, and ActiveCampaign approval preservation validated.';
END;
$validation$;

SELECT 'PASS: Intelligence OS Phase C6 sensor validation completed. Synthetic records were rolled back.' AS validation_result;

ROLLBACK;
