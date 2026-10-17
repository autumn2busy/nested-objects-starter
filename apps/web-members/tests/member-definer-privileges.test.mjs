import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { PGlite } = require('@electric-sql/pglite')
const migration = readFileSync(new URL('../../../supabase/migrations/20261010143000_restrict_legacy_member_definer_access.sql', import.meta.url), 'utf8')
const validation = readFileSync(new URL('../../../supabase/validation/20261010_validate_legacy_member_privileges.sql', import.meta.url), 'utf8')
const owner = '00000000-0000-4000-8000-000000000001'
const peer = '00000000-0000-4000-8000-000000000002'
const moduleId = '00000000-0000-4000-8000-000000000003'
const functions = ['check_certificate_eligibility(uuid,uuid)', 'get_module_completion(uuid,uuid)', 'get_ai_usage_count(text,text)', 'expire_old_jobs()']

async function database(t) {
  const db = new PGlite()
  t.after(() => db.close())
  // Reduced, synthetic schema reproduces the live definitions and grants.
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    revoke create on schema public from public;
    create table public.ai_usage(user_id uuid, outseta_uid text, feature text, tier text, total_tokens integer, created_at timestamptz);
    alter table public.ai_usage enable row level security;
    grant all on public.ai_usage to service_role;
    create view public.ai_usage_current_month as
      select user_id, outseta_uid, feature, tier, count(*) as call_count, sum(total_tokens) as total_tokens_used, max(created_at) as last_used
      from ai_usage where created_at >= date_trunc('month',now()) group by user_id,outseta_uid,feature,tier;
    grant all on public.ai_usage_current_month to anon, authenticated, service_role;
    create table public.training_modules(id uuid,track_id uuid,is_active boolean);
    create table public.module_sections(id uuid,module_id uuid,is_required boolean);
    create table public.member_training_progress(member_id uuid,section_id uuid,status text);
    create table public.jobs(id integer,is_active boolean,posted_date timestamptz);
    create function public.get_module_completion(p_member_id uuid,p_module_id uuid) returns integer language plpgsql security definer as $$
      declare total_sections integer; completed_sections integer;
      begin
        select count(*) into total_sections from module_sections where module_id=p_module_id and is_required=true;
        select count(*) into completed_sections from member_training_progress mtp join module_sections ms on mtp.section_id=ms.id
          where mtp.member_id=p_member_id and ms.module_id=p_module_id and mtp.status='complete' and ms.is_required=true;
        if total_sections=0 then return 0; end if;
        return round((completed_sections::decimal/total_sections)*100);
      end $$;
    create function public.check_certificate_eligibility(p_member_id uuid,p_track_id uuid) returns boolean language plpgsql security definer as $$
      declare total_modules integer; completed_modules integer;
      begin
        select count(*) into total_modules from training_modules where track_id=p_track_id and is_active=true;
        select count(*) into completed_modules from training_modules tm where tm.track_id=p_track_id and tm.is_active=true and get_module_completion(p_member_id,tm.id)=100;
        return completed_modules=total_modules;
      end $$;
    create function public.get_ai_usage_count(p_outseta_uid text,p_feature text) returns json language plpgsql security definer as $$
      declare v_count int;
      begin select count(*)::int into v_count from ai_usage where outseta_uid=p_outseta_uid and feature=p_feature and created_at>=date_trunc('month',now());
        return json_build_object('call_count',v_count); end $$;
    create function public.expire_old_jobs() returns integer language plpgsql security definer as $$
      declare expired_count integer;
      begin update public.jobs set is_active=false where is_active=true and posted_date<now()-interval '30 days';
        get diagnostics expired_count=row_count; return expired_count; end $$;
    grant execute on all functions in schema public to anon,authenticated,service_role;
    insert into ai_usage values ('${owner}','synthetic-owner','concierge','Elite',10,now()),('${peer}','synthetic-peer','concierge','Pro',20,now());
    insert into training_modules values ('${moduleId}','${moduleId}',true);
    insert into module_sections values ('${moduleId}','${moduleId}',true);
    insert into member_training_progress values ('${owner}','${moduleId}','complete');
    insert into jobs values (1,true,now()-interval '40 days'),(2,true,now());
    create function public.unrelated_function() returns text language sql as $$ select 'unchanged'::text $$;
    create table public.unrelated_table(id integer);
    grant select on public.unrelated_table to authenticated;
  `)
  return db
}
async function asRole(db, role, fn) {
  assert.ok(['anon','authenticated','service_role'].includes(role))
  await db.exec(`set role ${role}`)
  try { return await fn() } finally { await db.exec('reset role') }
}
async function snapshot(db) {
  const rows = {}
  for (const table of ['ai_usage','training_modules','module_sections','member_training_progress','jobs']) {
    rows[table] = (await db.query(`select * from public.${table}`)).rows
  }
  rows.functions = (await db.query(`select proname,prosrc,prosecdef,proconfig,proacl from pg_proc where oid in (${functions.map(f=>`'public.${f}'::regprocedure`).join(',')}) order by proname`)).rows
  rows.view = (await db.query("select reloptions,relacl,pg_get_viewdef(oid) as definition from pg_class where oid='public.ai_usage_current_month'::regclass")).rows
  return rows
}
test('the regression fixture demonstrates cross-subject reads before repair, without invoking the mutating function', async t => {
  const db=await database(t)
  await asRole(db,'anon',async()=>{
    assert.equal((await db.query('select count(*)::integer as n from public.ai_usage_current_month')).rows[0].n,2)
    assert.equal((await db.query("select public.get_ai_usage_count('synthetic-peer','concierge') as usage")).rows[0].usage.call_count,1)
    assert.equal((await db.query(`select public.get_module_completion('${owner}','${moduleId}') as completion`)).rows[0].completion,100)
  })
})
test('anon and authenticated cannot query usage or invoke any reviewed function with own, peer, or forged subject', async t => {
  const db=await database(t); await db.exec(migration)
  for(const role of ['anon','authenticated']) await asRole(db,role,async()=>{
    for(const subject of [owner,peer]) {
      await db.query("select set_config('request.jwt.claim.sub',$1,false)",[subject])
      for(const sql of [
        'select * from public.ai_usage_current_month',
        `select public.get_module_completion('${subject}','${moduleId}')`,
        `select public.check_certificate_eligibility('${subject}','${moduleId}')`,
        "select public.get_ai_usage_count('synthetic-owner','concierge')",
        "select public.get_ai_usage_count('synthetic-peer','concierge')",
        'select public.expire_old_jobs()',
      ]) await assert.rejects(db.query(sql),error=>error.code==='42501')
    }
  })
  assert.equal((await db.query('select count(*)::integer as n from jobs where is_active')).rows[0].n,2)
})
test('trusted service callers retain scoped usage/training results and the existing expiration behavior', async t => {
  const db=await database(t); await db.exec(migration)
  await asRole(db,'service_role',async()=>{
    assert.equal((await db.query('select count(*)::integer as n from public.ai_usage_current_month')).rows[0].n,2)
    assert.equal((await db.query("select public.get_ai_usage_count('synthetic-owner','concierge') as usage")).rows[0].usage.call_count,1)
    assert.equal((await db.query("select public.get_ai_usage_count('synthetic-unknown','concierge') as usage")).rows[0].usage.call_count,0)
    assert.equal((await db.query(`select public.get_module_completion('${owner}','${moduleId}') as completion`)).rows[0].completion,100)
    assert.equal((await db.query(`select public.get_module_completion('${peer}','${moduleId}') as completion`)).rows[0].completion,0)
    assert.equal((await db.query(`select public.check_certificate_eligibility('${owner}','${moduleId}') as eligible`)).rows[0].eligible,true)
    assert.equal((await db.query(`select public.check_certificate_eligibility('${peer}','${moduleId}') as eligible`)).rows[0].eligible,false)
    assert.equal((await db.query('select public.expire_old_jobs() as expired')).rows[0].expired,1)
  })
  assert.deepEqual((await db.query('select id,is_active from jobs order by id')).rows,[{id:1,is_active:false},{id:2,is_active:true}])
})
test('repair preserves data/function bodies/unrelated grants and reruns identically', async t => {
  const db=await database(t); const before=await snapshot(db); await db.exec(migration); const after=await snapshot(db)
  for(const table of ['ai_usage','training_modules','module_sections','member_training_progress','jobs']) assert.deepEqual(after[table],before[table])
  assert.equal(after.view[0].definition,before.view[0].definition)
  assert.ok(after.view[0].reloptions.includes('security_invoker=true'))
  for(let i=0;i<after.functions.length;i++) {
    assert.equal(after.functions[i].prosrc,before.functions[i].prosrc)
    assert.equal(after.functions[i].prosecdef,true)
    assert.deepEqual(after.functions[i].proconfig,['search_path=public, pg_temp'])
  }
  await db.exec(migration); assert.deepEqual(await snapshot(db),after)
  await asRole(db,'authenticated',async()=>{
    assert.equal((await db.query('select public.unrelated_function() as value')).rows[0].value,'unchanged')
    assert.equal((await db.query('select * from public.unrelated_table')).rows.length,0)
  })
})
test('unexpected object/column-grant drift aborts without leaving a partial privilege change', async t => {
  for(const drift of ['drop function public.get_ai_usage_count(text,text)', 'grant select(user_id) on public.ai_usage_current_month to anon']) {
    const db=await database(t); await db.exec(drift)
    await assert.rejects(db.exec(migration),/preflight/)
    await db.exec('rollback')
    assert.equal((await db.query("select has_table_privilege('anon','public.ai_usage_current_month','SELECT') as allowed")).rows[0].allowed,true)
    assert.equal((await db.query("select reloptions from pg_class where oid='public.ai_usage_current_month'::regclass")).rows[0].reloptions,null)
  }
})
test('the exact read-only verification passes repaired grants and rejects a reopened browser path', async t => {
  const db=await database(t)
  await assert.rejects(db.exec(validation), /invoker rights/); await db.exec('rollback')
  await db.exec(migration); const before=await snapshot(db)
  await db.exec(validation); assert.deepEqual(await snapshot(db),before)
  await db.exec('grant execute on function public.get_ai_usage_count(text,text) to authenticated')
  await assert.rejects(db.exec(validation), /browser role can invoke/); await db.exec('rollback')
})

test('inherited access or lost trusted access rolls back the entire migration', async t => {
  for (const drift of [
    'create role legacy_reader; grant legacy_reader to anon; grant select on public.ai_usage_current_month to legacy_reader',
    'create role legacy_reader; grant legacy_reader to authenticated; grant execute on function public.get_ai_usage_count(text,text) to legacy_reader',
    'revoke select on public.ai_usage from service_role',
    'alter function public.get_module_completion(uuid,uuid) security invoker',
  ]) {
    const db = await database(t); await db.exec(drift)
    const before = await snapshot(db)
    await assert.rejects(db.exec(migration), /postcondition/); await db.exec('rollback')
    assert.deepEqual(await snapshot(db), before)
  }
})
