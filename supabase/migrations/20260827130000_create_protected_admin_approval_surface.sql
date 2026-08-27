-- Issue #318, Phase C7: protected owner admin, replay-safe triggers, and immutable decisions.
-- Staging-first. Do not apply to Production without Autumn's explicit approval.

BEGIN;

CREATE TABLE IF NOT EXISTS public.agent_approvers (
    subject_id TEXT PRIMARY KEY CHECK (char_length(subject_id) BETWEEN 1 AND 255),
    approver_kind TEXT NOT NULL CHECK (approver_kind IN ('owner', 'delegated')),
    display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 160),
    active BOOLEAN NOT NULL DEFAULT false,
    scopes JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(scopes) = 'array'),
    reviewed_by TEXT NOT NULL CHECK (btrim(reviewed_by) <> ''),
    reviewed_at TIMESTAMPTZ NOT NULL,
    review_evidence JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(review_evidence) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_approvers_single_active_owner_idx
    ON public.agent_approvers (approver_kind)
    WHERE approver_kind = 'owner' AND active;

CREATE TABLE IF NOT EXISTS public.agent_admin_request_nonces (
    nonce_digest TEXT PRIMARY KEY CHECK (nonce_digest ~ '^[a-f0-9]{64}$'),
    request_type TEXT NOT NULL CHECK (char_length(request_type) BETWEEN 1 AND 160),
    actor_subject TEXT NOT NULL REFERENCES public.agent_approvers(subject_id),
    expires_at TIMESTAMPTZ NOT NULL,
    correlation_id UUID NOT NULL,
    causation_id UUID,
    consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (expires_at >= consumed_at)
);

CREATE INDEX IF NOT EXISTS agent_admin_request_nonces_expiry_idx
    ON public.agent_admin_request_nonces (expires_at);

ALTER TABLE public.agent_actions
    ADD COLUMN IF NOT EXISTS decision_version INTEGER NOT NULL DEFAULT 0
        CHECK (decision_version >= 0),
    ADD COLUMN IF NOT EXISTS approved_payload JSONB,
    ADD COLUMN IF NOT EXISTS approved_payload_digest TEXT,
    ADD COLUMN IF NOT EXISTS decision_idempotency_key TEXT;

ALTER TABLE public.agent_actions
    ADD CONSTRAINT agent_actions_approved_payload_shape_check
        CHECK (approved_payload IS NULL OR jsonb_typeof(approved_payload) = 'object'),
    ADD CONSTRAINT agent_actions_approved_payload_immutable_check
        CHECK (approved_payload IS NULL OR payload = approved_payload),
    ADD CONSTRAINT agent_actions_approved_payload_digest_check
        CHECK (approved_payload_digest IS NULL OR approved_payload_digest ~ '^[a-f0-9]{64}$');

CREATE UNIQUE INDEX IF NOT EXISTS agent_actions_decision_idempotency_uidx
    ON public.agent_actions (decision_idempotency_key)
    WHERE decision_idempotency_key IS NOT NULL;

DROP TRIGGER IF EXISTS agent_approvers_set_updated_at ON public.agent_approvers;
CREATE TRIGGER agent_approvers_set_updated_at
    BEFORE UPDATE ON public.agent_approvers
    FOR EACH ROW EXECUTE FUNCTION public.intelligence_os_set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_agent_action_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    transition_allowed BOOLEAN := false;
BEGIN
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

    IF NEW.status = 'approved'
       AND (
           NEW.approved_payload IS NULL
           OR NEW.approved_payload_digest IS NULL
           OR NEW.payload IS DISTINCT FROM NEW.approved_payload
       ) THEN
        RAISE EXCEPTION 'approved actions require an immutable payload snapshot and digest';
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
           OR OLD.approved_payload IS DISTINCT FROM NEW.approved_payload
           OR OLD.approved_payload_digest IS DISTINCT FROM NEW.approved_payload_digest
           OR OLD.decision_version IS DISTINCT FROM NEW.decision_version
           OR OLD.decision_idempotency_key IS DISTINCT FROM NEW.decision_idempotency_key
       ) THEN
        RAISE EXCEPTION 'approval record and approved payload are immutable after approval';
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        transition_allowed := CASE OLD.status
            WHEN 'proposed' THEN NEW.status IN ('awaiting_approval', 'cancelled')
                OR (NEW.status = 'approved' AND NOT NEW.approval_required)
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

CREATE OR REPLACE FUNCTION public.assert_agent_owner_subject(p_actor_subject TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service-role authority is required for protected admin';
    END IF;
    IF p_actor_subject IS NULL OR btrim(p_actor_subject) = '' OR NOT EXISTS (
        SELECT 1 FROM public.agent_approvers
        WHERE subject_id = p_actor_subject
          AND approver_kind = 'owner'
          AND active
          AND scopes @> '["intelligence_os"]'::jsonb
    ) THEN
        RAISE EXCEPTION 'authenticated subject is not the active owner subject';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_agent_admin_nonce(
    p_nonce_digest TEXT,
    p_request_type TEXT,
    p_actor_subject TEXT,
    p_expires_at TIMESTAMPTZ,
    p_correlation_id UUID,
    p_causation_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    PERFORM public.assert_agent_owner_subject(p_actor_subject);
    IF p_nonce_digest !~ '^[a-f0-9]{64}$'
       OR p_request_type IS NULL
       OR char_length(btrim(p_request_type)) NOT BETWEEN 1 AND 160
       OR p_expires_at <= now()
       OR p_expires_at > now() + interval '10 minutes' THEN
        RAISE EXCEPTION 'admin request nonce contract is invalid or expired';
    END IF;
    INSERT INTO public.agent_admin_request_nonces (
        nonce_digest, request_type, actor_subject, expires_at,
        correlation_id, causation_id
    ) VALUES (
        p_nonce_digest, p_request_type, p_actor_subject, p_expires_at,
        p_correlation_id, p_causation_id
    ) ON CONFLICT (nonce_digest) DO NOTHING;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin request nonce was already consumed';
    END IF;
    INSERT INTO public.agent_events (
        event_type, producer, subject_type, subject_id, payload,
        correlation_id, causation_id, idempotency_key
    ) VALUES (
        'agent.admin_request.authorized', 'protected-admin', 'admin_request', p_nonce_digest,
        jsonb_build_object(
            'requestType', p_request_type,
            'actorSubject', p_actor_subject,
            'expiresAt', p_expires_at
        ), p_correlation_id, p_causation_id,
        'admin-request:' || p_nonce_digest
    ) ON CONFLICT (idempotency_key) DO NOTHING;
    RETURN 'consumed';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_agent_action_for_decision(
    p_actor_subject TEXT,
    p_action_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    action_record public.agent_actions%ROWTYPE;
BEGIN
    PERFORM public.assert_agent_owner_subject(p_actor_subject);
    SELECT * INTO action_record FROM public.agent_actions WHERE id = p_action_id;
    IF NOT FOUND THEN RETURN NULL; END IF;
    RETURN jsonb_build_object(
        'id', action_record.id,
        'payload', action_record.payload,
        'decisionVersion', action_record.decision_version
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_agent_action(
    p_action_id UUID,
    p_decision TEXT,
    p_expected_version INTEGER,
    p_expected_payload JSONB,
    p_expected_payload_digest TEXT,
    p_reason TEXT,
    p_actor_subject TEXT,
    p_nonce_digest TEXT,
    p_nonce_expires_at TIMESTAMPTZ,
    p_decided_at TIMESTAMPTZ,
    p_request_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    action_record public.agent_actions%ROWTYPE;
BEGIN
    PERFORM public.assert_agent_owner_subject(p_actor_subject);
    IF p_decision NOT IN ('approved', 'rejected')
       OR p_expected_version < 0
       OR jsonb_typeof(p_expected_payload) <> 'object'
       OR p_expected_payload_digest !~ '^[a-f0-9]{64}$'
       OR char_length(btrim(COALESCE(p_reason, ''))) NOT BETWEEN 3 AND 1000
       OR p_decided_at < now() - interval '5 minutes'
       OR p_decided_at > now() + interval '1 minute'
       OR char_length(btrim(COALESCE(p_request_idempotency_key, ''))) NOT BETWEEN 1 AND 512 THEN
        RAISE EXCEPTION 'agent action decision contract is invalid';
    END IF;

    SELECT * INTO action_record
    FROM public.agent_actions
    WHERE id = p_action_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'agent action was not found'; END IF;
    IF action_record.status NOT IN ('proposed', 'awaiting_approval') THEN
        RAISE EXCEPTION 'agent action is no longer awaiting a decision';
    END IF;
    IF action_record.decision_version IS DISTINCT FROM p_expected_version
       OR action_record.payload IS DISTINCT FROM p_expected_payload THEN
        RAISE EXCEPTION 'agent action payload or decision version changed after review';
    END IF;
    IF action_record.executor_key IS NOT NULL
       OR action_record.execution_started_at IS NOT NULL
       OR action_record.executed_at IS NOT NULL THEN
        RAISE EXCEPTION 'agent action unexpectedly has execution state';
    END IF;

    PERFORM public.consume_agent_admin_nonce(
        p_nonce_digest,
        'action.' || p_decision,
        p_actor_subject,
        p_nonce_expires_at,
        action_record.correlation_id,
        action_record.causation_id
    );

    IF action_record.status = 'proposed' THEN
        UPDATE public.agent_actions SET status = 'awaiting_approval' WHERE id = p_action_id;
        INSERT INTO public.agent_events (
            event_type, producer, subject_type, subject_id, payload,
            correlation_id, causation_id, idempotency_key
        ) VALUES (
            'agent.action.awaiting_approval', 'protected-admin', 'agent_action', p_action_id::TEXT,
            jsonb_build_object('actorSubject', p_actor_subject, 'decisionVersion', p_expected_version),
            action_record.correlation_id, action_record.causation_id,
            p_request_idempotency_key || ':awaiting'
        ) ON CONFLICT (idempotency_key) DO NOTHING;
    END IF;

    IF p_decision = 'approved' THEN
        UPDATE public.agent_actions
        SET status = 'approved',
            approved_by = p_actor_subject,
            approved_at = p_decided_at,
            approval_authority = 'owner',
            approval_context = jsonb_build_object(
                'reason', btrim(p_reason),
                'payloadDigest', p_expected_payload_digest,
                'decisionVersion', p_expected_version + 1,
                'requestIdempotencyKey', p_request_idempotency_key,
                'executionAttached', false
            ),
            approved_payload = p_expected_payload,
            approved_payload_digest = p_expected_payload_digest,
            decision_version = p_expected_version + 1,
            decision_idempotency_key = p_request_idempotency_key,
            executor_key = NULL,
            execution_started_at = NULL,
            executed_at = NULL
        WHERE id = p_action_id;
    ELSE
        UPDATE public.agent_actions
        SET status = 'rejected',
            rejected_by = p_actor_subject,
            rejected_at = p_decided_at,
            rejection_reason = btrim(p_reason),
            decision_version = p_expected_version + 1,
            decision_idempotency_key = p_request_idempotency_key,
            executor_key = NULL,
            execution_started_at = NULL,
            executed_at = NULL
        WHERE id = p_action_id;
    END IF;

    SELECT * INTO action_record FROM public.agent_actions WHERE id = p_action_id;
    INSERT INTO public.agent_events (
        event_type, producer, subject_type, subject_id, payload,
        correlation_id, causation_id, idempotency_key
    ) VALUES (
        'agent.action.' || p_decision, 'protected-admin', 'agent_action', p_action_id::TEXT,
        jsonb_build_object(
            'actorSubject', p_actor_subject,
            'reason', btrim(p_reason),
            'payloadDigest', p_expected_payload_digest,
            'decisionVersion', action_record.decision_version,
            'executionStarted', false
        ), action_record.correlation_id, action_record.causation_id,
        p_request_idempotency_key || ':decision'
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN jsonb_build_object(
        'disposition', 'decided',
        'actionId', action_record.id,
        'status', action_record.status,
        'decisionVersion', action_record.decision_version,
        'approvedPayloadDigest', action_record.approved_payload_digest,
        'correlationId', action_record.correlation_id,
        'causationId', action_record.causation_id,
        'executionStarted', false
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_agent_admin_snapshot(
    p_actor_subject TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    bounded_limit INTEGER;
    latest_priorities JSONB := '[]'::jsonb;
BEGIN
    PERFORM public.assert_agent_owner_subject(p_actor_subject);
    bounded_limit := LEAST(100, GREATEST(1, COALESCE(p_limit, 50)));
    SELECT priorities INTO latest_priorities
    FROM public.agent_operating_reviews
    ORDER BY review_date DESC, created_at DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'generatedAt', now(),
        'runs', COALESCE((SELECT jsonb_agg(item) FROM (
            SELECT jsonb_build_object(
                'id', id, 'workflowName', workflow_name, 'workflowRunId', workflow_run_id,
                'status', status, 'verificationStatus', verification_status,
                'conciseRationale', concise_rationale, 'correlationId', correlation_id,
                'causationId', causation_id, 'createdAt', created_at, 'completedAt', completed_at
            ) AS item FROM public.agent_runs ORDER BY created_at DESC LIMIT bounded_limit
        ) AS rows), '[]'::jsonb),
        'unresolvedSignals', COALESCE((SELECT jsonb_agg(item) FROM (
            SELECT jsonb_build_object(
                'id', id, 'signalType', signal_type, 'domain', domain, 'title', title,
                'summary', summary, 'severity', severity, 'priority', priority, 'status', status,
                'evidence', evidence, 'sourceRefs', source_refs, 'correlationId', correlation_id,
                'causationId', causation_id, 'lastDetectedAt', last_detected_at
            ) AS item FROM public.intelligence_signals
            WHERE status IN ('new', 'investigating')
            ORDER BY priority DESC, last_detected_at DESC LIMIT bounded_limit
        ) AS rows), '[]'::jsonb),
        'awaitingActions', COALESCE((SELECT jsonb_agg(item) FROM (
            SELECT jsonb_build_object(
                'id', id, 'actionType', action_type, 'targetSystem', target_system,
                'status', status, 'riskLevel', risk_level, 'conciseRationale', concise_rationale,
                'payload', payload, 'payloadDigest', '', 'decisionVersion', decision_version,
                'evidence', evidence, 'sourceRefs', source_refs,
                'signalIds', signal_ids, 'runId', run_id, 'approvalRequired', approval_required,
                'approvedBy', approved_by, 'approvedAt', approved_at,
                'rejectedBy', rejected_by, 'rejectedAt', rejected_at, 'rejectionReason', rejection_reason,
                'executorKey', executor_key, 'executionStartedAt', execution_started_at,
                'executedAt', executed_at, 'correlationId', correlation_id,
                'causationId', causation_id, 'createdAt', created_at
            ) AS item FROM public.agent_actions
            WHERE status IN ('proposed', 'awaiting_approval')
            ORDER BY CASE risk_level WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END DESC,
                     created_at ASC LIMIT bounded_limit
        ) AS rows), '[]'::jsonb),
        'sourceWarnings', COALESCE((SELECT jsonb_agg(item) FROM (
            SELECT jsonb_build_object(
                'sensorName', sensor_name, 'provenanceMode', provenance_mode,
                'healthStatus', health_status, 'sourceHealth', source_health,
                'sourceGeneratedAt', source_generated_at, 'lastObservedAt', last_observed_at,
                'correlationId', correlation_id
            ) AS item FROM public.agent_sensor_runs
            WHERE health_status <> 'healthy'
            ORDER BY last_observed_at DESC LIMIT bounded_limit
        ) AS rows), '[]'::jsonb),
        'topPriorities', COALESCE(latest_priorities, '[]'::jsonb),
        'experiments', COALESCE((SELECT jsonb_agg(item) FROM (
            SELECT jsonb_build_object(
                'id', id, 'name', name, 'status', status, 'primaryMetric', primary_metric,
                'minimumSampleSize', minimum_sample_size, 'minimumDurationDays', minimum_duration_days,
                'observedSampleSize', observed_sample_size, 'observedDurationDays', observed_duration_days,
                'analysisState', analysis_state,
                'sampleReady', observed_sample_size >= minimum_sample_size,
                'durationReady', observed_duration_days >= minimum_duration_days,
                'correlationId', correlation_id
            ) AS item FROM public.experiments ORDER BY updated_at DESC LIMIT bounded_limit
        ) AS rows), '[]'::jsonb),
        'reviews', COALESCE((SELECT jsonb_agg(item) FROM (
            SELECT jsonb_build_object(
                'id', id, 'runId', run_id, 'workflowName', workflow_name,
                'reviewDate', review_date, 'status', status, 'executiveSummary', executive_summary,
                'priorities', priorities, 'autumnDecisions', autumn_decisions,
                'correlationId', correlation_id, 'causationId', causation_id
            ) AS item FROM public.agent_operating_reviews
            ORDER BY review_date DESC, created_at DESC LIMIT LEAST(20, bounded_limit)
        ) AS rows), '[]'::jsonb),
        'delegationEnabled', false,
        'executionEnabled', false
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_agent_admin_run(
    p_actor_subject TEXT,
    p_run_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSONB;
BEGIN
    PERFORM public.assert_agent_owner_subject(p_actor_subject);
    IF NOT EXISTS (SELECT 1 FROM public.agent_runs WHERE id = p_run_id) THEN RETURN NULL; END IF;
    SELECT jsonb_build_object(
        'run', to_jsonb(run_row) - 'input' - 'tool_calls',
        'steps', COALESCE((SELECT jsonb_agg(to_jsonb(step_row) - 'input' ORDER BY step_row.created_at)
            FROM public.agent_workflow_steps AS step_row WHERE step_row.run_id = p_run_id), '[]'::jsonb),
        'events', COALESCE((SELECT jsonb_agg(to_jsonb(event_row) ORDER BY event_row.created_at)
            FROM public.agent_events AS event_row
            WHERE event_row.correlation_id = run_row.correlation_id), '[]'::jsonb),
        'review', (SELECT to_jsonb(review_row) FROM public.agent_operating_reviews AS review_row WHERE review_row.run_id = p_run_id),
        'recommendations', COALESCE((SELECT jsonb_agg(to_jsonb(recommendation_row) ORDER BY recommendation_row.priority DESC)
            FROM public.agent_recommendations AS recommendation_row WHERE recommendation_row.run_id = p_run_id), '[]'::jsonb)
    ) INTO result
    FROM public.agent_runs AS run_row
    WHERE run_row.id = p_run_id;
    RETURN result;
END;
$$;

ALTER TABLE public.agent_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_admin_request_nonces ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.agent_approvers FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.agent_admin_request_nonces FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.agent_approvers TO service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.agent_actions FROM service_role;
GRANT SELECT ON TABLE public.agent_actions TO service_role;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.agent_events FROM service_role;
GRANT SELECT ON TABLE public.agent_events TO service_role;

REVOKE ALL ON FUNCTION public.assert_agent_owner_subject(TEXT)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_agent_admin_nonce(TEXT, TEXT, TEXT, TIMESTAMPTZ, UUID, UUID)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_agent_action_for_decision(TEXT, UUID)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decide_agent_action(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_agent_admin_snapshot(TEXT, INTEGER)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_agent_admin_run(TEXT, UUID)
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.assert_agent_owner_subject(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_agent_admin_nonce(TEXT, TEXT, TEXT, TIMESTAMPTZ, UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_agent_action_for_decision(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.decide_agent_action(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_agent_admin_snapshot(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_agent_admin_run(TEXT, UUID) TO service_role;

COMMENT ON TABLE public.agent_approvers IS
    'Stable-subject approval registry. C7 permits one active owner only; delegated approvers remain disabled.';
COMMENT ON TABLE public.agent_admin_request_nonces IS
    'Hashed one-use service request nonces for protected admin mutation and trigger replay defense.';
COMMENT ON FUNCTION public.decide_agent_action(UUID, TEXT, INTEGER, JSONB, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) IS
    'Atomically approves or rejects through the stable owner subject, payload/version compare-and-set, nonce consumption, and durable audit events. Never executes an action.';

COMMIT;
