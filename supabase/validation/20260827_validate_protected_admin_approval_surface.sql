-- Issue #318, Phase C7 staging validation.
-- Creates one synthetic owner and synthetic actions inside a transaction, then always rolls back.

BEGIN;

SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';

DO $validation$
DECLARE
    owner_subject TEXT := 'synthetic-autumn-stable-subject-c7';
    wrong_subject TEXT := 'synthetic-not-owner-subject-c7';
    correlation_uuid UUID := gen_random_uuid();
    action_uuid UUID := gen_random_uuid();
    rejected_action_uuid UUID := gen_random_uuid();
    approval_nonce TEXT := repeat('a', 64);
    rejection_nonce TEXT := repeat('b', 64);
    trigger_nonce TEXT := repeat('c', 64);
    approval_result JSONB;
    rejection_result JSONB;
    snapshot_result JSONB;
    blocked BOOLEAN := false;
BEGIN
    IF to_regclass('public.agent_approvers') IS NULL
       OR to_regclass('public.agent_admin_request_nonces') IS NULL THEN
        RAISE EXCEPTION 'Missing Phase C7 protected admin tables';
    END IF;
    IF has_table_privilege('service_role', 'public.agent_actions', 'UPDATE')
       OR has_table_privilege('service_role', 'public.agent_events', 'DELETE')
       OR has_table_privilege('service_role', 'public.agent_approvers', 'INSERT')
       OR has_table_privilege('anon', 'public.agent_approvers', 'SELECT') THEN
        RAISE EXCEPTION 'Phase C7 direct privileges exceed the protected admin boundary';
    END IF;

    INSERT INTO public.agent_approvers (
        subject_id, approver_kind, display_name, active, scopes,
        reviewed_by, reviewed_at, review_evidence
    ) VALUES (
        owner_subject, 'owner', 'Synthetic Autumn owner', true,
        '["intelligence_os"]'::jsonb, owner_subject, now(),
        jsonb_build_object('fixture', true, 'production', false)
    );

    INSERT INTO public.agent_actions (
        id, action_type, target_system, requested_by_agent, signal_ids,
        payload, evidence, source_refs, concise_rationale, risk_level,
        approval_required, status, execution_guard_version, verification_status,
        correlation_id, idempotency_key
    ) VALUES
    (
        action_uuid, 'activecampaign.review_cleanup', 'activecampaign', 'synthetic-c7-validation', '{}'::UUID[],
        jsonb_build_object('contactId', 'synthetic-contact-c7', 'mutationAllowed', false),
        jsonb_build_array(), jsonb_build_array(), 'Synthetic approval validation action.', 'high',
        true, 'proposed', 'phase-c7-no-executor-v1', 'not_started',
        correlation_uuid, 'synthetic-c7-action-approval'
    ),
    (
        rejected_action_uuid, 'content.review_draft_candidate', 'github_content_workflow', 'synthetic-c7-validation', '{}'::UUID[],
        jsonb_build_object('briefId', 'synthetic-brief-c7', 'publishAllowed', false),
        jsonb_build_array(), jsonb_build_array(), 'Synthetic rejection validation action.', 'medium',
        true, 'proposed', 'phase-c7-no-executor-v1', 'not_started',
        correlation_uuid, 'synthetic-c7-action-rejection'
    );

    PERFORM set_config('request.jwt.claim.role', 'service_role', true);

    blocked := false;
    BEGIN
        PERFORM public.get_agent_admin_snapshot(wrong_subject, 10);
    EXCEPTION WHEN OTHERS THEN
        IF position('not the active owner subject' IN SQLERRM) > 0 THEN blocked := true; ELSE RAISE; END IF;
    END;
    IF NOT blocked THEN RAISE EXCEPTION 'Unauthorized stable subject reached the admin snapshot'; END IF;

    snapshot_result := public.get_agent_admin_snapshot(owner_subject, 10);
    IF jsonb_array_length(snapshot_result->'awaitingActions') <> 2
       OR snapshot_result->>'delegationEnabled' <> 'false'
       OR snapshot_result->>'executionEnabled' <> 'false' THEN
        RAISE EXCEPTION 'Owner snapshot omitted actions or enabled delegation/execution';
    END IF;

    IF public.consume_agent_admin_nonce(
        trigger_nonce, 'trigger.weekly.weekly_operating_review', owner_subject,
        now() + interval '5 minutes', correlation_uuid, NULL
    ) <> 'consumed' THEN
        RAISE EXCEPTION 'Protected trigger nonce was not consumed';
    END IF;
    blocked := false;
    BEGIN
        PERFORM public.consume_agent_admin_nonce(
            trigger_nonce, 'trigger.weekly.weekly_operating_review', owner_subject,
            now() + interval '5 minutes', correlation_uuid, NULL
        );
    EXCEPTION WHEN OTHERS THEN
        IF position('already consumed' IN SQLERRM) > 0 THEN blocked := true; ELSE RAISE; END IF;
    END;
    IF NOT blocked THEN RAISE EXCEPTION 'Protected trigger nonce replay was accepted'; END IF;

    approval_result := public.decide_agent_action(
        action_uuid, 'approved', 0,
        jsonb_build_object('contactId', 'synthetic-contact-c7', 'mutationAllowed', false),
        repeat('d', 64), 'Synthetic owner reviewed the evidence.', owner_subject,
        approval_nonce, now() + interval '5 minutes', now(),
        'synthetic-c7-decision-approval'
    );
    IF approval_result->>'status' <> 'approved'
       OR approval_result->>'decisionVersion' <> '1'
       OR approval_result->>'executionStarted' <> 'false' THEN
        RAISE EXCEPTION 'Owner approval did not return the guarded decision contract';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.agent_actions
        WHERE id = action_uuid
          AND status = 'approved'
          AND approved_by = owner_subject
          AND approval_authority = 'owner'
          AND decision_version = 1
          AND approved_payload = payload
          AND approved_payload_digest = repeat('d', 64)
          AND executor_key IS NULL
          AND execution_started_at IS NULL
          AND executed_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Approved action did not preserve immutable payload or no-execution state';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.agent_events
        WHERE event_type = 'agent.action.approved'
          AND subject_id = action_uuid::TEXT
          AND correlation_id = correlation_uuid
    ) THEN
        RAISE EXCEPTION 'Approval event was not durably audited';
    END IF;

    blocked := false;
    BEGIN
        UPDATE public.agent_actions
        SET payload = jsonb_build_object('contactId', 'changed-after-approval')
        WHERE id = action_uuid;
    EXCEPTION WHEN OTHERS THEN
        IF position('immutable' IN SQLERRM) > 0
           OR position('approved_payload_immutable' IN SQLERRM) > 0 THEN blocked := true; ELSE RAISE; END IF;
    END;
    IF NOT blocked THEN RAISE EXCEPTION 'Approved action payload was mutable'; END IF;

    rejection_result := public.decide_agent_action(
        rejected_action_uuid, 'rejected', 0,
        jsonb_build_object('briefId', 'synthetic-brief-c7', 'publishAllowed', false),
        repeat('e', 64), 'Synthetic owner rejected the proposal.', owner_subject,
        rejection_nonce, now() + interval '5 minutes', now(),
        'synthetic-c7-decision-rejection'
    );
    IF rejection_result->>'status' <> 'rejected'
       OR NOT EXISTS (
          SELECT 1 FROM public.agent_events
          WHERE event_type = 'agent.action.rejected'
            AND subject_id = rejected_action_uuid::TEXT
            AND correlation_id = correlation_uuid
       ) THEN
        RAISE EXCEPTION 'Rejection was not guarded and audited';
    END IF;

    blocked := false;
    BEGIN
        PERFORM public.decide_agent_action(
            action_uuid, 'approved', 0,
            jsonb_build_object('contactId', 'synthetic-contact-c7', 'mutationAllowed', false),
            repeat('d', 64), 'Stale replay must fail.', owner_subject,
            repeat('f', 64), now() + interval '5 minutes', now(),
            'synthetic-c7-stale-decision'
        );
    EXCEPTION WHEN OTHERS THEN
        IF position('no longer awaiting a decision' IN SQLERRM) > 0
           OR position('changed after review' IN SQLERRM) > 0 THEN blocked := true; ELSE RAISE; END IF;
    END;
    IF NOT blocked THEN RAISE EXCEPTION 'Stale action decision replay was accepted'; END IF;

    RAISE NOTICE 'PASS: Phase C7 stable owner, replay defense, CAS approval, immutable payload, rejection audit, and no-execution boundary validated.';
END;
$validation$;

SELECT 'PASS: Intelligence OS Phase C7 protected admin validation completed. Synthetic records were rolled back.' AS validation_result;

ROLLBACK;
