import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { PGlite } = require('@electric-sql/pglite')
const migration = readFileSync(new URL('../../../supabase/migrations/20261030161208_member_offboarding_holds.sql', import.meta.url), 'utf8')

async function database(t, legacyDefaults = true) {
  const db = new PGlite()
  t.after(() => db.close())
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    create table public.profiles (account_uid text primary key);
  `)
  if (legacyDefaults) await db.exec(`
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  `)
  await db.exec(migration)
  return db
}

async function hold(db, account = 'Acct0001', event = 'Event001', person = 'Pers0001') {
  return db.query(`insert into public.member_offboarding_holds
    (account_uid, person_uid, source_event_uid, source_event_at, reason)
    values ($1, $2, $3, '2026-10-29T12:00:00Z', 'cancellation')`, [account, person, event])
}

async function release(db) {
  return db.exec(`update public.member_offboarding_holds
    set released_at = now(), release_approval_ref = 'synthetic-owner-decision-1'
    where account_uid = 'Acct0001' and source_event_uid = 'Event001'`)
}

for (const legacyDefaults of [true, false]) {
  test(`server access is least privilege with ${legacyDefaults ? 'legacy' : 'opt-in'} default grants`, async t => {
    const db = await database(t, legacyDefaults)
    const { rows: [access] } = await db.query(`select
      has_table_privilege('service_role','public.member_offboarding_holds','SELECT') as can_read,
      has_table_privilege('service_role','public.member_offboarding_holds','DELETE') as can_delete,
      has_table_privilege('service_role','public.member_offboarding_holds','TRUNCATE') as can_truncate,
      has_column_privilege('service_role','public.member_offboarding_holds','reason','UPDATE') as can_rewrite_reason,
      relrowsecurity as rls from pg_class where oid = 'public.member_offboarding_holds'::regclass`)
    assert.deepEqual(access, { can_read:true, can_delete:false, can_truncate:false, can_rewrite_reason:false, rls:true })
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`)
      await assert.rejects(db.query('select * from public.member_offboarding_holds'), e => e.code === '42501')
      await assert.rejects(hold(db), e => e.code === '42501')
      await db.exec('reset role')
    }
    await db.exec('set role service_role')
    await hold(db)
    assert.equal((await db.query('select * from public.member_offboarding_holds')).rows.length, 1)
    await assert.rejects(db.exec('delete from public.member_offboarding_holds'), e => e.code === '42501')
    await assert.rejects(db.exec('truncate public.member_offboarding_holds'), e => e.code === '42501')
    await assert.rejects(db.exec(`insert into public.member_offboarding_holds
      (account_uid, person_uid, source_event_uid, source_event_at, reason, blocked_at)
      values ('Acct0002', 'Pers0002', 'Event002', now(), 'cancellation', '2020-01-01')`), e => e.code === '42501')
    await assert.rejects(db.exec(`insert into public.member_offboarding_holds
      (account_uid, person_uid, source_event_uid, source_event_at, reason, released_at, release_approval_ref)
      values ('Acct0002', 'Pers0002', 'Event002', now(), 'cancellation', now(), 'pre-released')`), e => e.code === '42501')
  })
}

test('release and later cancellation preserve both audit records with one active hold', async t => {
  const db = await database(t)
  await db.exec('set role service_role')
  await hold(db)
  await assert.rejects(hold(db, 'Acct0001', 'Event002'), e => e.code === '23505')
  await release(db)
  await hold(db, 'Acct0001', 'Event002')
  const { rows } = await db.query(`select source_event_uid, released_at is null as active,
    release_approval_ref from public.member_offboarding_holds order by source_event_uid`)
  assert.deepEqual(rows, [
    { source_event_uid:'Event001', active:false, release_approval_ref:'synthetic-owner-decision-1' },
    { source_event_uid:'Event002', active:true, release_approval_ref:null },
  ])
  await hold(db, 'Acct0002', 'Event003', 'Pers0001')
  assert.equal((await db.query('select count(*)::int as n from public.member_offboarding_holds')).rows[0].n, 3)
  await db.exec(`insert into public.member_offboarding_holds
    (account_uid, person_uid, source_event_uid, source_event_at, reason)
    values ('TestAccount', 'TestPerson', 'ApprovedAcceptance', now(), 'acceptance_test')`)
  assert.equal((await db.query(`select reason from public.member_offboarding_holds
    where account_uid = 'TestAccount'`)).rows[0].reason, 'acceptance_test')
})

test('release needs an approval reference and cannot rewrite source history or reactivate a released row', async t => {
  const db = await database(t)
  await db.exec('set role service_role')
  await hold(db)
  await assert.rejects(db.exec(`update public.member_offboarding_holds set reason = 'owner_removal'`), e => e.code === '42501')
  await assert.rejects(db.exec('update public.member_offboarding_holds set released_at = now()'), e => e.code === '23514')
  await assert.rejects(db.exec(`update public.member_offboarding_holds set released_at = now(), release_approval_ref = '  '`), e => e.code === '23514')
  await assert.rejects(db.exec(`update public.member_offboarding_holds set released_at = '2020-01-01', release_approval_ref = 'fixture'`), e => e.code === '23514')
  await release(db)
  await assert.rejects(db.exec('update public.member_offboarding_holds set released_at = null, release_approval_ref = null'), e => e.code === '23514')
  await assert.rejects(db.exec(`update public.member_offboarding_holds set release_approval_ref = 'rewritten'`), e => e.code === '23514')
})

test('profile deletion cannot remove holds and all identity references fit the reader contract', async t => {
  const db = await database(t)
  await db.exec(`insert into public.profiles values ('Acct0001')`)
  await hold(db)
  await db.exec(`delete from public.profiles where account_uid = 'Acct0001'`)
  assert.equal((await db.query('select * from public.member_offboarding_holds')).rows.length, 1)
  await db.exec('set role service_role')
  await hold(db, 'Account_reference-2', 'Event_reference-2', 'Person_reference-2')
  await assert.rejects(hold(db, 'invalid,account', 'Event003'), e => e.code === '23514')
})

test('guard function is not a public RPC or a privileged security-definer', async t => {
  const db = await database(t)
  const { rows: [guard] } = await db.query(`select prosecdef as elevated,
    has_function_privilege('anon', oid, 'EXECUTE') as anonymous,
    has_function_privilege('authenticated', oid, 'EXECUTE') as authenticated,
    has_function_privilege('service_role', oid, 'EXECUTE') as service
    from pg_proc where oid = 'public.guard_member_offboarding_hold_update()'::regprocedure`)
  assert.deepEqual(guard, { elevated:false, anonymous:false, authenticated:false, service:false })
})
