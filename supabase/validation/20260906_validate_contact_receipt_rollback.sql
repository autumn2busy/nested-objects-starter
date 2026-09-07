-- DATA-008: approved database-only receipt verification. Run as postgres after
-- verifying the destination and applying the reviewed forward migration.
-- No form, webhook, notification, user/profile write, or durable fixture is used.
-- Success ends with ROLLBACK. On error, issue ROLLBACK before any further query.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $validation$
declare
  receipt_table oid := to_regclass('public.contact_submissions');
  browser_role text;
  column_name text;
begin
  if current_user <> 'postgres' or receipt_table is null then
    raise exception 'Receipt verification requires postgres and the migrated table.';
  end if;
  -- Keep conflicting table/trigger DDL outside this bounded transaction.
  lock table public.contact_submissions in row exclusive mode;
  if (select relkind from pg_class where oid = receipt_table) <> 'r'
     or exists (select 1 from pg_rewrite where ev_class = receipt_table)
     or exists (
       select 1 from pg_class c
       cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) permission
       where c.oid = receipt_table and permission.grantee not in (c.relowner, 'service_role'::regrole::oid)
     ) then
    raise exception 'Receipt verification refused: unexpected relation, rewrite rule, or explicit grantee.';
  end if;
  if not (select relrowsecurity from pg_class where oid = receipt_table)
     or (select count(*) from pg_policy where polrelid = receipt_table) <> 1
     or not exists (
       select 1 from pg_policy where polrelid = receipt_table
         and polname = 'contact_submissions_service_role_all' and polcmd = '*'
         and polroles = array['service_role'::regrole::oid]
         and pg_get_expr(polqual, polrelid) = 'true'
         and pg_get_expr(polwithcheck, polrelid) = 'true'
     ) then
    raise exception 'Receipt verification refused: RLS or policy differs from the reviewed migration.';
  end if;
  if (select count(*) from pg_attribute where attrelid = receipt_table
      and attnum > 0 and not attisdropped) <> 9 or exists (
    select 1 from (values
      ('id', 'uuid', true), ('user_id', 'uuid', false), ('profile_id', 'uuid', false),
      ('name', 'text', true), ('email', 'text', true), ('topic', 'text', true),
      ('message', 'text', true), ('created_at', 'timestamp with time zone', true),
      ('updated_at', 'timestamp with time zone', true)
    ) expected(name, type_name, required)
    left join pg_attribute actual on actual.attrelid = receipt_table
      and actual.attname = expected.name and not actual.attisdropped
    where actual.attname is null or format_type(actual.atttypid, actual.atttypmod) <> expected.type_name
      or actual.attnotnull <> expected.required
  ) or (select count(*) from pg_attrdef d join pg_attribute a
    on a.attrelid = d.adrelid and a.attnum = d.adnum where d.adrelid = receipt_table
      and ((a.attname = 'id' and pg_get_expr(d.adbin, d.adrelid) = 'gen_random_uuid()')
        or (a.attname in ('created_at', 'updated_at') and pg_get_expr(d.adbin, d.adrelid) = 'now()'))
  ) <> 3 then
    raise exception 'Receipt verification refused: column shape or generated defaults differ.';
  end if;
  if (select count(*) from pg_constraint where conrelid = receipt_table and contype = 'f') <> 2
     or exists (
       select 1 from (values ('user_id', 'auth.users'), ('profile_id', 'public.profiles')) expected(column_name, target)
       where not exists (
         select 1 from pg_constraint c
         join pg_attribute source on source.attrelid = c.conrelid and c.conkey = array[source.attnum]
         join pg_attribute destination on destination.attrelid = c.confrelid and c.confkey = array[destination.attnum]
         where c.conrelid = receipt_table and c.contype = 'f' and c.convalidated
           and source.attname = expected.column_name and c.confrelid = to_regclass(expected.target)
           and destination.attname = 'id' and c.confdeltype = 'n' and c.confupdtype = 'a'
       )
     ) then
    raise exception 'Receipt verification refused: foreign keys differ from the reviewed migration.';
  end if;
  if (select count(*) from pg_trigger where tgrelid = receipt_table and not tgisinternal) <> 1
     or not exists (
       select 1 from pg_trigger t join pg_proc f on f.oid = t.tgfoid
       where t.tgrelid = receipt_table and not t.tgisinternal
         and t.tgname = 'set_contact_submissions_updated_at' and t.tgtype = 19
         and t.tgenabled = 'O' and t.tgqual is null and octet_length(t.tgargs) = 0
         and f.oid = 'public.set_contact_submissions_updated_at()'::regprocedure
         and not f.prosecdef and f.prorettype = 'trigger'::regtype
         and f.prolang = (select oid from pg_language where lanname = 'plpgsql')
         and btrim(regexp_replace(f.prosrc, '\s+', ' ', 'g')) = 'begin new.updated_at = now(); return new; end;'
     ) then
    raise exception 'Receipt verification refused: an unexpected trigger or trigger body could have side effects.';
  end if;
  foreach browser_role in array array['anon', 'authenticated'] loop
    if has_table_privilege(browser_role, receipt_table, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') then
      raise exception 'Receipt verification refused: browser table privileges are present.';
    end if;
    for column_name in select attname from pg_attribute where attrelid = receipt_table and attnum > 0 and not attisdropped loop
      if has_column_privilege(browser_role, receipt_table, column_name, 'SELECT, INSERT, UPDATE, REFERENCES') then
        raise exception 'Receipt verification refused: browser column privileges are present.';
      end if;
    end loop;
  end loop;
  foreach column_name in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
    if not has_table_privilege('service_role', receipt_table, column_name) then
      raise exception 'Receipt verification refused: a required server privilege is absent.';
    end if;
  end loop;
end;
$validation$;

set local role service_role;
do $receipt$
declare
  receipt_id uuid;
  affected integer;
begin
  insert into public.contact_submissions (name, email, topic, message)
  values ('Synthetic rollback verification', 'receipt@example.invalid', 'DATA-008 verification',
    'Synthetic database-only receipt. This transaction must roll back.')
  returning id into receipt_id;
  if receipt_id is null or not exists (
    select 1 from public.contact_submissions where id = receipt_id
      and user_id is null and profile_id is null
      and created_at = transaction_timestamp() and updated_at = transaction_timestamp()
  ) then
    raise exception 'Receipt verification failed: generated receipt fields or server read.';
  end if;
  perform set_config('app.contact_receipt_validation_id', receipt_id::text, true);
  -- A deliberately old timestamp proves the reviewed trigger replaces it.
  update public.contact_submissions set topic = 'DATA-008 verified', updated_at = '2000-01-01T00:00:00Z'
  where id = receipt_id and topic = 'DATA-008 verification';
  get diagnostics affected = row_count;
  if affected <> 1 or not exists (
    select 1 from public.contact_submissions where id = receipt_id
      and topic = 'DATA-008 verified' and updated_at = transaction_timestamp()
  ) then
    raise exception 'Receipt verification failed: server update or timestamp trigger.';
  end if;
end;
$receipt$;
reset role;

do $denials$
declare
  browser_role text;
  operation text;
  denied integer := 0;
begin
  foreach browser_role in array array['anon', 'authenticated'] loop
    execute format('set local role %I', browser_role);
    foreach operation in array array['select', 'insert', 'update', 'delete'] loop
      begin
        case operation
          when 'select' then perform id from public.contact_submissions
            where id = current_setting('app.contact_receipt_validation_id')::uuid;
          when 'insert' then insert into public.contact_submissions (name, email, topic, message)
            values ('Synthetic denied fixture', 'receipt@example.invalid', 'DATA-008 denial', 'Must be denied.');
          when 'update' then update public.contact_submissions set topic = 'DATA-008 denial'
            where id = current_setting('app.contact_receipt_validation_id')::uuid;
          when 'delete' then delete from public.contact_submissions
            where id = current_setting('app.contact_receipt_validation_id')::uuid;
        end case;
        raise exception 'Receipt verification failed: browser operation was unexpectedly allowed.';
      exception when insufficient_privilege then
        denied := denied + 1;
      end;
    end loop;
    reset role;
  end loop;
  if denied <> 8 then raise exception 'Receipt verification failed: browser denial coverage.'; end if;
  perform set_config('app.contact_receipt_denials', denied::text, true);
end;
$denials$;

-- Safe output only: no ID, name, address, message, or existing receipt is returned.
select current_setting('app.contact_receipt_denials')::integer = 8 as browser_crud_denials_passed,
  (select count(*) = 1 from public.contact_submissions
    where id = current_setting('app.contact_receipt_validation_id')::uuid
      and topic = 'DATA-008 verified' and user_id is null and profile_id is null
      and created_at = transaction_timestamp() and updated_at = transaction_timestamp()
  ) as synthetic_receipt_passed;
rollback;
