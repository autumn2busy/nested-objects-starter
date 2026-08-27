-- Issue #318, Phase C5: durable operating-review artifacts.
-- Staging-first. Do not apply to Production without Autumn's explicit approval.

BEGIN;

CREATE TABLE IF NOT EXISTS public.agent_orchestrator_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name TEXT NOT NULL CHECK (char_length(workflow_name) BETWEEN 1 AND 160),
    state JSONB NOT NULL CHECK (jsonb_typeof(state) = 'object'),
    idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 1 AND 512),
    correlation_id UUID NOT NULL,
    causation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_recommendations (
    id UUID PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL CHECK (char_length(workflow_name) BETWEEN 1 AND 160),
    recommendation_type TEXT NOT NULL CHECK (char_length(recommendation_type) BETWEEN 1 AND 160),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 240),
    summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 4000),
    priority SMALLINT NOT NULL CHECK (priority BETWEEN 0 AND 100),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_refs) = 'array'),
    recommended_follow_up TEXT,
    fingerprint TEXT NOT NULL CHECK (char_length(fingerprint) BETWEEN 1 AND 512),
    idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 1 AND 512),
    correlation_id UUID NOT NULL,
    causation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_operating_reviews (
    id UUID PRIMARY KEY,
    run_id UUID NOT NULL UNIQUE REFERENCES public.agent_runs(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL
        CHECK (workflow_name IN ('conversion_review', 'daily_business_health', 'weekly_operating_review')),
    review_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'quiet')),
    executive_summary TEXT NOT NULL CHECK (char_length(executive_summary) BETWEEN 1 AND 4000),
    priorities JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(priorities) = 'array' AND jsonb_array_length(priorities) <= 3),
    autumn_decisions JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(autumn_decisions) = 'array' AND jsonb_array_length(autumn_decisions) <= 3),
    output JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(output) = 'object'),
    idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 1 AND 512),
    correlation_id UUID NOT NULL,
    causation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_recommendations_run_priority_idx
    ON public.agent_recommendations (run_id, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS agent_operating_reviews_date_idx
    ON public.agent_operating_reviews (workflow_name, review_date DESC);
CREATE INDEX IF NOT EXISTS agent_orchestrator_states_workflow_idx
    ON public.agent_orchestrator_states (workflow_name, created_at DESC);

DROP TRIGGER IF EXISTS agent_orchestrator_states_set_updated_at ON public.agent_orchestrator_states;
CREATE TRIGGER agent_orchestrator_states_set_updated_at
    BEFORE UPDATE ON public.agent_orchestrator_states
    FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at();

DROP TRIGGER IF EXISTS agent_recommendations_set_updated_at ON public.agent_recommendations;
CREATE TRIGGER agent_recommendations_set_updated_at
    BEFORE UPDATE ON public.agent_recommendations
    FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at();

DROP TRIGGER IF EXISTS agent_operating_reviews_set_updated_at ON public.agent_operating_reviews;
CREATE TRIGGER agent_operating_reviews_set_updated_at
    BEFORE UPDATE ON public.agent_operating_reviews
    FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at();

CREATE OR REPLACE FUNCTION public.persist_agent_orchestrator_state(
    p_idempotency_key TEXT,
    p_workflow_name TEXT,
    p_state JSONB,
    p_correlation_id UUID,
    p_causation_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    existing_state JSONB;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for orchestrator state persistence';
    END IF;
    IF jsonb_typeof(p_state) <> 'object' THEN
        RAISE EXCEPTION 'orchestrator state must be a JSON object';
    END IF;

    INSERT INTO public.agent_orchestrator_states (
        workflow_name, state, idempotency_key, correlation_id, causation_id
    ) VALUES (
        p_workflow_name, p_state, p_idempotency_key, p_correlation_id, p_causation_id
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

    IF FOUND THEN RETURN 'created'; END IF;

    SELECT state INTO existing_state
    FROM public.agent_orchestrator_states
    WHERE idempotency_key = p_idempotency_key
    FOR UPDATE;
    IF existing_state IS DISTINCT FROM p_state THEN
        RAISE EXCEPTION 'orchestrator state idempotency key was reused with different state';
    END IF;
    RETURN 'reused';
END;
$$;

CREATE OR REPLACE FUNCTION public.persist_agent_operating_workflow_batch(
    p_run_id UUID,
    p_workflow_name TEXT,
    p_review JSONB,
    p_signals JSONB,
    p_recommendations JSONB,
    p_tasks JSONB,
    p_experiments JSONB,
    p_actions JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    run_record public.agent_runs%ROWTYPE;
    review_record public.agent_operating_reviews%ROWTYPE;
    item JSONB;
    signal_count INTEGER;
    recommendation_count INTEGER;
    task_count INTEGER;
    experiment_count INTEGER;
    action_count INTEGER;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for operating workflow persistence';
    END IF;
    IF p_workflow_name NOT IN ('conversion_review', 'daily_business_health', 'weekly_operating_review') THEN
        RAISE EXCEPTION 'unsupported operating workflow name';
    END IF;
    IF jsonb_typeof(p_review) <> 'object'
       OR jsonb_typeof(p_signals) <> 'array'
       OR jsonb_typeof(p_recommendations) <> 'array'
       OR jsonb_typeof(p_tasks) <> 'array'
       OR jsonb_typeof(p_experiments) <> 'array'
       OR jsonb_typeof(p_actions) <> 'array' THEN
        RAISE EXCEPTION 'operating workflow persistence payload shape is invalid';
    END IF;

    signal_count := jsonb_array_length(p_signals);
    recommendation_count := jsonb_array_length(p_recommendations);
    task_count := jsonb_array_length(p_tasks);
    experiment_count := jsonb_array_length(p_experiments);
    action_count := jsonb_array_length(p_actions);
    IF signal_count > 50 OR recommendation_count > 20 OR task_count > 10
       OR experiment_count > 10 OR action_count > 10 THEN
        RAISE EXCEPTION 'operating workflow artifact batch exceeds a committed bound';
    END IF;
    IF jsonb_array_length(COALESCE(p_review->'priorities', '[]'::jsonb)) > 3
       OR jsonb_array_length(COALESCE(p_review->'autumn_decisions', '[]'::jsonb)) > 3 THEN
        RAISE EXCEPTION 'operating review exceeds the three-priority or decision bound';
    END IF;

    SELECT * INTO run_record FROM public.agent_runs WHERE id = p_run_id FOR UPDATE;
    IF NOT FOUND OR run_record.status <> 'running' OR run_record.workflow_name <> p_workflow_name THEN
        RAISE EXCEPTION 'operating artifacts require the matching running durable workflow';
    END IF;
    IF (p_review->>'run_id')::UUID IS DISTINCT FROM p_run_id
       OR p_review->>'workflow_name' IS DISTINCT FROM p_workflow_name THEN
        RAISE EXCEPTION 'operating review does not match the durable run';
    END IF;

    PERFORM public.persist_agent_workflow_signals(p_run_id, p_signals);

    FOR item IN SELECT value FROM jsonb_array_elements(p_recommendations)
    LOOP
        INSERT INTO public.agent_recommendations (
            id, run_id, workflow_name, recommendation_type, title, summary, priority,
            source_refs, recommended_follow_up, fingerprint, idempotency_key,
            correlation_id, causation_id
        ) VALUES (
            (item->>'id')::UUID, p_run_id, p_workflow_name,
            item->>'recommendation_type', item->>'title', item->>'summary',
            (item->>'priority')::SMALLINT, COALESCE(item->'source_refs', '[]'::jsonb),
            item->>'recommended_follow_up', item->>'fingerprint', item->>'idempotency_key',
            (item->>'correlation_id')::UUID, NULLIF(item->>'causation_id', '')::UUID
        ) ON CONFLICT (idempotency_key) DO NOTHING;
        IF NOT EXISTS (
            SELECT 1 FROM public.agent_recommendations
            WHERE idempotency_key = item->>'idempotency_key'
              AND id = (item->>'id')::UUID
              AND run_id = p_run_id
              AND summary = item->>'summary'
              AND source_refs = COALESCE(item->'source_refs', '[]'::jsonb)
        ) THEN
            RAISE EXCEPTION 'recommendation idempotency key was reused with different output';
        END IF;
    END LOOP;

    FOR item IN SELECT value FROM jsonb_array_elements(p_tasks)
    LOOP
        INSERT INTO public.agent_tasks (
            id, task_type, assigned_agent, status, priority, input, concise_rationale,
            signal_id, idempotency_key, attempts, max_attempts, correlation_id,
            causation_id, trace_id
        ) VALUES (
            (item->>'id')::UUID, item->>'task_type', item->>'assigned_agent', 'pending',
            (item->>'priority')::SMALLINT, COALESCE(item->'input', '{}'::jsonb),
            item->>'concise_rationale', NULLIF(item->>'signal_id', '')::UUID,
            item->>'idempotency_key', 0, (item->>'max_attempts')::INTEGER,
            (item->>'correlation_id')::UUID, NULLIF(item->>'causation_id', '')::UUID,
            item->>'trace_id'
        ) ON CONFLICT (idempotency_key) DO NOTHING;
        IF NOT EXISTS (
            SELECT 1 FROM public.agent_tasks
            WHERE idempotency_key = item->>'idempotency_key'
              AND id = (item->>'id')::UUID
              AND signal_id IS NOT DISTINCT FROM NULLIF(item->>'signal_id', '')::UUID
              AND input = COALESCE(item->'input', '{}'::jsonb)
        ) THEN
            RAISE EXCEPTION 'task idempotency key was reused with different output';
        END IF;
    END LOOP;

    FOR item IN SELECT value FROM jsonb_array_elements(p_experiments)
    LOOP
        INSERT INTO public.experiments (
            id, name, hypothesis, status, audience, primary_metric,
            minimum_sample_size, minimum_duration_days, guardrails,
            idempotency_key, correlation_id, causation_id
        ) VALUES (
            (item->>'id')::UUID, item->>'name', item->>'hypothesis', 'draft',
            COALESCE(item->'audience', '{}'::jsonb), item->>'primary_metric',
            (item->>'minimum_sample_size')::INTEGER, (item->>'minimum_duration_days')::INTEGER,
            COALESCE(item->'guardrails', '{}'::jsonb), item->>'idempotency_key',
            (item->>'correlation_id')::UUID, NULLIF(item->>'causation_id', '')::UUID
        ) ON CONFLICT (idempotency_key) DO NOTHING;
        IF NOT EXISTS (
            SELECT 1 FROM public.experiments
            WHERE idempotency_key = item->>'idempotency_key'
              AND id = (item->>'id')::UUID
              AND name = item->>'name'
              AND hypothesis = item->>'hypothesis'
              AND audience = COALESCE(item->'audience', '{}'::jsonb)
        ) THEN
            RAISE EXCEPTION 'experiment idempotency key was reused with different output';
        END IF;
    END LOOP;

    FOR item IN SELECT value FROM jsonb_array_elements(p_actions)
    LOOP
        IF item->>'status' <> 'proposed'
           OR COALESCE((item#>>'{payload,mutationAllowed}')::BOOLEAN, false)
           OR NULLIF(item->>'executor_key', '') IS NOT NULL
           OR NULLIF(item->>'execution_started_at', '') IS NOT NULL
           OR NULLIF(item->>'executed_at', '') IS NOT NULL THEN
            RAISE EXCEPTION 'operating workflow actions must remain non-mutating proposals';
        END IF;
        INSERT INTO public.agent_actions (
            id, action_type, target_system, requested_by_agent, task_id, run_id,
            experiment_id, signal_ids, payload, evidence, source_refs, concise_rationale,
            risk_level, approval_required, status, execution_guard_version,
            verification_status, idempotency_key, correlation_id, causation_id, trace_id
        ) VALUES (
            (item->>'id')::UUID, item->>'action_type', item->>'target_system',
            item->>'requested_by_agent', NULLIF(item->>'task_id', '')::UUID, p_run_id,
            NULLIF(item->>'experiment_id', '')::UUID,
            ARRAY(
                SELECT signal_id::UUID
                FROM jsonb_array_elements_text(COALESCE(item->'signal_ids', '[]'::jsonb)) AS signal_id
            ),
            COALESCE(item->'payload', '{}'::jsonb), COALESCE(item->'evidence', '[]'::jsonb),
            COALESCE(item->'source_refs', '[]'::jsonb), item->>'concise_rationale',
            item->>'risk_level', (item->>'approval_required')::BOOLEAN, 'proposed',
            item->>'execution_guard_version', 'not_started', item->>'idempotency_key',
            (item->>'correlation_id')::UUID, NULLIF(item->>'causation_id', '')::UUID,
            item->>'trace_id'
        ) ON CONFLICT (idempotency_key) DO NOTHING;
        IF NOT EXISTS (
            SELECT 1 FROM public.agent_actions
            WHERE idempotency_key = item->>'idempotency_key'
              AND id = (item->>'id')::UUID
              AND run_id = p_run_id
              AND payload = COALESCE(item->'payload', '{}'::jsonb)
              AND status = 'proposed'
              AND executor_key IS NULL
              AND execution_started_at IS NULL
              AND executed_at IS NULL
        ) THEN
            RAISE EXCEPTION 'action idempotency key was reused with different output';
        END IF;
    END LOOP;

    INSERT INTO public.agent_operating_reviews (
        id, run_id, workflow_name, review_date, status, executive_summary,
        priorities, autumn_decisions, output, idempotency_key,
        correlation_id, causation_id
    ) VALUES (
        (p_review->>'id')::UUID, p_run_id, p_workflow_name,
        (p_review->>'review_date')::DATE, p_review->>'status',
        p_review->>'executive_summary', COALESCE(p_review->'priorities', '[]'::jsonb),
        COALESCE(p_review->'autumn_decisions', '[]'::jsonb),
        COALESCE(p_review->'output', '{}'::jsonb), p_review->>'idempotency_key',
        (p_review->>'correlation_id')::UUID, NULLIF(p_review->>'causation_id', '')::UUID
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    SELECT * INTO review_record FROM public.agent_operating_reviews
    WHERE idempotency_key = p_review->>'idempotency_key' FOR UPDATE;
    IF review_record.id IS DISTINCT FROM (p_review->>'id')::UUID
       OR review_record.run_id IS DISTINCT FROM p_run_id
       OR review_record.workflow_name IS DISTINCT FROM p_workflow_name
       OR review_record.review_date IS DISTINCT FROM (p_review->>'review_date')::DATE
       OR review_record.status IS DISTINCT FROM (p_review->>'status')
       OR review_record.executive_summary IS DISTINCT FROM (p_review->>'executive_summary')
       OR review_record.output IS DISTINCT FROM COALESCE(p_review->'output', '{}'::jsonb)
       OR review_record.priorities IS DISTINCT FROM COALESCE(p_review->'priorities', '[]'::jsonb)
       OR review_record.autumn_decisions IS DISTINCT FROM COALESCE(p_review->'autumn_decisions', '[]'::jsonb)
       OR review_record.correlation_id IS DISTINCT FROM (p_review->>'correlation_id')::UUID
       OR review_record.causation_id IS DISTINCT FROM NULLIF(p_review->>'causation_id', '')::UUID THEN
        RAISE EXCEPTION 'operating review idempotency key was reused with different output';
    END IF;

    INSERT INTO public.agent_events (
        event_type, producer, subject_type, subject_id, payload,
        correlation_id, causation_id, trace_id, idempotency_key
    ) VALUES (
        'agent.operating_review.persisted', p_workflow_name, 'agent_operating_review', review_record.id::TEXT,
        jsonb_build_object(
            'signalCount', signal_count,
            'recommendationCount', recommendation_count,
            'taskCount', task_count,
            'experimentCount', experiment_count,
            'actionCount', action_count,
            'quiet', review_record.status = 'quiet'
        ), run_record.correlation_id, run_record.causation_id, run_record.trace_id,
        'operating-review:' || review_record.id::TEXT || ':persisted'
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN jsonb_build_object(
        'signalCount', signal_count,
        'recommendationCount', recommendation_count,
        'taskCount', task_count,
        'experimentCount', experiment_count,
        'actionCount', action_count,
        'reviewCount', 1
    );
END;
$$;

ALTER TABLE public.agent_orchestrator_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_operating_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can read agent orchestrator states" ON public.agent_orchestrator_states;
CREATE POLICY "Service role can read agent orchestrator states" ON public.agent_orchestrator_states
    FOR SELECT USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role can read agent recommendations" ON public.agent_recommendations;
CREATE POLICY "Service role can read agent recommendations" ON public.agent_recommendations
    FOR SELECT USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role can read agent operating reviews" ON public.agent_operating_reviews;
CREATE POLICY "Service role can read agent operating reviews" ON public.agent_operating_reviews
    FOR SELECT USING (auth.role() = 'service_role');

REVOKE ALL ON TABLE public.agent_orchestrator_states FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.agent_recommendations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.agent_operating_reviews FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.agent_orchestrator_states TO service_role;
GRANT SELECT ON TABLE public.agent_recommendations TO service_role;
GRANT SELECT ON TABLE public.agent_operating_reviews TO service_role;

REVOKE ALL ON FUNCTION public.persist_agent_orchestrator_state(TEXT, TEXT, JSONB, UUID, UUID)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.persist_agent_operating_workflow_batch(UUID, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.persist_agent_orchestrator_state(TEXT, TEXT, JSONB, UUID, UUID)
    TO service_role;
GRANT EXECUTE ON FUNCTION public.persist_agent_operating_workflow_batch(UUID, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB)
    TO service_role;

COMMIT;
