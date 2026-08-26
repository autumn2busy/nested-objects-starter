-- Issue #318, Phase B. Shared truth, operational memory, approval policy, and observability.
-- This migration deliberately reuses public.conversion_events as the raw first-party
-- behavioral and conversion ledger. It does not create or alter a parallel raw event system.
-- Apply through the normal reviewed Supabase migration process only. Do not run directly
-- against production from an agent session.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.intelligence_os_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.canonical_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_email TEXT,
    identity_status TEXT NOT NULL DEFAULT 'unresolved'
        CHECK (identity_status IN ('unresolved', 'resolved', 'conflict', 'merged')),
    data_quality_status TEXT NOT NULL DEFAULT 'unknown'
        CHECK (data_quality_status IN ('complete', 'partial', 'conflict', 'unknown')),
    data_quality_score NUMERIC(5,4) NOT NULL DEFAULT 0
        CHECK (data_quality_score BETWEEN 0 AND 1),
    data_quality_details JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(data_quality_details) = 'object'),
    profile_facts JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(profile_facts) = 'object'),
    merged_into_member_id UUID REFERENCES public.canonical_members(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (primary_email IS NULL OR char_length(primary_email) BETWEEN 3 AND 320),
    CHECK (
        (identity_status = 'merged' AND merged_into_member_id IS NOT NULL)
        OR (identity_status <> 'merged' AND merged_into_member_id IS NULL)
    ),
    CHECK (merged_into_member_id IS NULL OR merged_into_member_id <> id)
);

CREATE UNIQUE INDEX IF NOT EXISTS canonical_members_primary_email_uidx
    ON public.canonical_members (lower(primary_email))
    WHERE primary_email IS NOT NULL AND merged_into_member_id IS NULL;

CREATE INDEX IF NOT EXISTS canonical_members_identity_status_idx
    ON public.canonical_members (identity_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.member_identity_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.canonical_members(id) ON DELETE CASCADE,
    source_system TEXT NOT NULL CHECK (char_length(source_system) BETWEEN 1 AND 80),
    identifier_type TEXT NOT NULL CHECK (char_length(identifier_type) BETWEEN 1 AND 80),
    external_id TEXT NOT NULL CHECK (char_length(external_id) BETWEEN 1 AND 512),
    normalized_external_id TEXT NOT NULL CHECK (char_length(normalized_external_id) BETWEEN 1 AND 512),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'conflict', 'revoked')),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    confidence NUMERIC(5,4) NOT NULL DEFAULT 1
        CHECK (confidence BETWEEN 0 AND 1),
    verified_at TIMESTAMPTZ,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(source_refs) = 'array'),
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(provenance) = 'object'),
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source_system, identifier_type, normalized_external_id),
    UNIQUE (idempotency_key),
    CHECK (last_seen_at >= first_seen_at)
);

CREATE INDEX IF NOT EXISTS member_identity_links_member_idx
    ON public.member_identity_links (member_id, status, source_system, identifier_type);

CREATE INDEX IF NOT EXISTS member_identity_links_external_lookup_idx
    ON public.member_identity_links (source_system, identifier_type, normalized_external_id);

CREATE TABLE IF NOT EXISTS public.member_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.canonical_members(id) ON DELETE CASCADE,
    source_system TEXT NOT NULL CHECK (char_length(source_system) BETWEEN 1 AND 80),
    source_record_id TEXT,
    is_authoritative BOOLEAN NOT NULL DEFAULT false,
    authority_rank SMALLINT NOT NULL DEFAULT 0 CHECK (authority_rank BETWEEN 0 AND 100),
    membership_tier TEXT NOT NULL DEFAULT 'unknown'
        CHECK (membership_tier IN ('free', 'starter', 'founders', 'pro', 'elite', 'agency', 'unknown')),
    membership_status TEXT NOT NULL DEFAULT 'unknown'
        CHECK (membership_status IN ('active', 'trialing', 'past_due', 'canceled', 'paused', 'incomplete', 'unknown')),
    plan_uid TEXT,
    subscription_uid TEXT,
    subscription_start_at TIMESTAMPTZ,
    renewal_at TIMESTAMPTZ,
    cancellation_at TIMESTAMPTZ,
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
    mrr NUMERIC(18,4),
    arr NUMERIC(18,4),
    lifetime_revenue NUMERIC(18,4),
    revenue_state TEXT NOT NULL DEFAULT 'unknown'
        CHECK (revenue_state IN ('known', 'partial', 'unknown', 'not_applicable')),
    snapshot_at TIMESTAMPTZ NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_to TIMESTAMPTZ,
    is_current BOOLEAN NOT NULL DEFAULT true,
    completeness NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (completeness BETWEEN 0 AND 1),
    confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(source_refs) = 'array'),
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(provenance) = 'object'),
    data_quality JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(data_quality) = 'object'),
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (source_system <> 'activecampaign' OR is_authoritative = false),
    CHECK (NOT is_authoritative OR authority_rank > 0),
    CHECK (mrr IS NULL OR mrr >= 0),
    CHECK (arr IS NULL OR arr >= 0),
    CHECK (lifetime_revenue IS NULL OR lifetime_revenue >= 0),
    CHECK (
        revenue_state NOT IN ('unknown', 'not_applicable')
        OR (mrr IS NULL AND arr IS NULL AND lifetime_revenue IS NULL)
    ),
    CHECK (valid_to IS NULL OR valid_to >= valid_from),
    CHECK ((is_current AND valid_to IS NULL) OR (NOT is_current))
);

CREATE UNIQUE INDEX IF NOT EXISTS member_memberships_current_source_uidx
    ON public.member_memberships (member_id, source_system)
    WHERE is_current;

CREATE INDEX IF NOT EXISTS member_memberships_authority_idx
    ON public.member_memberships (member_id, is_authoritative DESC, authority_rank DESC, snapshot_at DESC)
    WHERE is_current;

CREATE TABLE IF NOT EXISTS public.member_operational_profiles (
    member_id UUID PRIMARY KEY REFERENCES public.canonical_members(id) ON DELETE CASCADE,
    state TEXT,
    counties TEXT[] NOT NULL DEFAULT '{}'::text[],
    service_radius_miles NUMERIC(8,2),
    experience_level TEXT,
    inspection_types TEXT[] NOT NULL DEFAULT '{}'::text[],
    profile_completion NUMERIC(5,4),
    training_completion NUMERIC(5,4),
    last_seen_at TIMESTAMPTZ,
    directory_views BIGINT NOT NULL DEFAULT 0,
    firm_views BIGINT NOT NULL DEFAULT 0,
    paywall_hits BIGINT NOT NULL DEFAULT 0,
    opportunity_clicks BIGINT NOT NULL DEFAULT 0,
    activecampaign_engagement JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(activecampaign_engagement) = 'object'),
    signup_source TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    data_state TEXT NOT NULL DEFAULT 'unknown'
        CHECK (data_state IN ('known', 'partial', 'unknown')),
    completeness NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (completeness BETWEEN 0 AND 1),
    confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(source_refs) = 'array'),
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(provenance) = 'object'),
    projection_version TEXT NOT NULL DEFAULT 'phase-b-v1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (service_radius_miles IS NULL OR service_radius_miles >= 0),
    CHECK (profile_completion IS NULL OR profile_completion BETWEEN 0 AND 1),
    CHECK (training_completion IS NULL OR training_completion BETWEEN 0 AND 1),
    CHECK (directory_views >= 0 AND firm_views >= 0 AND paywall_hits >= 0 AND opportunity_clicks >= 0)
);

CREATE INDEX IF NOT EXISTS member_operational_profiles_last_seen_idx
    ON public.member_operational_profiles (last_seen_at DESC);

CREATE TABLE IF NOT EXISTS public.business_metrics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    metric_name TEXT NOT NULL CHECK (char_length(metric_name) BETWEEN 1 AND 160),
    domain TEXT NOT NULL
        CHECK (domain IN ('growth', 'revenue', 'marketing', 'product', 'seo', 'aeo', 'industry', 'opportunity', 'operations', 'technical', 'other')),
    scope_key TEXT NOT NULL DEFAULT 'global' CHECK (char_length(scope_key) BETWEEN 1 AND 160),
    dimensions JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(dimensions) = 'object'),
    numeric_value NUMERIC(24,6),
    value_state TEXT NOT NULL
        CHECK (value_state IN ('known', 'partial', 'unknown', 'not_applicable')),
    unit TEXT NOT NULL DEFAULT 'count' CHECK (char_length(unit) BETWEEN 1 AND 40),
    numerator NUMERIC(24,6),
    denominator NUMERIC(24,6),
    observed_records BIGINT,
    expected_records BIGINT,
    completeness NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (completeness BETWEEN 0 AND 1),
    confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    source_system TEXT NOT NULL CHECK (char_length(source_system) BETWEEN 1 AND 80),
    source_run_id TEXT,
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(source_refs) = 'array'),
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(provenance) = 'object'),
    observed_at TIMESTAMPTZ,
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    causation_id UUID,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        (value_state IN ('known', 'partial') AND numeric_value IS NOT NULL)
        OR (value_state IN ('unknown', 'not_applicable') AND numeric_value IS NULL)
    ),
    CHECK (observed_records IS NULL OR observed_records >= 0),
    CHECK (expected_records IS NULL OR expected_records >= 0),
    CHECK (denominator IS NULL OR denominator >= 0)
);

CREATE INDEX IF NOT EXISTS business_metrics_daily_lookup_idx
    ON public.business_metrics_daily (metric_name, metric_date DESC, scope_key);

CREATE INDEX IF NOT EXISTS business_metrics_daily_domain_idx
    ON public.business_metrics_daily (domain, metric_date DESC);

CREATE INDEX IF NOT EXISTS business_metrics_daily_correlation_idx
    ON public.business_metrics_daily (correlation_id, metric_date DESC);

CREATE TABLE IF NOT EXISTS public.experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
    hypothesis TEXT NOT NULL CHECK (char_length(hypothesis) BETWEEN 1 AND 2000),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'planned', 'running', 'paused', 'completed', 'cancelled')),
    audience JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(audience) = 'object'),
    primary_metric TEXT NOT NULL CHECK (char_length(primary_metric) BETWEEN 1 AND 160),
    secondary_metrics JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(secondary_metrics) = 'array'),
    baseline NUMERIC(24,6),
    target NUMERIC(24,6),
    minimum_sample_size INTEGER NOT NULL CHECK (minimum_sample_size > 0),
    minimum_duration_days INTEGER NOT NULL CHECK (minimum_duration_days > 0),
    observed_sample_size INTEGER NOT NULL DEFAULT 0 CHECK (observed_sample_size >= 0),
    observed_duration_days INTEGER NOT NULL DEFAULT 0 CHECK (observed_duration_days >= 0),
    analysis_state TEXT NOT NULL DEFAULT 'insufficient_data'
        CHECK (analysis_state IN ('insufficient_data', 'ready', 'conclusive', 'inconclusive')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    result JSONB,
    confidence NUMERIC(5,4) CHECK (confidence BETWEEN 0 AND 1),
    decision TEXT,
    guardrails JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(guardrails) = 'object'),
    source_action_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    causation_id UUID,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at),
    CHECK (
        (result IS NULL AND decision IS NULL)
        OR (
            status = 'completed'
            AND observed_sample_size >= minimum_sample_size
            AND observed_duration_days >= minimum_duration_days
            AND analysis_state IN ('ready', 'conclusive', 'inconclusive')
        )
    )
);

CREATE INDEX IF NOT EXISTS experiments_status_idx
    ON public.experiments (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS experiments_correlation_idx
    ON public.experiments (correlation_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.intelligence_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_type TEXT NOT NULL CHECK (char_length(signal_type) BETWEEN 1 AND 160),
    domain TEXT NOT NULL
        CHECK (domain IN ('growth', 'revenue', 'marketing', 'seo', 'aeo', 'industry', 'opportunity', 'member_feedback', 'product', 'technical', 'operations', 'other')),
    producer TEXT NOT NULL CHECK (char_length(producer) BETWEEN 1 AND 160),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 240),
    summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 4000),
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(evidence) = 'array'),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(source_refs) = 'array'),
    confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    severity TEXT NOT NULL DEFAULT 'info'
        CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    priority SMALLINT NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 100),
    business_impact TEXT,
    affected_entities JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(affected_entities) = 'array'),
    recommended_follow_up TEXT,
    fingerprint TEXT NOT NULL CHECK (char_length(fingerprint) BETWEEN 1 AND 512),
    idempotency_key TEXT UNIQUE,
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'investigating', 'actioned', 'dismissed', 'resolved')),
    first_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    causation_id UUID,
    data_quality JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(data_quality) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (producer, fingerprint),
    CHECK (last_detected_at >= first_detected_at)
);

CREATE INDEX IF NOT EXISTS intelligence_signals_status_priority_idx
    ON public.intelligence_signals (status, priority DESC, last_detected_at DESC);

CREATE INDEX IF NOT EXISTS intelligence_signals_domain_idx
    ON public.intelligence_signals (domain, last_detected_at DESC);

CREATE INDEX IF NOT EXISTS intelligence_signals_correlation_idx
    ON public.intelligence_signals (correlation_id, last_detected_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type TEXT NOT NULL CHECK (char_length(task_type) BETWEEN 1 AND 160),
    assigned_agent TEXT NOT NULL CHECK (char_length(assigned_agent) BETWEEN 1 AND 160),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'queued', 'running', 'succeeded', 'failed', 'cancelled', 'blocked', 'stale')),
    priority SMALLINT NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 100),
    input JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(input) = 'object'),
    output JSONB,
    concise_rationale TEXT,
    parent_task_id UUID REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
    signal_id UUID REFERENCES public.intelligence_signals(id) ON DELETE SET NULL,
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    causation_id UUID,
    trace_id TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
    retry_after TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (attempts <= max_attempts),
    CHECK (output IS NULL OR jsonb_typeof(output) = 'object'),
    CHECK (error IS NULL OR jsonb_typeof(error) = 'object'),
    CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);

CREATE INDEX IF NOT EXISTS agent_tasks_queue_idx
    ON public.agent_tasks (status, priority DESC, created_at);

CREATE INDEX IF NOT EXISTS agent_tasks_correlation_idx
    ON public.agent_tasks (correlation_id, created_at);

CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL CHECK (char_length(agent_name) BETWEEN 1 AND 160),
    workflow_name TEXT NOT NULL CHECK (char_length(workflow_name) BETWEEN 1 AND 160),
    workflow_run_id TEXT,
    durable_workflow_id TEXT,
    task_id UUID REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
    provider TEXT,
    model TEXT,
    runtime_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'stale')),
    input JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(input) = 'object'),
    output JSONB,
    concise_rationale TEXT,
    tool_calls JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(tool_calls) = 'array'),
    input_tokens BIGINT CHECK (input_tokens IS NULL OR input_tokens >= 0),
    output_tokens BIGINT CHECK (output_tokens IS NULL OR output_tokens >= 0),
    estimated_cost NUMERIC(18,8) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
    attempt INTEGER NOT NULL DEFAULT 0 CHECK (attempt >= 0),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
    retry_after TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_heartbeat_at TIMESTAMPTZ,
    stale_after TIMESTAMPTZ,
    duration_ms BIGINT CHECK (duration_ms IS NULL OR duration_ms >= 0),
    error JSONB,
    trace_id TEXT,
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    causation_id UUID,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (attempt <= max_attempts),
    CHECK (output IS NULL OR jsonb_typeof(output) = 'object'),
    CHECK (error IS NULL OR jsonb_typeof(error) = 'object'),
    CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_runs_workflow_run_uidx
    ON public.agent_runs (workflow_run_id)
    WHERE workflow_run_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_runs_status_stale_idx
    ON public.agent_runs (status, stale_after)
    WHERE status = 'running';

CREATE INDEX IF NOT EXISTS agent_runs_correlation_idx
    ON public.agent_runs (correlation_id, created_at);

CREATE TABLE IF NOT EXISTS public.agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL CHECK (char_length(action_type) BETWEEN 1 AND 200),
    target_system TEXT NOT NULL CHECK (char_length(target_system) BETWEEN 1 AND 160),
    requested_by_agent TEXT NOT NULL CHECK (char_length(requested_by_agent) BETWEEN 1 AND 160),
    task_id UUID REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
    run_id UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
    signal_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
    payload JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(payload) = 'object'),
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(evidence) = 'array'),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(source_refs) = 'array'),
    concise_rationale TEXT NOT NULL CHECK (char_length(concise_rationale) BETWEEN 1 AND 4000),
    risk_level TEXT NOT NULL
        CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    approval_required BOOLEAN NOT NULL,
    status TEXT NOT NULL DEFAULT 'proposed'
        CHECK (status IN ('proposed', 'awaiting_approval', 'approved', 'executing', 'executed', 'verified', 'rejected', 'failed', 'cancelled')),
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    approval_authority TEXT,
    approval_context JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(approval_context) = 'object'),
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    executor_key TEXT,
    execution_guard_version TEXT NOT NULL DEFAULT 'phase-b-v1',
    execution_started_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    execution_result JSONB,
    verification_status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (verification_status IN ('not_started', 'pending', 'verified', 'failed', 'not_applicable')),
    verified_at TIMESTAMPTZ,
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    causation_id UUID,
    trace_id TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (execution_result IS NULL OR jsonb_typeof(execution_result) = 'object'),
    CHECK (risk_level NOT IN ('high', 'critical') OR approval_required),
    CHECK (approved_at IS NULL OR approved_by IS NOT NULL),
    CHECK (rejected_at IS NULL OR (rejected_by IS NOT NULL AND rejection_reason IS NOT NULL)),
    CHECK (executed_at IS NULL OR execution_started_at IS NOT NULL),
    CHECK (verified_at IS NULL OR executed_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS agent_actions_approval_queue_idx
    ON public.agent_actions (status, risk_level, created_at)
    WHERE status IN ('proposed', 'awaiting_approval', 'approved');

CREATE INDEX IF NOT EXISTS agent_actions_correlation_idx
    ON public.agent_actions (correlation_id, created_at);

CREATE TABLE IF NOT EXISTS public.agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (char_length(event_type) BETWEEN 1 AND 160),
    producer TEXT NOT NULL CHECK (char_length(producer) BETWEEN 1 AND 160),
    subject_type TEXT NOT NULL CHECK (char_length(subject_type) BETWEEN 1 AND 80),
    subject_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(payload) = 'object'),
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(evidence) = 'array'),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(source_refs) = 'array'),
    confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    priority SMALLINT NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 100),
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    causation_id UUID,
    trace_id TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_events_type_created_idx
    ON public.agent_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_events_correlation_idx
    ON public.agent_events (correlation_id, created_at);

CREATE OR REPLACE FUNCTION public.enforce_agent_action_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    transition_allowed BOOLEAN := false;
BEGIN
    -- An LLM instruction is not approval. Explicit owner approval is required before
    -- consequential action execution, and direct inserts cannot skip the proposal state.
    IF TG_OP = 'INSERT' AND NEW.status <> 'proposed' THEN
        RAISE EXCEPTION 'agent_actions must be inserted in proposed status';
    END IF;

    IF NEW.risk_level IN ('high', 'critical') AND NOT NEW.approval_required THEN
        RAISE EXCEPTION 'high and critical actions must require approval';
    END IF;

    IF NEW.approval_required
       AND NEW.status IN ('approved', 'executing', 'executed', 'verified')
       AND (
           NEW.approved_by IS NULL
           OR btrim(NEW.approved_by) = ''
           OR NEW.approved_at IS NULL
           OR NEW.approval_authority IS DISTINCT FROM 'owner'
       ) THEN
        RAISE EXCEPTION 'explicit owner approval is required before consequential action execution';
    END IF;

    IF NEW.status IN ('executing', 'executed', 'verified')
       AND (NEW.executor_key IS NULL OR btrim(NEW.executor_key) = '') THEN
        RAISE EXCEPTION 'executing actions require a registered executor key';
    END IF;

    IF TG_OP = 'UPDATE'
       AND OLD.status IN ('awaiting_approval', 'approved', 'executing', 'executed', 'verified')
       AND (
           OLD.action_type IS DISTINCT FROM NEW.action_type
           OR OLD.target_system IS DISTINCT FROM NEW.target_system
           OR OLD.payload IS DISTINCT FROM NEW.payload
           OR OLD.risk_level IS DISTINCT FROM NEW.risk_level
           OR OLD.approval_required IS DISTINCT FROM NEW.approval_required
           OR OLD.idempotency_key IS DISTINCT FROM NEW.idempotency_key
       ) THEN
        RAISE EXCEPTION 'approved or approval-pending action contract is immutable';
    END IF;

    IF TG_OP = 'UPDATE'
       AND OLD.status IN ('approved', 'executing', 'executed', 'verified')
       AND (
           OLD.approved_by IS DISTINCT FROM NEW.approved_by
           OR OLD.approved_at IS DISTINCT FROM NEW.approved_at
           OR OLD.approval_authority IS DISTINCT FROM NEW.approval_authority
           OR OLD.approval_context IS DISTINCT FROM NEW.approval_context
       ) THEN
        RAISE EXCEPTION 'approval record is immutable after approval';
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        transition_allowed := CASE OLD.status
            WHEN 'proposed' THEN NEW.status IN ('awaiting_approval', 'approved', 'cancelled')
            WHEN 'awaiting_approval' THEN NEW.status IN ('approved', 'rejected', 'cancelled')
            WHEN 'approved' THEN NEW.status IN ('executing', 'cancelled')
            WHEN 'executing' THEN NEW.status IN ('executed', 'failed', 'cancelled')
            WHEN 'executed' THEN NEW.status IN ('verified', 'failed')
            ELSE false
        END;

        IF NOT transition_allowed THEN
            RAISE EXCEPTION 'invalid agent action transition: % -> %', OLD.status, NEW.status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agent_actions_lifecycle_guard ON public.agent_actions;
CREATE TRIGGER agent_actions_lifecycle_guard
BEFORE INSERT OR UPDATE ON public.agent_actions
FOR EACH ROW EXECUTE FUNCTION public.enforce_agent_action_lifecycle();

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'canonical_members',
        'member_identity_links',
        'member_memberships',
        'member_operational_profiles',
        'business_metrics_daily',
        'experiments',
        'intelligence_signals',
        'agent_tasks',
        'agent_runs',
        'agent_actions',
        'agent_events'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', table_name || '_updated_at', table_name);
        EXECUTE format(
            'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at()',
            table_name || '_updated_at',
            table_name
        );
    END LOOP;
END;
$$;

CREATE OR REPLACE VIEW public.member_authority_conflicts
WITH (security_invoker = true)
AS
WITH current_snapshots AS (
    SELECT *
    FROM public.member_memberships
    WHERE is_current
),
ranked_authority AS (
    SELECT
        membership.*,
        row_number() OVER (
            PARTITION BY membership.member_id
            ORDER BY membership.authority_rank DESC, membership.snapshot_at DESC, membership.created_at DESC
        ) AS authority_order
    FROM current_snapshots AS membership
    WHERE membership.is_authoritative
),
selected_authority AS (
    SELECT *
    FROM ranked_authority
    WHERE authority_order = 1
),
mismatches AS (
    SELECT
        snapshot.member_id,
        authority.id AS authoritative_membership_id,
        snapshot.id AS conflicting_membership_id,
        CASE
            WHEN snapshot.is_authoritative THEN 'multiple_authorities'
            WHEN snapshot.membership_tier IS DISTINCT FROM authority.membership_tier THEN 'tier_mismatch'
            WHEN snapshot.membership_status IS DISTINCT FROM authority.membership_status THEN 'status_mismatch'
            ELSE 'plan_mismatch'
        END AS conflict_type,
        authority.source_system AS authoritative_source,
        snapshot.source_system AS conflicting_source,
        array_remove(ARRAY[
            CASE WHEN snapshot.membership_tier IS DISTINCT FROM authority.membership_tier THEN 'membership_tier' END,
            CASE WHEN snapshot.membership_status IS DISTINCT FROM authority.membership_status THEN 'membership_status' END,
            CASE WHEN snapshot.plan_uid IS DISTINCT FROM authority.plan_uid THEN 'plan_uid' END
        ], NULL) AS conflicting_fields,
        authority.snapshot_at AS authoritative_snapshot_at,
        snapshot.snapshot_at AS conflicting_snapshot_at
    FROM current_snapshots AS snapshot
    JOIN selected_authority AS authority ON authority.member_id = snapshot.member_id
    WHERE snapshot.id <> authority.id
      AND (
          snapshot.membership_tier IS DISTINCT FROM authority.membership_tier
          OR snapshot.membership_status IS DISTINCT FROM authority.membership_status
          OR snapshot.plan_uid IS DISTINCT FROM authority.plan_uid
      )
),
marketing_without_authority AS (
    SELECT
        snapshot.member_id,
        NULL::UUID AS authoritative_membership_id,
        snapshot.id AS conflicting_membership_id,
        'marketing_claim_without_authority'::TEXT AS conflict_type,
        NULL::TEXT AS authoritative_source,
        snapshot.source_system AS conflicting_source,
        ARRAY['membership_tier']::TEXT[] AS conflicting_fields,
        NULL::TIMESTAMPTZ AS authoritative_snapshot_at,
        snapshot.snapshot_at AS conflicting_snapshot_at
    FROM current_snapshots AS snapshot
    WHERE snapshot.source_system = 'activecampaign'
      AND snapshot.membership_tier NOT IN ('free', 'unknown')
      AND NOT EXISTS (
          SELECT 1
          FROM selected_authority AS authority
          WHERE authority.member_id = snapshot.member_id
      )
)
SELECT * FROM mismatches
UNION ALL
SELECT * FROM marketing_without_authority;

CREATE OR REPLACE VIEW public.member_360
WITH (security_invoker = true)
AS
WITH identities AS (
    SELECT
        link.member_id,
        max(link.normalized_external_id) FILTER (
            WHERE link.source_system = 'supabase' AND link.identifier_type = 'profile_id' AND link.status = 'active'
        ) AS supabase_profile_id,
        max(link.normalized_external_id) FILTER (
            WHERE link.source_system = 'supabase' AND link.identifier_type = 'user_id' AND link.status = 'active'
        ) AS supabase_user_id,
        max(link.normalized_external_id) FILTER (
            WHERE link.source_system = 'outseta' AND link.identifier_type = 'person_uid' AND link.status = 'active'
        ) AS outseta_person_uid,
        max(link.normalized_external_id) FILTER (
            WHERE link.source_system = 'outseta' AND link.identifier_type = 'account_uid' AND link.status = 'active'
        ) AS outseta_account_uid,
        max(link.normalized_external_id) FILTER (
            WHERE link.source_system = 'activecampaign' AND link.identifier_type = 'contact_id' AND link.status = 'active'
        ) AS activecampaign_contact_id,
        max(link.normalized_external_id) FILTER (
            WHERE link.source_system = 'stripe' AND link.identifier_type = 'customer_id' AND link.status = 'active'
        ) AS stripe_customer_id,
        max(link.normalized_external_id) FILTER (
            WHERE link.identifier_type = 'email' AND link.status = 'active'
        ) AS linked_email
    FROM public.member_identity_links AS link
    GROUP BY link.member_id
),
ranked_membership AS (
    SELECT
        membership.*,
        row_number() OVER (
            PARTITION BY membership.member_id
            ORDER BY membership.is_authoritative DESC, membership.authority_rank DESC, membership.snapshot_at DESC
        ) AS membership_order
    FROM public.member_memberships AS membership
    WHERE membership.is_current AND membership.is_authoritative
),
selected_membership AS (
    SELECT *
    FROM ranked_membership
    WHERE membership_order = 1
),
conflicts AS (
    SELECT member_id, count(*) AS conflict_count
    FROM public.member_authority_conflicts
    GROUP BY member_id
)
SELECT
    member.id AS member_id,
    identity.supabase_profile_id,
    identity.supabase_user_id,
    identity.outseta_person_uid,
    identity.outseta_account_uid,
    identity.activecampaign_contact_id,
    identity.stripe_customer_id,
    COALESCE(member.primary_email, identity.linked_email) AS email,
    CASE
        WHEN COALESCE(conflict.conflict_count, 0) > 0 THEN 'conflict'
        WHEN membership.id IS NOT NULL AND membership.is_authoritative THEN 'known'
        ELSE 'unknown'
    END AS membership_truth_state,
    membership.source_system AS membership_authority,
    membership.membership_tier,
    membership.membership_status,
    membership.plan_uid,
    membership.subscription_uid,
    membership.subscription_start_at,
    membership.renewal_at,
    membership.cancellation_at,
    membership.mrr,
    membership.arr,
    membership.lifetime_revenue,
    membership.revenue_state,
    profile.state,
    profile.counties,
    profile.service_radius_miles,
    profile.experience_level,
    profile.inspection_types,
    profile.profile_completion,
    profile.training_completion,
    profile.last_seen_at,
    profile.directory_views,
    profile.firm_views,
    profile.paywall_hits,
    profile.opportunity_clicks,
    profile.activecampaign_engagement,
    profile.signup_source,
    profile.utm_source,
    profile.utm_medium,
    profile.utm_campaign,
    member.identity_status,
    member.data_quality_status,
    member.data_quality_score,
    member.data_quality_details,
    member.profile_facts,
    COALESCE(conflict.conflict_count, 0) AS authority_conflict_count,
    GREATEST(member.updated_at, membership.updated_at, profile.updated_at) AS updated_at
FROM public.canonical_members AS member
LEFT JOIN identities AS identity ON identity.member_id = member.id
LEFT JOIN selected_membership AS membership ON membership.member_id = member.id
LEFT JOIN public.member_operational_profiles AS profile ON profile.member_id = member.id
LEFT JOIN conflicts AS conflict ON conflict.member_id = member.id
WHERE member.merged_into_member_id IS NULL;

COMMENT ON TABLE public.canonical_members IS
    'Stable canonical identity root. External identifiers live in member_identity_links so email changes do not create a new member.';
COMMENT ON TABLE public.member_identity_links IS
    'Normalized identity links for Supabase, Outseta, ActiveCampaign, Stripe, email, anonymous conversion actors, and future sources. Unique source identifiers expose collisions instead of silently merging people.';
COMMENT ON TABLE public.member_memberships IS
    'Versioned membership and revenue snapshots. Outseta-originated product state and its Supabase projection may be authoritative. ActiveCampaign is always a non-authoritative marketing mirror.';
COMMENT ON TABLE public.member_operational_profiles IS
    'Refreshable member behavior and profile projection derived from conversion_events and other approved sources. Raw events remain in conversion_events.';
COMMENT ON TABLE public.business_metrics_daily IS
    'Long-form daily normalized metrics with value state, completeness, confidence, provenance, and null-preserving unknowns.';
COMMENT ON TABLE public.intelligence_signals IS
    'Durable business observations or interpretations worth investigating. Signals are not raw conversion events and not orchestration audit events.';
COMMENT ON TABLE public.agent_events IS
    'Internal control-plane events for workflow audit and orchestration. They do not replace conversion_events or intelligence_signals.';
COMMENT ON TABLE public.experiments IS
    'Experiment registry. Conclusions are blocked until both minimum sample size and minimum duration are met.';
COMMENT ON TABLE public.agent_actions IS
    'Proposed mutations governed by a state machine and explicit owner approval. Phase B installs no external production mutation executors.';
COMMENT ON VIEW public.member_authority_conflicts IS
    'Current conflicting authoritative or mirrored membership states that require investigation rather than silent resolution.';
COMMENT ON VIEW public.member_360 IS
    'Read-only canonical member projection across normalized identity, authoritative membership, operational profile, and authority conflict state.';

DO $$
DECLARE
    table_name TEXT;
    policy_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'canonical_members',
        'member_identity_links',
        'member_memberships',
        'member_operational_profiles',
        'business_metrics_daily',
        'experiments',
        'intelligence_signals',
        'agent_tasks',
        'agent_runs',
        'agent_actions',
        'agent_events'
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

REVOKE ALL ON TABLE public.member_360 FROM anon, authenticated;
REVOKE ALL ON TABLE public.member_authority_conflicts FROM anon, authenticated;
GRANT SELECT ON TABLE public.member_360 TO service_role;
GRANT SELECT ON TABLE public.member_authority_conflicts TO service_role;

COMMIT;
