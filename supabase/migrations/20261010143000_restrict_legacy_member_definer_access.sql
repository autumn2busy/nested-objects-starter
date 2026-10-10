-- PRIVACY-001: reviewed legacy objects must be reachable only by trusted servers.
-- No member rows, function bodies, tables, policies, schedules or other grants change.
-- Application membership is verified by server routes, not caller-supplied RPC IDs.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $preflight$
BEGIN
  IF to_regclass('public.ai_usage_current_month') IS NULL
    OR to_regprocedure('public.check_certificate_eligibility(uuid,uuid)') IS NULL
    OR to_regprocedure('public.get_module_completion(uuid,uuid)') IS NULL
    OR to_regprocedure('public.get_ai_usage_count(text,text)') IS NULL
    OR to_regprocedure('public.expire_old_jobs()') IS NULL THEN
    RAISE EXCEPTION 'Legacy member privilege preflight: a reviewed object is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = 'public.ai_usage_current_month'::regclass AND relkind = 'v') THEN
    RAISE EXCEPTION 'Legacy member privilege preflight: expected an ordinary view';
  END IF;
  -- Do not silently overlook separate column grants or an untrusted public schema.
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.ai_usage_current_month'::regclass AND attacl IS NOT NULL) THEN
    RAISE EXCEPTION 'Legacy member privilege preflight: review unexpected column grants';
  END IF;
  IF has_schema_privilege('anon', 'public', 'CREATE')
    OR has_schema_privilege('authenticated', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'Legacy member privilege preflight: public schema is not trusted';
  END IF;
END;
$preflight$;

ALTER VIEW public.ai_usage_current_month SET (security_invoker = true);
REVOKE ALL PRIVILEGES ON TABLE public.ai_usage_current_month FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.ai_usage_current_month TO service_role;

REVOKE ALL PRIVILEGES ON FUNCTION public.check_certificate_eligibility(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.get_module_completion(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.get_ai_usage_count(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.expire_old_jobs() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.check_certificate_eligibility(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_module_completion(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_count(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_old_jobs() TO service_role;

ALTER FUNCTION public.check_certificate_eligibility(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_module_completion(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_ai_usage_count(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.expire_old_jobs() SET search_path = public, pg_temp;

-- Fail the whole transaction if inherited grants or schema drift defeat the boundary.
DO $postcondition$
DECLARE
  browser_role text;
  signature text;
BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF has_table_privilege(browser_role, 'public.ai_usage_current_month', 'SELECT')
      OR has_any_column_privilege(browser_role, 'public.ai_usage_current_month', 'SELECT') THEN
      RAISE EXCEPTION 'Legacy member privilege postcondition: inherited browser usage access remains';
    END IF;
    FOREACH signature IN ARRAY ARRAY[
      'public.check_certificate_eligibility(uuid,uuid)',
      'public.get_module_completion(uuid,uuid)',
      'public.get_ai_usage_count(text,text)',
      'public.expire_old_jobs()'
    ] LOOP
      IF has_function_privilege(browser_role, signature, 'EXECUTE') THEN
        RAISE EXCEPTION 'Legacy member privilege postcondition: inherited browser function access remains';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid = to_regprocedure(signature) AND prosecdef) THEN
        RAISE EXCEPTION 'Legacy member privilege postcondition: reviewed function definition has drifted';
      END IF;
    END LOOP;
  END LOOP;
  IF NOT has_table_privilege('service_role', 'public.ai_usage', 'SELECT') THEN
    RAISE EXCEPTION 'Legacy member privilege postcondition: trusted underlying usage read unavailable';
  END IF;
END;
$postcondition$;
COMMIT;
