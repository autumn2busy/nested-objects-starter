-- Issue #318 staging acceptance: pgcrypto is not on the restricted trigger search path.
-- Use PostgreSQL's built-in SHA-256 without widening SECURITY DEFINER privileges.
-- Staging-first. No Production application is authorized by this migration.

BEGIN;

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
    checksum := pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
        NEW.id::TEXT || '|' || NEW.status || '|' || NEW.decision_version::TEXT || '|'
        || COALESCE(NEW.approved_by, NEW.rejected_by, ''),
        'UTF8'
    )), 'hex');
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

REVOKE ALL ON FUNCTION public.trace_agent_action_decision() FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
