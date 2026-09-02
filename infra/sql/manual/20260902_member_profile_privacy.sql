-- MANUAL CANDIDATE ONLY. NOT A MIGRATION. DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL.
-- Runbook: docs/security/member-profile-access-rollout.md
-- Production anonymous profiles row access was observed by HEAD on 2026-09-02.
-- This unexecuted file does not close it. App compatibility MUST be deployed first.
-- Preserve service_role permissions and existing resume_workspace owner policies.
-- Sources:
-- https://www.postgresql.org/docs/current/sql-createpolicy.html
-- https://supabase.com/docs/guides/database/postgres/row-level-security

-- SECTION A: read-only catalog preflight. Run separately and archive metadata
-- securely BEFORE Section B. No member rows, application RPCs, or credentials.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

SELECT current_database() AS database_name, current_user AS operator,
       current_setting('server_version') AS server_version;

-- Original owners, flags and raw ACLs are part of the rollback record.
SELECT c.oid::regclass AS relation, c.relkind,
       pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity, c.relforcerowsecurity, c.relacl, c.reloptions
FROM pg_class c
WHERE c.oid IN (to_regclass('public.profiles'), to_regclass('public.resume_workspace'));

SELECT n.nspname, pg_get_userbyid(n.nspowner) AS owner, n.nspacl
FROM pg_namespace n WHERE n.nspname = 'public';

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('profiles', 'resume_workspace')
ORDER BY tablename, policyname;

-- Include PUBLIC/default ACLs and every grantor, not just role_table_grants.
SELECT c.oid::regclass AS relation,
       CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS grantee,
       pg_get_userbyid(a.grantor) AS grantor, a.privilege_type, a.is_grantable
FROM pg_class c
CROSS JOIN LATERAL aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
WHERE c.oid IN (to_regclass('public.profiles'), to_regclass('public.resume_workspace'))
ORDER BY relation, grantee, a.privilege_type;

SELECT c.oid::regclass AS relation, a.attname AS column_name, a.attacl
FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid
WHERE c.oid IN (to_regclass('public.profiles'), to_regclass('public.resume_workspace'))
  AND a.attnum > 0 AND NOT a.attisdropped AND a.attacl IS NOT NULL
ORDER BY relation, a.attnum;

SELECT r.rolname, r.rolsuper, r.rolbypassrls, r.rolinherit, r.rolcanlogin,
       has_schema_privilege(r.oid, 'public', 'USAGE') AS schema_usage,
       has_table_privilege(r.oid, 'public.profiles', 'SELECT') AS can_select,
       has_table_privilege(r.oid, 'public.profiles', 'INSERT') AS can_insert,
       has_table_privilege(r.oid, 'public.profiles', 'UPDATE') AS can_update,
       has_table_privilege(r.oid, 'public.profiles', 'DELETE') AS can_delete,
       has_table_privilege(r.oid, 'public.profiles', 'TRUNCATE') AS can_truncate,
       has_table_privilege(r.oid, 'public.profiles', 'TRIGGER') AS can_trigger,
       has_table_privilege(r.oid, 'public.profiles', 'REFERENCES') AS can_reference,
       has_any_column_privilege(r.oid, 'public.profiles', 'SELECT,INSERT,UPDATE') AS any_column_dml
FROM pg_roles r WHERE r.rolname IN ('anon', 'authenticated', 'service_role', 'authenticator');

-- Inspect membership chains and SET ROLE options for the browser roles. Flags
-- alone do not establish whether a caller can reach an owner/bypass role.
SELECT pg_get_userbyid(m.member) AS member,
       pg_get_userbyid(m.roleid) AS granted_role,
       pg_get_userbyid(m.grantor) AS grantor, m.admin_option,
       to_jsonb(m)->>'inherit_option' AS inherit_option,
       to_jsonb(m)->>'set_option' AS set_option
FROM pg_auth_members m ORDER BY member, granted_role;

SELECT pg_get_userbyid(d.defaclrole) AS owner,
       coalesce(n.nspname, '(all schemas)') AS schema_name,
       d.defaclobjtype, d.defaclacl
FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
WHERE d.defaclnamespace = 0 OR n.nspname = 'public';

SELECT i.inhparent::regclass AS parent, i.inhrelid::regclass AS child
FROM pg_inherits i
WHERE i.inhparent = to_regclass('public.profiles') OR i.inhrelid = to_regclass('public.profiles');

-- Recursive view/materialized-view dependents: inspect definitions and grants
-- privately. A definer owner or a materialized copy can bypass the intended path.
WITH RECURSIVE dependents AS (
  SELECT c.oid, ARRAY[c.oid] AS path
  FROM pg_class c
  WHERE c.oid IN (to_regclass('public.profiles'), to_regclass('public.resume_workspace'))
  UNION ALL
  SELECT v.oid, d.path || v.oid
  FROM dependents d
  JOIN pg_depend dep ON dep.refobjid = d.oid
    AND dep.refclassid = 'pg_class'::regclass AND dep.classid = 'pg_rewrite'::regclass
  JOIN pg_rewrite rw ON rw.oid = dep.objid
  JOIN pg_class v ON v.oid = rw.ev_class AND v.relkind IN ('v', 'm')
  WHERE NOT v.oid = ANY(d.path)
)
SELECT DISTINCT c.oid::regclass AS dependent_relation, c.relkind,
       pg_get_userbyid(c.relowner) AS owner, c.reloptions, c.relacl
FROM dependents d JOIN pg_class c ON c.oid = d.oid
WHERE c.relkind IN ('v', 'm');

-- Candidate callable functions, WITHOUT printing bodies (which can contain
-- secrets). Review bodies, nested calls and dynamic SQL privately. This inventory
-- is not proof of safety: also inspect every configured exposed API schema.
SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prokind, p.prosecdef, pg_get_userbyid(p.proowner) AS owner, p.proacl,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
  AND (p.prosecdef OR n.nspname = 'public')
ORDER BY n.nspname, p.proname, arguments;

-- Other direct dependencies are review leads, not an exhaustive function scan.
-- String-defined/dynamic function bodies may have no table dependency recorded.
SELECT pg_describe_object(d.classid, d.objid, d.objsubid) AS dependent_object, d.deptype
FROM pg_depend d
WHERE d.refclassid = 'pg_class'::regclass
  AND d.refobjid IN (to_regclass('public.profiles'), to_regclass('public.resume_workspace'))
ORDER BY dependent_object;

ROLLBACK;

-- STOP HERE. Confirm all of the following outside SQL before proceeding:
-- [ ] Correct database and compatible app deployment explicitly approved.
-- [ ] Original policies, owners, RLS flags, table/column ACLs and grant paths saved.
-- [ ] No leaking view/materialized copy/RPC/other exposed endpoint remains.
-- [ ] Browser roles cannot own/bypass RLS or assume privileged roles.
-- [ ] Existing server/service flows and service_role grants verified.
-- [ ] Synthetic verification and narrow rollback/fix-forward plan approved.
-- [ ] resume_workspace remains untouched; its empty HEAD result is inconclusive.

-- SECTION B: separately reviewed manual candidate. Safe by default: acknowledgment
-- disabled AND final ROLLBACK. Never add this file to automatic migration tooling.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- Enable ONLY in the reviewed applied copy after explicit approval:
-- SET LOCAL nested_objects.member_profile_privacy_approved = '20260902-reviewed';

DO $guard$
BEGIN
  IF current_setting('nested_objects.member_profile_privacy_approved', true)
       IS DISTINCT FROM '20260902-reviewed' THEN
    RAISE EXCEPTION 'Manual approval/preflight acknowledgment missing; no change applied';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class
                 WHERE oid = to_regclass('public.profiles') AND relkind = 'r') THEN
    RAISE EXCEPTION 'Expected ordinary public.profiles table; stop and review target';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_inherits
             WHERE inhparent = 'public.profiles'::regclass OR inhrelid = 'public.profiles'::regclass) THEN
    RAISE EXCEPTION 'Unexpected profile inheritance/partition layout; revise reviewed plan';
  END IF;
  IF (SELECT count(*) FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role')) <> 3 THEN
    RAISE EXCEPTION 'Expected roles missing; stop and review role configuration';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles
             WHERE rolname IN ('anon', 'authenticated') AND (rolsuper OR rolbypassrls)) THEN
    RAISE EXCEPTION 'Browser role bypasses RLS; this candidate cannot secure it';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_roles browser_role CROSS JOIN pg_roles privileged_role
    WHERE browser_role.rolname IN ('anon', 'authenticated')
      AND (privileged_role.rolsuper OR privileged_role.rolbypassrls
        OR privileged_role.oid = (SELECT relowner FROM pg_class WHERE oid = 'public.profiles'::regclass))
      AND pg_has_role(browser_role.oid, privileged_role.oid, 'MEMBER')
  ) THEN
    RAISE EXCEPTION 'Browser role reaches owner/bypass authority; review role membership first';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname IN ('anon', 'authenticated')
             AND has_table_privilege(r.oid, 'public.profiles', 'TRUNCATE')) THEN
    RAISE EXCEPTION 'Browser TRUNCATE privilege is outside RLS; resolve under separate approval';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.profiles'::regclass
             AND polname = 'profiles_outseta_server_only_20260902') THEN
    RAISE EXCEPTION 'Candidate policy already exists; inspect metadata instead of replacing it';
  END IF;
  -- The app's server-only client needs existing CRUD and RLS bypass/ownership.
  -- Check each privilege: a comma-list predicate tests ANY, not ALL privileges.
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles r
    WHERE r.rolname = 'service_role'
      AND has_schema_privilege(r.oid, 'public', 'USAGE')
      AND has_table_privilege(r.oid, 'public.profiles', 'SELECT')
      AND has_table_privilege(r.oid, 'public.profiles', 'INSERT')
      AND has_table_privilege(r.oid, 'public.profiles', 'UPDATE')
      AND has_table_privilege(r.oid, 'public.profiles', 'DELETE')
      AND (r.rolsuper OR r.rolbypassrls OR (
        NOT (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.profiles'::regclass)
        AND pg_has_role(r.oid,
          (SELECT relowner FROM pg_class WHERE oid = 'public.profiles'::regclass), 'USAGE')))
  ) THEN
    RAISE EXCEPTION 'Expected service-role permissions/bypass not confirmed; do not add grants automatically';
  END IF;
END
$guard$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_outseta_server_only_20260902
ON public.profiles AS RESTRICTIVE
FOR ALL TO anon, authenticated
USING (false)
WITH CHECK (false);

-- No CASCADE, policy deletion, FORCE RLS, service_role grant change, or resume DDL.
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles FROM anon, authenticated;

-- Fail closed if PUBLIC, memberships, grantors or other effective privileges
-- still provide direct DML. Do not broaden this revoke automatically.
DO $verify$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_roles r WHERE r.rolname IN ('anon', 'authenticated')
      AND (has_table_privilege(r.oid, 'public.profiles', 'SELECT,INSERT,UPDATE,DELETE')
        OR has_any_column_privilege(r.oid, 'public.profiles', 'SELECT,INSERT,UPDATE'))
  ) THEN
    RAISE EXCEPTION 'Effective browser DML remains; rollback and review remaining grant paths';
  END IF;
  IF NOT (has_schema_privilege('service_role', 'public', 'USAGE')
      AND has_table_privilege('service_role', 'public.profiles', 'SELECT')
      AND has_table_privilege('service_role', 'public.profiles', 'INSERT')
      AND has_table_privilege('service_role', 'public.profiles', 'UPDATE')
      AND has_table_privilege('service_role', 'public.profiles', 'DELETE')) THEN
    RAISE EXCEPTION 'Service-role access changed unexpectedly; rollback and investigate';
  END IF;
END
$verify$;

-- Recheck catalog metadata in the same transaction; no member rows are read.
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';

-- Deliberately non-applying candidate. Replace with COMMIT only in the explicitly
-- approved applied copy. Do not leave a transaction/lock open while awaiting input.
ROLLBACK;
