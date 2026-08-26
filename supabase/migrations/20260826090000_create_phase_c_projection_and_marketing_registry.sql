-- Issue #318, Phase C. Deterministic projection runs and read-only marketing governance.
-- This migration does not copy production members, mutate ActiveCampaign, or enable any
-- external executor. Apply to staging first through the reviewed Supabase migration process.

BEGIN;

CREATE TABLE IF NOT EXISTS public.projection_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projection_name TEXT NOT NULL CHECK (char_length(projection_name) BETWEEN 1 AND 160),
    projection_version TEXT NOT NULL CHECK (char_length(projection_version) BETWEEN 1 AND 80),
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'stale')),
    source_window_start TIMESTAMPTZ,
    source_window_end TIMESTAMPTZ,
    source_watermark JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(source_watermark) = 'object'),
    input_records BIGINT NOT NULL DEFAULT 0 CHECK (input_records >= 0),
    output_records BIGINT NOT NULL DEFAULT 0 CHECK (output_records >= 0),
    conflict_records BIGINT NOT NULL DEFAULT 0 CHECK (conflict_records >= 0),
    unmatched_records BIGINT NOT NULL DEFAULT 0 CHECK (unmatched_records >= 0),
    completeness NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (completeness BETWEEN 0 AND 1),
    confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    causation_id UUID,
    trace_id TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    stale_after TIMESTAMPTZ,
    error JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(metadata) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (source_window_end IS NULL OR source_window_start IS NULL OR source_window_end >= source_window_start),
    CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at),
    CHECK (error IS NULL OR jsonb_typeof(error) = 'object')
);

CREATE INDEX IF NOT EXISTS projection_runs_status_stale_idx
    ON public.projection_runs (status, stale_after)
    WHERE status = 'running';

CREATE INDEX IF NOT EXISTS projection_runs_name_created_idx
    ON public.projection_runs (projection_name, created_at DESC);

CREATE INDEX IF NOT EXISTS projection_runs_correlation_idx
    ON public.projection_runs (correlation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.activecampaign_asset_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system TEXT NOT NULL DEFAULT 'activecampaign'
        CHECK (source_system = 'activecampaign'),
    asset_type TEXT NOT NULL
        CHECK (asset_type IN ('list', 'tag', 'field', 'automation', 'campaign', 'segment', 'custom_object', 'pipeline')),
    external_id TEXT NOT NULL CHECK (char_length(external_id) BETWEEN 1 AND 255),
    asset_name TEXT NOT NULL CHECK (char_length(asset_name) BETWEEN 1 AND 500),
    business_scope TEXT NOT NULL DEFAULT 'unknown'
        CHECK (business_scope IN ('nested_objects', 'legacy', 'internal', 'test', 'unknown')),
    lifecycle_status TEXT NOT NULL DEFAULT 'review_required'
        CHECK (lifecycle_status IN ('active', 'inactive', 'quarantined', 'review_required')),
    read_allowed BOOLEAN NOT NULL DEFAULT false,
    mutation_allowed BOOLEAN NOT NULL DEFAULT false
        CHECK (mutation_allowed = false),
    classification_source TEXT NOT NULL CHECK (char_length(classification_source) BETWEEN 1 AND 160),
    classification_evidence JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(classification_evidence) = 'object'),
    confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    review_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (review_status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    last_seen_at TIMESTAMPTZ NOT NULL,
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(source_refs) = 'array'),
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source_system, asset_type, external_id),
    CHECK (
        NOT read_allowed
        OR (
            review_status = 'approved'
            AND business_scope = 'nested_objects'
            AND reviewed_by IS NOT NULL
            AND btrim(reviewed_by) <> ''
            AND reviewed_at IS NOT NULL
        )
    ),
    CHECK (
        review_status = 'pending'
        OR (reviewed_by IS NOT NULL AND btrim(reviewed_by) <> '' AND reviewed_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS activecampaign_asset_registry_review_idx
    ON public.activecampaign_asset_registry (review_status, business_scope, asset_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS activecampaign_asset_registry_read_idx
    ON public.activecampaign_asset_registry (read_allowed, asset_type, external_id)
    WHERE read_allowed;

CREATE TABLE IF NOT EXISTS public.marketing_contact_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system TEXT NOT NULL DEFAULT 'activecampaign'
        CHECK (source_system = 'activecampaign'),
    source_contact_id TEXT NOT NULL CHECK (char_length(source_contact_id) BETWEEN 1 AND 255),
    canonical_member_id UUID REFERENCES public.canonical_members(id) ON DELETE SET NULL,
    classification TEXT NOT NULL
        CHECK (classification IN ('current_member', 'churned_member', 'legacy_wix_candidate', 'cold_import', 'internal', 'test', 'unknown')),
    engagement_state TEXT NOT NULL
        CHECK (engagement_state IN ('clicked', 'opened', 'visited', 'stale', 'never_engaged', 'unknown')),
    membership_truth_state TEXT NOT NULL DEFAULT 'unknown'
        CHECK (membership_truth_state IN ('known', 'unknown', 'conflict')),
    excluded_from_marketing_analysis BOOLEAN NOT NULL DEFAULT false,
    exclusion_reason TEXT,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(evidence) = 'array'),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(source_refs) = 'array'),
    confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    recommended_disposition TEXT NOT NULL DEFAULT 'review'
        CHECK (recommended_disposition IN ('retain', 'quarantine', 'review', 'suppress_candidate')),
    review_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (review_status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    last_observed_at TIMESTAMPTZ NOT NULL,
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    causation_id UUID,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source_system, source_contact_id),
    CHECK (NOT excluded_from_marketing_analysis OR exclusion_reason IS NOT NULL),
    CHECK (
        review_status = 'pending'
        OR (reviewed_by IS NOT NULL AND btrim(reviewed_by) <> '' AND reviewed_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS marketing_contact_classifications_member_idx
    ON public.marketing_contact_classifications (canonical_member_id, classification, updated_at DESC)
    WHERE canonical_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS marketing_contact_classifications_review_idx
    ON public.marketing_contact_classifications (review_status, classification, recommended_disposition, updated_at DESC);

CREATE INDEX IF NOT EXISTS marketing_contact_classifications_exclusion_idx
    ON public.marketing_contact_classifications (excluded_from_marketing_analysis, engagement_state, updated_at DESC)
    WHERE excluded_from_marketing_analysis;

DROP TRIGGER IF EXISTS projection_runs_updated_at ON public.projection_runs;
CREATE TRIGGER projection_runs_updated_at
BEFORE UPDATE ON public.projection_runs
FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at();

DROP TRIGGER IF EXISTS activecampaign_asset_registry_updated_at ON public.activecampaign_asset_registry;
CREATE TRIGGER activecampaign_asset_registry_updated_at
BEFORE UPDATE ON public.activecampaign_asset_registry
FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at();

DROP TRIGGER IF EXISTS marketing_contact_classifications_updated_at ON public.marketing_contact_classifications;
CREATE TRIGGER marketing_contact_classifications_updated_at
BEFORE UPDATE ON public.marketing_contact_classifications
FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at();

COMMENT ON TABLE public.projection_runs IS
    'Durable, idempotent run metadata for canonical member, metric, and lifecycle projections. A failed run is retryable and converges through stable idempotency keys.';
COMMENT ON TABLE public.activecampaign_asset_registry IS
    'Private owner-reviewed allowlist and quarantine registry for ActiveCampaign assets. Phase C permanently blocks mutation executors and does not store connector credentials.';
COMMENT ON TABLE public.marketing_contact_classifications IS
    'Private read-only contact classification results. No contact email or message content is stored here. Classification never changes ActiveCampaign by itself.';

DO $$
DECLARE
    table_name TEXT;
    policy_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'projection_runs',
        'activecampaign_asset_registry',
        'marketing_contact_classifications'
    ]
    LOOP
        policy_name := 'Service role can manage ' || table_name;
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')',
            policy_name,
            table_name
        );
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role', table_name);
    END LOOP;
END;
$$;

COMMIT;
