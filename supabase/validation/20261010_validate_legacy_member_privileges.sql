-- Read-only post-application verification; never invokes a reviewed function.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '15s';
DO $validation$
DECLARE
  browser_role text;
  signature text;
  function_oid oid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE oid = 'public.ai_usage_current_month'::regclass
      AND relkind = 'v' AND reloptions @> ARRAY['security_invoker=true']
  ) THEN
    RAISE EXCEPTION 'Member privilege verification: usage view must use invoker rights';
  END IF;
  FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF has_table_privilege(browser_role, 'public.ai_usage_current_month', 'SELECT')
      OR has_any_column_privilege(browser_role, 'public.ai_usage_current_month', 'SELECT') THEN
      RAISE EXCEPTION 'Member privilege verification: browser role can read usage view';
    END IF;
  END LOOP;
  IF NOT has_table_privilege('service_role', 'public.ai_usage_current_month', 'SELECT')
    OR NOT has_table_privilege('service_role', 'public.ai_usage', 'SELECT') THEN
    RAISE EXCEPTION 'Member privilege verification: trusted usage read unavailable';
  END IF;
  FOREACH signature IN ARRAY ARRAY[
    'public.check_certificate_eligibility(uuid,uuid)',
    'public.get_module_completion(uuid,uuid)',
    'public.get_ai_usage_count(text,text)',
    'public.expire_old_jobs()'
  ] LOOP
    function_oid := to_regprocedure(signature);
    IF function_oid IS NULL THEN
      RAISE EXCEPTION 'Member privilege verification: reviewed function missing';
    END IF;
    FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF has_function_privilege(browser_role, function_oid, 'EXECUTE') THEN
        RAISE EXCEPTION 'Member privilege verification: browser role can invoke reviewed function';
      END IF;
    END LOOP;
    IF NOT has_function_privilege('service_role', function_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'Member privilege verification: trusted function caller unavailable';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid = function_oid AND prosecdef
      AND proconfig @> ARRAY['search_path=public, pg_temp']) THEN
      RAISE EXCEPTION 'Member privilege verification: fixed trusted function search path missing';
    END IF;
  END LOOP;
END;
$validation$;
ROLLBACK;
