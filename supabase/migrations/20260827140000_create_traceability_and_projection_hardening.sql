-- Issue #318, Phase C8: end-to-end artifact traceability, bounded learning memory,
-- and projection-managed identity-link revocation.
-- Staging-first. Do not apply to Production without Autumn's explicit approval.

BEGIN;

ALTER TABLE public.agent_recommendations
    ADD COLUMN IF NOT EXISTS signal_ids UUID[] NOT NULL DEFAULT '{}'::uuid[];

CREATE TABLE IF NOT EXISTS public.agent_trace_links (
    id UUID PRIMARY KEY,
    relationship TEXT NOT NULL CHECK (relationship IN (
        'workflow_persisted_artifact',
        'observation_produced_signal',
        'signal_created_investigation',
        'signal_supported_recommendation',
        'evidence_supported_recommendation',
        'signal_proposed_action',
        'investigation_proposed_action',
        'experiment_proposed_action',
        'action_has_approval_state',
        'action_produced_outcome',
        'outcome_measured_by',
        'measurement_produced_learning'
    )),
    from_type TEXT NOT NULL CHECK (char_length(from_type) BETWEEN 1 AND 160),
    from_id TEXT NOT NULL CHECK (char_length(from_id) BETWEEN 1 AND 1024),
    to_type TEXT NOT NULL CHECK (char_length(to_type) BETWEEN 1 AND 160),
    to_id TEXT NOT NULL CHECK (char_length(to_id) BETWEEN 1 AND 1024),
    run_id UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_refs) = 'array'),
    idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 1 AND 2048),
    record_checksum TEXT NOT NULL CHECK (record_checksum ~ '^[a-f0-9]{64}$'),
    correlation_id UUID NOT NULL,
    causation_id UUID,
    trace_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (from_type <> to_type OR from_id <> to_id),
    CHECK ((evidence::TEXT || source_refs::TEXT) !~* '"(chain.?of.?thought|private.?reasoning|hidden.?reasoning|scratchpad)"[[:space:]]*:')
);

CREATE INDEX IF NOT EXISTS agent_trace_links_correlation_idx
    ON public.agent_trace_links (correlation_id, created_at);
CREATE INDEX IF NOT EXISTS agent_trace_links_run_idx
    ON public.agent_trace_links (run_id, relationship, created_at);
CREATE INDEX IF NOT EXISTS agent_trace_links_from_idx
    ON public.agent_trace_links (from_type, from_id, relationship);
CREATE INDEX IF NOT EXISTS agent_trace_links_to_idx
    ON public.agent_trace_links (to_type, to_id, relationship);

CREATE TABLE IF NOT EXISTS public.agent_outcomes (
    id UUID PRIMARY KEY,
    outcome_type TEXT NOT NULL CHECK (char_length(outcome_type) BETWEEN 1 AND 160),
    action_id UUID NOT NULL REFERENCES public.agent_actions(id) ON DELETE RESTRICT,
    run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE RESTRICT,
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
    signal_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
    state TEXT NOT NULL CHECK (state IN ('observed', 'verified', 'inconclusive')),
    summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 4000),
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_refs) = 'array'),
    observed_at TIMESTAMPTZ NOT NULL,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'failed', 'not_applicable')),
    idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 1 AND 512),
    record_checksum TEXT NOT NULL CHECK (record_checksum ~ '^[a-f0-9]{64}$'),
    correlation_id UUID NOT NULL,
    causation_id UUID NOT NULL,
    trace_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (causation_id = action_id),
    CHECK ((evidence::TEXT || source_refs::TEXT) !~* '"(chain.?of.?thought|private.?reasoning|hidden.?reasoning|scratchpad)"[[:space:]]*:')
);

CREATE TABLE IF NOT EXISTS public.agent_measurements (
    id UUID PRIMARY KEY,
    metric_name TEXT NOT NULL CHECK (char_length(metric_name) BETWEEN 1 AND 160),
    action_id UUID NOT NULL REFERENCES public.agent_actions(id) ON DELETE RESTRICT,
    run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE RESTRICT,
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
    outcome_id UUID REFERENCES public.agent_outcomes(id) ON DELETE RESTRICT,
    plan_measurement_id UUID REFERENCES public.agent_measurements(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('planned', 'collecting', 'complete', 'insufficient')),
    numeric_value NUMERIC(24,8),
    value_state TEXT NOT NULL CHECK (value_state IN ('known', 'partial', 'unknown', 'not_applicable')),
    unit TEXT NOT NULL CHECK (char_length(unit) BETWEEN 1 AND 80),
    minimum_sample_size INTEGER NOT NULL CHECK (minimum_sample_size >= 0),
    minimum_duration_days INTEGER NOT NULL CHECK (minimum_duration_days >= 0),
    observed_sample_size INTEGER NOT NULL CHECK (observed_sample_size >= 0),
    observed_duration_days INTEGER NOT NULL CHECK (observed_duration_days >= 0),
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_refs) = 'array'),
    measured_at TIMESTAMPTZ,
    idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 1 AND 512),
    record_checksum TEXT NOT NULL CHECK (record_checksum ~ '^[a-f0-9]{64}$'),
    correlation_id UUID NOT NULL,
    causation_id UUID NOT NULL,
    trace_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (outcome_id IS NOT NULL OR experiment_id IS NOT NULL),
    CHECK (plan_measurement_id IS NULL OR plan_measurement_id <> id),
    CHECK (value_state <> 'unknown' OR numeric_value IS NULL),
    CHECK (
        status <> 'complete'
        OR (
            outcome_id IS NOT NULL
            AND value_state <> 'unknown'
            AND observed_sample_size >= minimum_sample_size
            AND observed_duration_days >= minimum_duration_days
            AND measured_at IS NOT NULL
        )
    ),
    CHECK ((evidence::TEXT || source_refs::TEXT) !~* '"(chain.?of.?thought|private.?reasoning|hidden.?reasoning|scratchpad)"[[:space:]]*:')
);

CREATE TABLE IF NOT EXISTS public.agent_learnings (
    id UUID PRIMARY KEY,
    learning_type TEXT NOT NULL CHECK (char_length(learning_type) BETWEEN 1 AND 160),
    action_id UUID NOT NULL REFERENCES public.agent_actions(id) ON DELETE RESTRICT,
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
    outcome_id UUID NOT NULL REFERENCES public.agent_outcomes(id) ON DELETE RESTRICT,
    measurement_ids UUID[] NOT NULL CHECK (cardinality(measurement_ids) BETWEEN 1 AND 20),
    summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 4000),
    decision TEXT NOT NULL CHECK (char_length(decision) BETWEEN 1 AND 4000),
    confidence NUMERIC(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    review_status TEXT NOT NULL DEFAULT 'candidate' CHECK (review_status = 'candidate'),
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_refs) = 'array'),
    learned_at TIMESTAMPTZ NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 1 AND 512),
    record_checksum TEXT NOT NULL CHECK (record_checksum ~ '^[a-f0-9]{64}$'),
    correlation_id UUID NOT NULL,
    causation_id UUID NOT NULL,
    trace_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (causation_id = outcome_id),
    CHECK ((evidence::TEXT || source_refs::TEXT) !~* '"(chain.?of.?thought|private.?reasoning|hidden.?reasoning|scratchpad)"[[:space:]]*:')
);

CREATE INDEX IF NOT EXISTS agent_outcomes_correlation_idx
    ON public.agent_outcomes (correlation_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS agent_measurements_correlation_idx
    ON public.agent_measurements (correlation_id, created_at);
CREATE INDEX IF NOT EXISTS agent_learnings_correlation_idx
    ON public.agent_learnings (correlation_id, learned_at DESC);

CREATE OR REPLACE FUNCTION public.sync_member_identity_links(
    p_member_id UUID,
    p_identity_links JSONB,
    p_observed_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    item JSONB;
    existing_link public.member_identity_links%ROWTYPE;
    input_count INTEGER;
    revoked_count INTEGER;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for identity projection sync';
    END IF;
    IF jsonb_typeof(p_identity_links) <> 'array' OR p_observed_at IS NULL THEN
        RAISE EXCEPTION 'identity projection sync payload is invalid';
    END IF;
    input_count := jsonb_array_length(p_identity_links);
    IF input_count > 50 THEN
        RAISE EXCEPTION 'identity projection sync exceeds the 50-link bound';
    END IF;
    PERFORM 1 FROM public.canonical_members WHERE id = p_member_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'canonical member was not found'; END IF;

    UPDATE public.member_identity_links AS existing
    SET status = 'revoked',
        is_primary = false,
        last_seen_at = GREATEST(existing.last_seen_at, p_observed_at),
        provenance = existing.provenance || jsonb_build_object(
            'revokedAt', p_observed_at,
            'revocationReason', 'absent_from_current_projection'
        )
    WHERE existing.member_id = p_member_id
      AND existing.provenance->>'projection' = 'profiles-and-conversion-events'
      AND existing.status <> 'revoked'
      AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p_identity_links) AS candidate
          WHERE candidate->>'idempotency_key' = existing.idempotency_key
      );
    GET DIAGNOSTICS revoked_count = ROW_COUNT;

    FOR item IN SELECT value FROM jsonb_array_elements(p_identity_links)
    LOOP
        IF (item->>'member_id')::UUID IS DISTINCT FROM p_member_id
           OR item->>'status' NOT IN ('active', 'conflict')
           OR item->>'idempotency_key' IS NULL
           OR item#>>'{provenance,projection}' IS DISTINCT FROM 'profiles-and-conversion-events' THEN
            RAISE EXCEPTION 'identity projection link contract is invalid';
        END IF;

        SELECT * INTO existing_link
        FROM public.member_identity_links
        WHERE source_system = item->>'source_system'
          AND identifier_type = item->>'identifier_type'
          AND normalized_external_id = item->>'normalized_external_id'
        FOR UPDATE;
        IF FOUND AND existing_link.member_id IS DISTINCT FROM p_member_id THEN
            RAISE EXCEPTION 'identity identifier is already linked to a different canonical member';
        END IF;

        INSERT INTO public.member_identity_links (
            member_id, source_system, identifier_type, external_id,
            normalized_external_id, status, is_primary, confidence,
            verified_at, first_seen_at, last_seen_at, source_refs,
            provenance, idempotency_key
        ) VALUES (
            p_member_id, item->>'source_system', item->>'identifier_type',
            item->>'external_id', item->>'normalized_external_id', item->>'status',
            COALESCE((item->>'is_primary')::BOOLEAN, false),
            COALESCE((item->>'confidence')::NUMERIC, 0),
            NULLIF(item->>'verified_at', '')::TIMESTAMPTZ,
            p_observed_at, p_observed_at,
            COALESCE(item->'source_refs', '[]'::jsonb),
            COALESCE(item->'provenance', '{}'::jsonb), item->>'idempotency_key'
        ) ON CONFLICT (idempotency_key) DO UPDATE SET
            status = EXCLUDED.status,
            is_primary = EXCLUDED.is_primary,
            confidence = EXCLUDED.confidence,
            verified_at = EXCLUDED.verified_at,
            last_seen_at = GREATEST(public.member_identity_links.last_seen_at, EXCLUDED.last_seen_at),
            source_refs = EXCLUDED.source_refs,
            provenance = EXCLUDED.provenance
        WHERE public.member_identity_links.member_id = EXCLUDED.member_id
          AND public.member_identity_links.source_system = EXCLUDED.source_system
          AND public.member_identity_links.identifier_type = EXCLUDED.identifier_type
          AND public.member_identity_links.normalized_external_id = EXCLUDED.normalized_external_id;

        IF NOT EXISTS (
            SELECT 1 FROM public.member_identity_links
            WHERE idempotency_key = item->>'idempotency_key'
              AND member_id = p_member_id
              AND status = item->>'status'
              AND source_system = item->>'source_system'
              AND identifier_type = item->>'identifier_type'
              AND normalized_external_id = item->>'normalized_external_id'
        ) THEN
            RAISE EXCEPTION 'identity-link idempotency key was reused with different content';
        END IF;
    END LOOP;

    RETURN jsonb_build_object('activeCount', input_count, 'revokedCount', revoked_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.persist_agent_trace_links(
    p_run_id UUID,
    p_links JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    item JSONB;
    link_count INTEGER;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for trace-link persistence';
    END IF;
    IF jsonb_typeof(p_links) <> 'array' THEN
        RAISE EXCEPTION 'trace-link payload must be an array';
    END IF;
    link_count := jsonb_array_length(p_links);
    IF link_count > 500 THEN RAISE EXCEPTION 'trace-link batch exceeds the 500-link bound'; END IF;

    FOR item IN SELECT value FROM jsonb_array_elements(p_links)
    LOOP
        IF p_run_id IS NOT NULL AND NULLIF(item->>'run_id', '')::UUID IS DISTINCT FROM p_run_id THEN
            RAISE EXCEPTION 'trace link does not match the durable run';
        END IF;
        IF item->>'record_checksum' !~ '^[a-f0-9]{64}$'
           OR (COALESCE(item->'evidence', '[]'::jsonb)::TEXT || COALESCE(item->'source_refs', '[]'::jsonb)::TEXT)
                ~* '"(chain.?of.?thought|private.?reasoning|hidden.?reasoning|scratchpad)"[[:space:]]*:' THEN
            RAISE EXCEPTION 'trace link contains an invalid checksum or forbidden private reasoning field';
        END IF;

        INSERT INTO public.agent_trace_links (
            id, relationship, from_type, from_id, to_type, to_id,
            run_id, experiment_id, evidence, source_refs, idempotency_key,
            record_checksum, correlation_id, causation_id, trace_id
        ) VALUES (
            (item->>'id')::UUID, item->>'relationship', item->>'from_type', item->>'from_id',
            item->>'to_type', item->>'to_id', NULLIF(item->>'run_id', '')::UUID,
            NULLIF(item->>'experiment_id', '')::UUID, COALESCE(item->'evidence', '[]'::jsonb),
            COALESCE(item->'source_refs', '[]'::jsonb), item->>'idempotency_key',
            item->>'record_checksum', (item->>'correlation_id')::UUID,
            NULLIF(item->>'causation_id', '')::UUID, item->>'trace_id'
        ) ON CONFLICT (idempotency_key) DO NOTHING;

        IF NOT EXISTS (
            SELECT 1 FROM public.agent_trace_links
            WHERE idempotency_key = item->>'idempotency_key'
              AND id = (item->>'id')::UUID
              AND record_checksum = item->>'record_checksum'
        ) THEN
            RAISE EXCEPTION 'trace-link idempotency key was reused with different content';
        END IF;
    END LOOP;

    IF p_run_id IS NOT NULL THEN
        UPDATE public.agent_recommendations AS recommendation
        SET signal_ids = linked.signal_ids
        FROM (
            SELECT to_id::UUID AS recommendation_id,
                   array_agg(DISTINCT from_id::UUID ORDER BY from_id::UUID) AS signal_ids
            FROM public.agent_trace_links
            WHERE run_id = p_run_id
              AND relationship = 'signal_supported_recommendation'
              AND from_type = 'intelligence_signal'
              AND to_type = 'agent_recommendation'
            GROUP BY to_id
        ) AS linked
        WHERE recommendation.id = linked.recommendation_id
          AND recommendation.run_id = p_run_id
          AND recommendation.signal_ids IS DISTINCT FROM linked.signal_ids;
    END IF;

    RETURN jsonb_build_object('linkCount', link_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.persist_agent_learning_trace(
    p_outcomes JSONB,
    p_measurements JSONB,
    p_learnings JSONB,
    p_links JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    item JSONB;
    outcome_count INTEGER;
    measurement_count INTEGER;
    learning_count INTEGER;
    link_count INTEGER;
    measurement_id UUID;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for learning-trace persistence';
    END IF;
    IF jsonb_typeof(p_outcomes) <> 'array'
       OR jsonb_typeof(p_measurements) <> 'array'
       OR jsonb_typeof(p_learnings) <> 'array'
       OR jsonb_typeof(p_links) <> 'array' THEN
        RAISE EXCEPTION 'learning-trace persistence payload shape is invalid';
    END IF;
    outcome_count := jsonb_array_length(p_outcomes);
    measurement_count := jsonb_array_length(p_measurements);
    learning_count := jsonb_array_length(p_learnings);
    link_count := jsonb_array_length(p_links);
    IF outcome_count > 50 OR measurement_count > 100 OR learning_count > 50 OR link_count > 500 THEN
        RAISE EXCEPTION 'learning-trace batch exceeds a committed bound';
    END IF;

    FOR item IN SELECT value FROM jsonb_array_elements(p_outcomes)
    LOOP
        IF item->>'record_checksum' !~ '^[a-f0-9]{64}$'
           OR (COALESCE(item->'evidence', '[]'::jsonb)::TEXT || COALESCE(item->'source_refs', '[]'::jsonb)::TEXT)
                ~* '"(chain.?of.?thought|private.?reasoning|hidden.?reasoning|scratchpad)"[[:space:]]*:' THEN
            RAISE EXCEPTION 'outcome contains an invalid checksum or forbidden private reasoning field';
        END IF;
        INSERT INTO public.agent_outcomes (
            id, outcome_type, action_id, run_id, experiment_id, signal_ids,
            state, summary, evidence, source_refs, observed_at, verification_status,
            idempotency_key, record_checksum, correlation_id, causation_id, trace_id
        ) VALUES (
            (item->>'id')::UUID, item->>'outcome_type', (item->>'action_id')::UUID,
            (item->>'run_id')::UUID, NULLIF(item->>'experiment_id', '')::UUID,
            ARRAY(SELECT value::UUID FROM jsonb_array_elements_text(COALESCE(item->'signal_ids', '[]'::jsonb))),
            item->>'state', item->>'summary', COALESCE(item->'evidence', '[]'::jsonb),
            COALESCE(item->'source_refs', '[]'::jsonb), (item->>'observed_at')::TIMESTAMPTZ,
            item->>'verification_status', item->>'idempotency_key', item->>'record_checksum',
            (item->>'correlation_id')::UUID, (item->>'causation_id')::UUID, item->>'trace_id'
        ) ON CONFLICT (idempotency_key) DO NOTHING;
        IF NOT EXISTS (
            SELECT 1 FROM public.agent_outcomes
            WHERE idempotency_key = item->>'idempotency_key'
              AND id = (item->>'id')::UUID
              AND record_checksum = item->>'record_checksum'
        ) THEN RAISE EXCEPTION 'outcome idempotency key was reused with different content'; END IF;
    END LOOP;

    FOR item IN SELECT value FROM jsonb_array_elements(p_measurements)
    LOOP
        IF item->>'record_checksum' !~ '^[a-f0-9]{64}$'
           OR (COALESCE(item->'evidence', '[]'::jsonb)::TEXT || COALESCE(item->'source_refs', '[]'::jsonb)::TEXT)
                ~* '"(chain.?of.?thought|private.?reasoning|hidden.?reasoning|scratchpad)"[[:space:]]*:' THEN
            RAISE EXCEPTION 'measurement contains an invalid checksum or forbidden private reasoning field';
        END IF;
        IF NULLIF(item->>'plan_measurement_id', '') IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.agent_measurements
            WHERE id = (item->>'plan_measurement_id')::UUID
        ) AND NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(p_measurements) AS candidate
            WHERE candidate->>'id' = item->>'plan_measurement_id'
        ) THEN
            RAISE EXCEPTION 'measurement plan link was not found';
        END IF;
        INSERT INTO public.agent_measurements (
            id, metric_name, action_id, run_id, experiment_id, outcome_id,
            plan_measurement_id, status, numeric_value, value_state, unit,
            minimum_sample_size, minimum_duration_days, observed_sample_size,
            observed_duration_days, evidence, source_refs, measured_at,
            idempotency_key, record_checksum, correlation_id, causation_id, trace_id
        ) VALUES (
            (item->>'id')::UUID, item->>'metric_name', (item->>'action_id')::UUID,
            (item->>'run_id')::UUID, NULLIF(item->>'experiment_id', '')::UUID,
            NULLIF(item->>'outcome_id', '')::UUID, NULLIF(item->>'plan_measurement_id', '')::UUID,
            item->>'status', NULLIF(item->>'numeric_value', '')::NUMERIC, item->>'value_state',
            item->>'unit', (item->>'minimum_sample_size')::INTEGER,
            (item->>'minimum_duration_days')::INTEGER, (item->>'observed_sample_size')::INTEGER,
            (item->>'observed_duration_days')::INTEGER, COALESCE(item->'evidence', '[]'::jsonb),
            COALESCE(item->'source_refs', '[]'::jsonb), NULLIF(item->>'measured_at', '')::TIMESTAMPTZ,
            item->>'idempotency_key', item->>'record_checksum', (item->>'correlation_id')::UUID,
            (item->>'causation_id')::UUID, item->>'trace_id'
        ) ON CONFLICT (idempotency_key) DO NOTHING;
        IF NOT EXISTS (
            SELECT 1 FROM public.agent_measurements
            WHERE idempotency_key = item->>'idempotency_key'
              AND id = (item->>'id')::UUID
              AND record_checksum = item->>'record_checksum'
        ) THEN RAISE EXCEPTION 'measurement idempotency key was reused with different content'; END IF;
    END LOOP;

    FOR item IN SELECT value FROM jsonb_array_elements(p_learnings)
    LOOP
        IF item->>'record_checksum' !~ '^[a-f0-9]{64}$'
           OR (COALESCE(item->'evidence', '[]'::jsonb)::TEXT || COALESCE(item->'source_refs', '[]'::jsonb)::TEXT)
                ~* '"(chain.?of.?thought|private.?reasoning|hidden.?reasoning|scratchpad)"[[:space:]]*:' THEN
            RAISE EXCEPTION 'learning contains an invalid checksum or forbidden private reasoning field';
        END IF;
        FOR measurement_id IN
            SELECT value::UUID FROM jsonb_array_elements_text(COALESCE(item->'measurement_ids', '[]'::jsonb))
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM public.agent_measurements
                WHERE id = measurement_id
                  AND outcome_id = (item->>'outcome_id')::UUID
                  AND status = 'complete'
                  AND correlation_id = (item->>'correlation_id')::UUID
            ) THEN
                RAISE EXCEPTION 'learning requires completed measurements for the same outcome and correlation';
            END IF;
        END LOOP;
        INSERT INTO public.agent_learnings (
            id, learning_type, action_id, experiment_id, outcome_id, measurement_ids,
            summary, decision, confidence, review_status, evidence, source_refs,
            learned_at, idempotency_key, record_checksum, correlation_id, causation_id, trace_id
        ) VALUES (
            (item->>'id')::UUID, item->>'learning_type', (item->>'action_id')::UUID,
            NULLIF(item->>'experiment_id', '')::UUID, (item->>'outcome_id')::UUID,
            ARRAY(SELECT value::UUID FROM jsonb_array_elements_text(COALESCE(item->'measurement_ids', '[]'::jsonb))),
            item->>'summary', item->>'decision', (item->>'confidence')::NUMERIC,
            item->>'review_status', COALESCE(item->'evidence', '[]'::jsonb),
            COALESCE(item->'source_refs', '[]'::jsonb), (item->>'learned_at')::TIMESTAMPTZ,
            item->>'idempotency_key', item->>'record_checksum', (item->>'correlation_id')::UUID,
            (item->>'causation_id')::UUID, item->>'trace_id'
        ) ON CONFLICT (idempotency_key) DO NOTHING;
        IF NOT EXISTS (
            SELECT 1 FROM public.agent_learnings
            WHERE idempotency_key = item->>'idempotency_key'
              AND id = (item->>'id')::UUID
              AND record_checksum = item->>'record_checksum'
        ) THEN RAISE EXCEPTION 'learning idempotency key was reused with different content'; END IF;
    END LOOP;

    PERFORM public.persist_agent_trace_links(NULL, p_links);
    RETURN jsonb_build_object(
        'outcomeCount', outcome_count,
        'measurementCount', measurement_count,
        'learningCount', learning_count,
        'linkCount', link_count
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.trace_agent_action_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    state_id TEXT;
    trace_key TEXT;
    checksum TEXT;
BEGIN
    IF OLD.status IS NOT DISTINCT FROM NEW.status OR NEW.status NOT IN ('approved', 'rejected') THEN
        RETURN NEW;
    END IF;
    state_id := NEW.id::TEXT || ':' || NEW.status || ':v' || NEW.decision_version::TEXT;
    trace_key := 'trace-link:action_has_approval_state:agent_action:' || NEW.id::TEXT
        || ':agent_action_approval_state:' || state_id;
    checksum := encode(digest(
        NEW.id::TEXT || '|' || NEW.status || '|' || NEW.decision_version::TEXT || '|'
        || COALESCE(NEW.approved_by, NEW.rejected_by, ''),
        'sha256'
    ), 'hex');
    INSERT INTO public.agent_trace_links (
        id, relationship, from_type, from_id, to_type, to_id, run_id,
        experiment_id, evidence, source_refs, idempotency_key, record_checksum,
        correlation_id, causation_id, trace_id
    ) VALUES (
        gen_random_uuid(), 'action_has_approval_state', 'agent_action', NEW.id::TEXT,
        'agent_action_approval_state', state_id, NEW.run_id, NEW.experiment_id,
        '[]'::jsonb, NEW.source_refs, trace_key, checksum,
        NEW.correlation_id, NEW.id, NEW.trace_id
    ) ON CONFLICT (idempotency_key) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agent_actions_trace_decision ON public.agent_actions;
CREATE TRIGGER agent_actions_trace_decision
    AFTER UPDATE OF status ON public.agent_actions
    FOR EACH ROW EXECUTE FUNCTION public.trace_agent_action_decision();

CREATE OR REPLACE FUNCTION public.get_agent_correlation_trace(
    p_actor_subject TEXT,
    p_correlation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    PERFORM public.assert_agent_owner_subject(p_actor_subject);
    RETURN jsonb_build_object(
        'correlationId', p_correlation_id,
        'links', COALESCE((
            SELECT jsonb_agg(to_jsonb(link_row) ORDER BY link_row.created_at, link_row.id)
            FROM public.agent_trace_links AS link_row
            WHERE link_row.correlation_id = p_correlation_id
        ), '[]'::jsonb),
        'outcomes', COALESCE((
            SELECT jsonb_agg(to_jsonb(outcome_row) ORDER BY outcome_row.observed_at, outcome_row.id)
            FROM public.agent_outcomes AS outcome_row
            WHERE outcome_row.correlation_id = p_correlation_id
        ), '[]'::jsonb),
        'measurements', COALESCE((
            SELECT jsonb_agg(to_jsonb(measurement_row) ORDER BY measurement_row.created_at, measurement_row.id)
            FROM public.agent_measurements AS measurement_row
            WHERE measurement_row.correlation_id = p_correlation_id
        ), '[]'::jsonb),
        'learnings', COALESCE((
            SELECT jsonb_agg(to_jsonb(learning_row) ORDER BY learning_row.learned_at, learning_row.id)
            FROM public.agent_learnings AS learning_row
            WHERE learning_row.correlation_id = p_correlation_id
        ), '[]'::jsonb)
    );
END;
$$;

ALTER TABLE public.agent_trace_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_learnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can read agent trace links" ON public.agent_trace_links;
CREATE POLICY "Service role can read agent trace links" ON public.agent_trace_links
    FOR SELECT USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role can read agent outcomes" ON public.agent_outcomes;
CREATE POLICY "Service role can read agent outcomes" ON public.agent_outcomes
    FOR SELECT USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role can read agent measurements" ON public.agent_measurements;
CREATE POLICY "Service role can read agent measurements" ON public.agent_measurements
    FOR SELECT USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role can read agent learnings" ON public.agent_learnings;
CREATE POLICY "Service role can read agent learnings" ON public.agent_learnings
    FOR SELECT USING (auth.role() = 'service_role');

REVOKE ALL ON TABLE public.agent_trace_links FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.agent_outcomes FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.agent_measurements FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.agent_learnings FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.agent_trace_links TO service_role;
GRANT SELECT ON TABLE public.agent_outcomes TO service_role;
GRANT SELECT ON TABLE public.agent_measurements TO service_role;
GRANT SELECT ON TABLE public.agent_learnings TO service_role;

DROP POLICY IF EXISTS "Service role can manage member_identity_links" ON public.member_identity_links;
DROP POLICY IF EXISTS "Service role can read member identity links" ON public.member_identity_links;
CREATE POLICY "Service role can read member identity links" ON public.member_identity_links
    FOR SELECT USING (auth.role() = 'service_role');
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.member_identity_links FROM service_role;
GRANT SELECT ON TABLE public.member_identity_links TO service_role;

REVOKE ALL ON FUNCTION public.sync_member_identity_links(UUID, JSONB, TIMESTAMPTZ)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.persist_agent_trace_links(UUID, JSONB)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.persist_agent_learning_trace(JSONB, JSONB, JSONB, JSONB)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trace_agent_action_decision()
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_agent_correlation_trace(TEXT, UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_member_identity_links(UUID, JSONB, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.persist_agent_trace_links(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.persist_agent_learning_trace(JSONB, JSONB, JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_agent_correlation_trace(TEXT, UUID) TO service_role;

COMMENT ON TABLE public.agent_trace_links IS
    'Immutable, correlation-preserving links across source observations, signals, investigations, recommendations, proposed actions, approval states, outcomes, measurements, and candidate learnings.';
COMMENT ON TABLE public.agent_outcomes IS
    'Verified, observed, or inconclusive outcomes attributed to proposed actions; never an external executor.';
COMMENT ON TABLE public.agent_measurements IS
    'Bounded measurement plans and later observations with explicit sample-size and duration sufficiency.';
COMMENT ON TABLE public.agent_learnings IS
    'Candidate operating learnings backed by a verified outcome and completed measurements. No chain-of-thought or private reasoning is stored.';
COMMENT ON FUNCTION public.sync_member_identity_links(UUID, JSONB, TIMESTAMPTZ) IS
    'Synchronizes projection-managed identity links and auditably revokes stale links without silently transferring an identifier between members.';
COMMENT ON FUNCTION public.get_agent_correlation_trace(TEXT, UUID) IS
    'Owner-only read model for the complete Intelligence OS artifact thread. It exposes evidence and decisions, not private reasoning.';

COMMIT;
