-- One-time, manually reviewed staging operation; NOT an automatic migration.
-- Only for nested-objects-staging (wqstirwszdbsygstnvbn), positively verified in the dashboard.
-- Autumn confirmed owner subject 9P66YMPm in the Issue #318 task on 2026-09-02 UTC.
-- Never run against Production. No credentials, member records, or executor are installed.

BEGIN;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.agent_approvers, public.agent_runtime_destination_bindings
    IN SHARE ROW EXCLUSIVE MODE;

DO $guard$
BEGIN
    IF EXISTS (SELECT 1 FROM public.agent_approvers)
       OR EXISTS (SELECT 1 FROM public.agent_runtime_destination_bindings) THEN
        RAISE EXCEPTION 'First-time staging registration requires empty registries; inspect before retrying';
    END IF;
END;
$guard$;

INSERT INTO public.agent_approvers (
    subject_id, approver_kind, display_name, active, scopes,
    reviewed_by, reviewed_at, review_evidence
) VALUES (
    '9P66YMPm', 'owner', 'Autumn', true, '["intelligence_os"]'::jsonb,
    '9P66YMPm', now(),
    jsonb_build_object('issue', 318, 'pullRequest', 334, 'operator', 'Codex',
        'userConfirmedExactSubject', true, 'scope', 'staging_only',
        'task', '01a0411b-ab2f-7d51-b50e-cfd61a5e7f55')
);

INSERT INTO public.agent_runtime_destination_bindings (
    binding_key, policy_version, environment, project_ref, destination_fingerprint,
    review_status, reviewed_by, reviewed_at, review_evidence, active
) VALUES (
    'nested-objects-agent-runtime-staging', 'phase-c3-v1', 'staging',
    'wqstirwszdbsygstnvbn',
    'be8e4a36f85fbecf5109502e9acfc0830a4d4258a25c518cfdbf700d8b8f7954',
    'approved', '9P66YMPm', now(),
    jsonb_build_object('issue', 318, 'pullRequest', 334, 'operator', 'Codex',
        'userConfirmedActivation', true, 'scope', 'synthetic_preview_only',
        'task', '01a0411b-ab2f-7d51-b50e-cfd61a5e7f55'), true
);

DO $verify$
BEGIN
    PERFORM set_config('request.jwt.claim.role', 'service_role', true);
    PERFORM public.assert_agent_owner_subject('9P66YMPm');
    IF NOT public.verify_agent_runtime_destination(
        'nested-objects-agent-runtime-staging', 'phase-c3-v1',
        'wqstirwszdbsygstnvbn',
        'be8e4a36f85fbecf5109502e9acfc0830a4d4258a25c518cfdbf700d8b8f7954'
    ) THEN RAISE EXCEPTION 'Staging destination verification failed'; END IF;
END;
$verify$;
COMMIT;

SELECT subject_id, approver_kind, active FROM public.agent_approvers;
SELECT project_ref, environment, active FROM public.agent_runtime_destination_bindings;
