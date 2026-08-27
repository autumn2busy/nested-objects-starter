-- Issue #318, Phase C6: durable sensor observations and approval-preserving ActiveCampaign inventory.
-- Staging-first. Do not apply to Production without Autumn's explicit approval.

BEGIN;

CREATE TABLE IF NOT EXISTS public.agent_sensor_runs (
    id UUID PRIMARY KEY,
    sensor_name TEXT NOT NULL
        CHECK (sensor_name IN (
            'conversion-events-ledger', 'seo-content-monitor', 'ai-aeo-monitor',
            'content-brief-generator', 'adzuna-opportunity-ingestion', 'activecampaign-readonly'
        )),
    provenance_mode TEXT NOT NULL CHECK (provenance_mode IN ('live', 'baseline', 'fixture')),
    source_generated_at TIMESTAMPTZ,
    first_observed_at TIMESTAMPTZ NOT NULL,
    last_observed_at TIMESTAMPTZ NOT NULL,
    checksum TEXT NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$'),
    health_status TEXT NOT NULL
        CHECK (health_status IN ('healthy', 'degraded', 'failed', 'stale', 'not_configured')),
    source_health JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_health) = 'array'),
    observation_count INTEGER NOT NULL CHECK (observation_count BETWEEN 0 AND 100),
    idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 1 AND 512),
    correlation_id UUID NOT NULL,
    causation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sensor_observations (
    id UUID PRIMARY KEY,
    sensor_run_id UUID NOT NULL REFERENCES public.agent_sensor_runs(id) ON DELETE CASCADE,
    sensor_name TEXT NOT NULL,
    observation_type TEXT NOT NULL CHECK (char_length(observation_type) BETWEEN 1 AND 160),
    source_record_id TEXT NOT NULL CHECK (char_length(source_record_id) BETWEEN 1 AND 512),
    provenance_mode TEXT NOT NULL CHECK (provenance_mode IN ('live', 'baseline', 'fixture')),
    source_generated_at TIMESTAMPTZ,
    first_observed_at TIMESTAMPTZ NOT NULL,
    last_observed_at TIMESTAMPTZ NOT NULL,
    checksum TEXT NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$'),
    payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_refs) = 'array'),
    source_health JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_health) = 'array'),
    idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 1 AND 512),
    correlation_id UUID NOT NULL,
    causation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_sensor_runs_health_idx
    ON public.agent_sensor_runs (health_status, sensor_name, last_observed_at DESC);
CREATE INDEX IF NOT EXISTS sensor_observations_source_idx
    ON public.sensor_observations (sensor_name, observation_type, source_record_id, last_observed_at DESC);
CREATE INDEX IF NOT EXISTS sensor_observations_correlation_idx
    ON public.sensor_observations (correlation_id, last_observed_at DESC);

DROP TRIGGER IF EXISTS agent_sensor_runs_set_updated_at ON public.agent_sensor_runs;
CREATE TRIGGER agent_sensor_runs_set_updated_at
    BEFORE UPDATE ON public.agent_sensor_runs
    FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at();

DROP TRIGGER IF EXISTS sensor_observations_set_updated_at ON public.sensor_observations;
CREATE TRIGGER sensor_observations_set_updated_at
    BEFORE UPDATE ON public.sensor_observations
    FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at();

CREATE OR REPLACE FUNCTION public.persist_agent_sensor_batch(
    p_batch JSONB,
    p_observations JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    run_record public.agent_sensor_runs%ROWTYPE;
    observation_record public.sensor_observations%ROWTYPE;
    item JSONB;
    observation_count INTEGER;
    affected_rows INTEGER;
    disposition TEXT;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for sensor persistence';
    END IF;
    IF p_batch IS NULL
       OR p_observations IS NULL
       OR jsonb_typeof(p_batch) <> 'object'
       OR jsonb_typeof(p_observations) <> 'array' THEN
        RAISE EXCEPTION 'sensor persistence payload shape is invalid';
    END IF;
    observation_count := jsonb_array_length(p_observations);
    IF observation_count > 100 OR (p_batch->>'observation_count')::INTEGER <> observation_count THEN
        RAISE EXCEPTION 'sensor observation batch exceeds or disagrees with its committed bound';
    END IF;
    IF p_batch->>'sensor_name' NOT IN (
        'conversion-events-ledger', 'seo-content-monitor', 'ai-aeo-monitor',
        'content-brief-generator', 'adzuna-opportunity-ingestion', 'activecampaign-readonly'
    ) OR p_batch->>'provenance_mode' NOT IN ('live', 'baseline', 'fixture') THEN
        RAISE EXCEPTION 'sensor name or provenance mode is unsupported';
    END IF;

    INSERT INTO public.agent_sensor_runs (
        id, sensor_name, provenance_mode, source_generated_at,
        first_observed_at, last_observed_at, checksum, health_status,
        source_health, observation_count, idempotency_key,
        correlation_id, causation_id
    ) VALUES (
        (p_batch->>'id')::UUID, p_batch->>'sensor_name', p_batch->>'provenance_mode',
        NULLIF(p_batch->>'source_generated_at', '')::TIMESTAMPTZ,
        (p_batch->>'observed_at')::TIMESTAMPTZ, (p_batch->>'observed_at')::TIMESTAMPTZ,
        p_batch->>'checksum', p_batch->>'health_status',
        COALESCE(p_batch->'source_health', '[]'::jsonb), observation_count,
        p_batch->>'idempotency_key', (p_batch->>'correlation_id')::UUID,
        NULLIF(p_batch->>'causation_id', '')::UUID
    ) ON CONFLICT (idempotency_key) DO NOTHING;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    disposition := CASE WHEN affected_rows = 1 THEN 'created' ELSE 'reused' END;

    SELECT * INTO run_record
    FROM public.agent_sensor_runs
    WHERE idempotency_key = p_batch->>'idempotency_key'
    FOR UPDATE;
    IF run_record.id IS DISTINCT FROM (p_batch->>'id')::UUID
       OR run_record.sensor_name IS DISTINCT FROM p_batch->>'sensor_name'
       OR run_record.provenance_mode IS DISTINCT FROM p_batch->>'provenance_mode'
       OR run_record.source_generated_at IS DISTINCT FROM NULLIF(p_batch->>'source_generated_at', '')::TIMESTAMPTZ
       OR run_record.checksum IS DISTINCT FROM p_batch->>'checksum'
       OR run_record.observation_count IS DISTINCT FROM observation_count THEN
        RAISE EXCEPTION 'sensor run idempotency key was reused with different content';
    END IF;
    UPDATE public.agent_sensor_runs
    SET last_observed_at = GREATEST(last_observed_at, (p_batch->>'observed_at')::TIMESTAMPTZ),
        health_status = p_batch->>'health_status',
        source_health = COALESCE(p_batch->'source_health', '[]'::jsonb)
    WHERE id = run_record.id;

    FOR item IN SELECT value FROM jsonb_array_elements(p_observations)
    LOOP
        IF item->>'sensor_run_id' IS DISTINCT FROM run_record.id::TEXT
           OR item->>'sensor_name' IS DISTINCT FROM run_record.sensor_name
           OR item->>'provenance_mode' IS DISTINCT FROM run_record.provenance_mode THEN
            RAISE EXCEPTION 'sensor observation does not match its run';
        END IF;
        INSERT INTO public.sensor_observations (
            id, sensor_run_id, sensor_name, observation_type, source_record_id,
            provenance_mode, source_generated_at, first_observed_at, last_observed_at,
            checksum, payload, source_refs, source_health, idempotency_key,
            correlation_id, causation_id
        ) VALUES (
            (item->>'id')::UUID, run_record.id, item->>'sensor_name',
            item->>'observation_type', item->>'source_record_id', item->>'provenance_mode',
            NULLIF(item->>'source_generated_at', '')::TIMESTAMPTZ,
            (item->>'observed_at')::TIMESTAMPTZ, (item->>'observed_at')::TIMESTAMPTZ,
            item->>'checksum', COALESCE(item->'payload', '{}'::jsonb),
            COALESCE(item->'source_refs', '[]'::jsonb), COALESCE(item->'source_health', '[]'::jsonb),
            item->>'idempotency_key', (item->>'correlation_id')::UUID,
            NULLIF(item->>'causation_id', '')::UUID
        ) ON CONFLICT (idempotency_key) DO NOTHING;

        SELECT * INTO observation_record
        FROM public.sensor_observations
        WHERE idempotency_key = item->>'idempotency_key'
        FOR UPDATE;
        IF observation_record.id IS DISTINCT FROM (item->>'id')::UUID
           OR observation_record.sensor_run_id IS DISTINCT FROM run_record.id
           OR observation_record.sensor_name IS DISTINCT FROM item->>'sensor_name'
           OR observation_record.observation_type IS DISTINCT FROM item->>'observation_type'
           OR observation_record.source_record_id IS DISTINCT FROM item->>'source_record_id'
           OR observation_record.provenance_mode IS DISTINCT FROM item->>'provenance_mode'
           OR observation_record.source_generated_at IS DISTINCT FROM NULLIF(item->>'source_generated_at', '')::TIMESTAMPTZ
           OR observation_record.checksum IS DISTINCT FROM item->>'checksum'
           OR observation_record.payload IS DISTINCT FROM COALESCE(item->'payload', '{}'::jsonb)
           OR observation_record.source_refs IS DISTINCT FROM COALESCE(item->'source_refs', '[]'::jsonb) THEN
            RAISE EXCEPTION 'sensor observation idempotency key was reused with different content';
        END IF;
        UPDATE public.sensor_observations
        SET last_observed_at = GREATEST(last_observed_at, (item->>'observed_at')::TIMESTAMPTZ),
            source_health = COALESCE(item->'source_health', '[]'::jsonb)
        WHERE id = observation_record.id;
    END LOOP;

    INSERT INTO public.agent_events (
        event_type, producer, subject_type, subject_id, payload,
        correlation_id, causation_id, idempotency_key
    ) VALUES (
        'agent.sensor_batch.persisted', run_record.sensor_name, 'agent_sensor_run', run_record.id::TEXT,
        jsonb_build_object(
            'provenanceMode', run_record.provenance_mode,
            'healthStatus', p_batch->>'health_status',
            'observationCount', observation_count,
            'checksum', run_record.checksum
        ), run_record.correlation_id, run_record.causation_id,
        'sensor-run:' || run_record.id::TEXT || ':persisted'
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN jsonb_build_object(
        'disposition', disposition,
        'runCount', 1,
        'observationCount', observation_count
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_activecampaign_asset_inventory(p_assets JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    item JSONB;
    asset_count INTEGER;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for ActiveCampaign inventory persistence';
    END IF;
    IF p_assets IS NULL
       OR jsonb_typeof(p_assets) <> 'array'
       OR jsonb_array_length(p_assets) > 500 THEN
        RAISE EXCEPTION 'ActiveCampaign inventory must be an array of at most 500 assets';
    END IF;
    asset_count := jsonb_array_length(p_assets);
    FOR item IN SELECT value FROM jsonb_array_elements(p_assets)
    LOOP
        IF item->>'source_system' <> 'activecampaign'
           OR COALESCE((item->>'mutation_allowed')::BOOLEAN, false)
           OR COALESCE((item->>'read_allowed')::BOOLEAN, false)
           OR item->>'review_status' <> 'pending' THEN
            RAISE EXCEPTION 'Recurring ActiveCampaign inventory must remain pending, unreadable, and mutation-disabled';
        END IF;
        INSERT INTO public.activecampaign_asset_registry (
            source_system, asset_type, external_id, asset_name, business_scope,
            lifecycle_status, read_allowed, mutation_allowed, classification_source,
            classification_evidence, confidence, review_status, last_seen_at,
            source_refs, idempotency_key
        ) VALUES (
            'activecampaign', item->>'asset_type', item->>'external_id', item->>'asset_name',
            item->>'business_scope', item->>'lifecycle_status', false, false,
            item->>'classification_source', COALESCE(item->'classification_evidence', '{}'::jsonb),
            (item->>'confidence')::NUMERIC, 'pending', (item->>'last_seen_at')::TIMESTAMPTZ,
            COALESCE(item->'source_refs', '[]'::jsonb), item->>'idempotency_key'
        ) ON CONFLICT (source_system, asset_type, external_id) DO UPDATE
        SET asset_name = EXCLUDED.asset_name,
            business_scope = CASE
                WHEN public.activecampaign_asset_registry.review_status = 'pending'
                    THEN EXCLUDED.business_scope
                ELSE public.activecampaign_asset_registry.business_scope
            END,
            lifecycle_status = EXCLUDED.lifecycle_status,
            classification_source = EXCLUDED.classification_source,
            classification_evidence = EXCLUDED.classification_evidence,
            confidence = EXCLUDED.confidence,
            last_seen_at = GREATEST(public.activecampaign_asset_registry.last_seen_at, EXCLUDED.last_seen_at),
            source_refs = EXCLUDED.source_refs,
            idempotency_key = EXCLUDED.idempotency_key;
    END LOOP;
    RETURN asset_count;
END;
$$;

ALTER TABLE public.agent_sensor_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can read agent sensor runs" ON public.agent_sensor_runs;
CREATE POLICY "Service role can read agent sensor runs" ON public.agent_sensor_runs
    FOR SELECT USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role can read sensor observations" ON public.sensor_observations;
CREATE POLICY "Service role can read sensor observations" ON public.sensor_observations
    FOR SELECT USING (auth.role() = 'service_role');

REVOKE ALL ON TABLE public.agent_sensor_runs FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.sensor_observations FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.agent_sensor_runs TO service_role;
GRANT SELECT ON TABLE public.sensor_observations TO service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.activecampaign_asset_registry FROM service_role;
GRANT SELECT ON TABLE public.activecampaign_asset_registry TO service_role;

REVOKE ALL ON FUNCTION public.persist_agent_sensor_batch(JSONB, JSONB)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.upsert_activecampaign_asset_inventory(JSONB)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.persist_agent_sensor_batch(JSONB, JSONB)
    TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_activecampaign_asset_inventory(JSONB)
    TO service_role;

COMMENT ON TABLE public.agent_sensor_runs IS
    'Private durable sensor-run ledger with explicit live, baseline, or fixture provenance and source-health state.';
COMMENT ON TABLE public.sensor_observations IS
    'Private normalized sensor observations. Existing collectors remain intact; this ledger avoids same-deployment Git report dependencies.';
COMMENT ON FUNCTION public.upsert_activecampaign_asset_inventory(JSONB) IS
    'Refreshes candidate metadata without resetting owner review, read approval, reviewer identity, or mutation denial.';

COMMIT;
