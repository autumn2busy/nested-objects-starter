import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { PGlite } = require('@electric-sql/pglite')
const migration = readFileSync(new URL(
  '../../../supabase/migrations/20260904183000_create_contact_submissions_server_only.sql',
  import.meta.url,
), 'utf8')
const historicalMigration = readFileSync(new URL(
  '../../../supabase/migrations/20260326000000_create_contact_submissions.sql',
  import.meta.url,
), 'utf8')
const USER_ID = '00000000-0000-4000-8000-000000000001'
const PROFILE_ID = '00000000-0000-4000-8000-000000000002'
const RECEIPT_ID = '00000000-0000-4000-8000-000000000003'
const receipt = {
  name: 'Synthetic contact fixture',
  email: 'receipt@example.invalid',
  topic: 'General question',
  message: 'Synthetic receipt content for isolated database tests.',
}

async function database(t, { historical = false } = {}) {
  const db = new PGlite()
  t.after(() => db.close())
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create table public.profiles (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('test.subject', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as
      $$ select current_user::text $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
  `)
  if (historical) await db.exec(historicalMigration)
  return db
}

async function insertReceipt(db, overrides = {}) {
  const row = { ...receipt, ...overrides }
  return db.query(`
    insert into public.contact_submissions (name, email, topic, message)
    values ($1, $2, $3, $4)
    returning *
  `, [row.name, row.email, row.topic, row.message])
}

async function seedHistoricalReceipt(db) {
  await db.query('insert into auth.users (id) values ($1)', [USER_ID])
  await db.query('insert into public.profiles (id) values ($1)', [PROFILE_ID])
  await db.query(`
    insert into public.contact_submissions
      (id, user_id, profile_id, name, email, topic, message, created_at, updated_at)
    values ($1, $2, $3, $4, $5, $6, $7, '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z')
  `, [RECEIPT_ID, USER_ID, PROFILE_ID, receipt.name, receipt.email, receipt.topic, receipt.message])
}

async function asRole(db, role, run) {
  assert.ok(['anon', 'authenticated', 'service_role'].includes(role))
  await db.exec(`set role ${role}`)
  try {
    return await run()
  } finally {
    await db.exec('reset role')
  }
}

async function schemaSnapshot(db) {
  const queries = {
    columns: `select attname, attnotnull, pg_get_expr(d.adbin, d.adrelid) as default_value
      from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
      where a.attrelid = 'public.contact_submissions'::regclass and a.attnum > 0 and not a.attisdropped
      order by a.attnum`,
    constraints: `select conname, pg_get_constraintdef(oid) as definition from pg_constraint
      where conrelid = 'public.contact_submissions'::regclass order by conname`,
    triggers: `select tgname, pg_get_triggerdef(oid) as definition from pg_trigger
      where tgrelid = 'public.contact_submissions'::regclass and not tgisinternal order by tgname`,
    policies: `select policyname, roles, cmd, qual, with_check from pg_policies
      where schemaname = 'public' and tablename = 'contact_submissions' order by policyname`,
    grants: `select grantee, privilege_type from information_schema.role_table_grants
      where table_schema = 'public' and table_name = 'contact_submissions' order by grantee, privilege_type`,
    relation: `select relrowsecurity, obj_description(oid) as comment from pg_class
      where oid = 'public.contact_submissions'::regclass`,
    indexes: `select indexname, indexdef from pg_indexes
      where schemaname = 'public' and tablename = 'contact_submissions' order by indexname`,
    rows: 'select * from public.contact_submissions order by id',
  }
  const result = {}
  for (const [key, sql] of Object.entries(queries)) result[key] = (await db.query(sql)).rows
  return result
}

test('fresh migration creates a server-writable receipt with generated ID and timestamps', async t => {
  const db = await database(t)
  await db.exec(migration)
  await asRole(db, 'service_role', async () => {
    const { rows: [stored] } = await insertReceipt(db)
    assert.match(stored.id, /^[0-9a-f-]{36}$/)
    assert.equal(stored.user_id, null)
    assert.equal(stored.profile_id, null)
    assert.ok(stored.created_at instanceof Date)
    assert.ok(stored.updated_at instanceof Date)
    assert.equal((await db.query('select count(*)::integer as count from public.contact_submissions')).rows[0].count, 1)
  })
  const { rows: columns } = await db.query(`
    select column_name, is_nullable, column_default from information_schema.columns
    where table_schema = 'public' and table_name = 'contact_submissions'
      and column_name in ('created_at', 'updated_at') order by column_name
  `)
  assert.equal(columns.length, 2)
  for (const column of columns) {
    assert.equal(column.is_nullable, 'NO')
    assert.equal(column.column_default, 'now()')
  }
})

test('real historical migration upgrades without changing receipts and reruns identically', async t => {
  const db = await database(t, { historical: true })
  await seedHistoricalReceipt(db)
  const before = (await db.query('select * from public.contact_submissions')).rows
  await db.exec(migration)
  assert.deepEqual((await db.query('select * from public.contact_submissions')).rows, before)
  const upgraded = await schemaSnapshot(db)
  assert.deepEqual(upgraded.policies.map(policy => policy.policyname), ['contact_submissions_service_role_all'])
  assert.deepEqual(upgraded.policies[0].roles, ['service_role'])
  assert.deepEqual(upgraded.triggers.map(trigger => trigger.tgname), ['set_contact_submissions_updated_at'])
  await db.exec(migration)
  assert.deepEqual(await schemaSnapshot(db), upgraded)
})

test('upgrade normalizes historical timestamp defaults and both foreign keys preserve receipts on deletion', async t => {
  const db = await database(t, { historical: true })
  await seedHistoricalReceipt(db)
  await db.exec('alter table public.contact_submissions alter column created_at drop default, alter column updated_at drop default')
  await db.exec(migration)
  const { rows: keys } = await db.query(`
    select conname, confdeltype from pg_constraint where
      conrelid = 'public.contact_submissions'::regclass and contype = 'f' order by conname
  `)
  assert.equal(keys.length, 2)
  assert.ok(keys.every(key => key.confdeltype === 'n'))
  await db.query('delete from auth.users where id = $1', [USER_ID])
  await db.query('delete from public.profiles where id = $1', [PROFILE_ID])
  const { rows: [stored] } = await db.query('select * from public.contact_submissions where id = $1', [RECEIPT_ID])
  assert.equal(stored.user_id, null)
  assert.equal(stored.profile_id, null)
  assert.equal(stored.message, receipt.message)
  await asRole(db, 'service_role', async () => {
    const { rows: [next] } = await insertReceipt(db)
    assert.ok(next.created_at instanceof Date)
    assert.ok(next.updated_at instanceof Date)
  })
})

test('scoped update trigger works and leaves the shared function and unrelated table trigger intact', async t => {
  const db = await database(t, { historical: true })
  await seedHistoricalReceipt(db)
  await db.exec(`
    create table public.unrelated_fixture (id integer primary key, updated_at timestamptz);
    create trigger unrelated_updated before update on public.unrelated_fixture
      for each row execute function public.handle_updated_at();
    insert into public.unrelated_fixture values (1, '2026-01-01T00:00:00Z');
  `)
  const functionSql = "select pg_get_functiondef('public.handle_updated_at()'::regprocedure) as definition"
  const beforeFunction = (await db.query(functionSql)).rows
  await db.exec(migration)
  assert.deepEqual((await db.query(functionSql)).rows, beforeFunction)
  await asRole(db, 'service_role', async () => {
    const result = await db.query(`update public.contact_submissions set topic = 'Billing question'
      where id = $1 returning updated_at`, [RECEIPT_ID])
    assert.ok(result.rows[0].updated_at > new Date('2026-01-02T00:00:00Z'))
    assert.equal((await db.query('delete from public.contact_submissions where id = $1 returning id', [RECEIPT_ID])).rows.length, 1)
  })
  await db.exec('update public.unrelated_fixture set id = id where id = 1')
  assert.ok((await db.query('select updated_at from public.unrelated_fixture')).rows[0].updated_at > new Date('2026-01-01T00:00:00Z'))
  assert.equal((await db.query(`select count(*)::integer as count from pg_trigger
    where tgrelid = 'public.unrelated_fixture'::regclass and not tgisinternal`)).rows[0].count, 1)
})

test('database enforces text bounds and rejects explicit null timestamps', async t => {
  const db = await database(t)
  await db.exec(migration)
  await asRole(db, 'service_role', async () => {
    for (const [field, min, max] of [['name', 1, 120], ['email', 3, 254], ['topic', 1, 120], ['message', 1, 5000]]) {
      await insertReceipt(db, { [field]: 'x'.repeat(min) })
      await insertReceipt(db, { [field]: 'x'.repeat(max) })
      for (const length of [min - 1, max + 1]) {
        await assert.rejects(insertReceipt(db, { [field]: 'x'.repeat(length) }), { code: '23514' })
      }
      await assert.rejects(insertReceipt(db, { [field]: null }), { code: '23502' })
    }
    for (const field of ['created_at', 'updated_at']) {
      await assert.rejects(db.query(`insert into public.contact_submissions
        (name, email, topic, message, ${field}) values ($1, $2, $3, $4, null)`, Object.values(receipt)), { code: '23502' })
    }
  })
})

test('browser roles lose historical table grants and cannot directly read, insert, update, or delete', async t => {
  const db = await database(t, { historical: true })
  await seedHistoricalReceipt(db)
  await db.exec('grant all on public.contact_submissions to public, anon, authenticated')
  await db.exec(migration)
  await db.query("select set_config('test.subject', $1, false)", [USER_ID])
  for (const role of ['anon', 'authenticated']) {
    await asRole(db, role, async () => {
      await assert.rejects(db.query('select * from public.contact_submissions'), { code: '42501' })
      await assert.rejects(insertReceipt(db), { code: '42501' })
      await assert.rejects(db.query("update public.contact_submissions set name = 'Unwanted change'"), { code: '42501' })
      await assert.rejects(db.query('delete from public.contact_submissions'), { code: '42501' })
    })
  }
  assert.equal((await db.query('select name from public.contact_submissions')).rows[0].name, receipt.name)
})

test('RLS still protects a matching historical member if broad browser grants are accidentally restored', async t => {
  const db = await database(t, { historical: true })
  await seedHistoricalReceipt(db)
  await db.exec(migration)
  await db.exec('grant select, insert, update, delete on public.contact_submissions to public, anon, authenticated')
  await db.query("select set_config('test.subject', $1, false)", [USER_ID])
  for (const role of ['anon', 'authenticated']) {
    await asRole(db, role, async () => {
      assert.deepEqual((await db.query('select * from public.contact_submissions')).rows, [])
      await assert.rejects(insertReceipt(db), { code: '42501' })
      assert.deepEqual((await db.query("update public.contact_submissions set name = 'Unwanted change' returning id")).rows, [])
      assert.deepEqual((await db.query('delete from public.contact_submissions returning id')).rows, [])
    })
  }
  assert.equal((await db.query('select name from public.contact_submissions')).rows[0].name, receipt.name)
})

test('invalid historical rows abort with a generic error and roll back all schema and record changes', async t => {
  const db = await database(t, { historical: true })
  await seedHistoricalReceipt(db)
  for (const change of [
    'created_at = null',
    'updated_at = null',
    "name = repeat('x', 121)",
    "email = 'xx'",
    "topic = repeat('x', 121)",
    "message = repeat('x', 5001)",
  ]) {
    await db.exec('alter table public.contact_submissions disable trigger on_contact_submissions_updated')
    await db.exec(`update public.contact_submissions set
      name = 'Synthetic contact fixture', email = 'receipt@example.invalid',
      topic = 'General question', message = 'SYNTHETIC_PRIVATE_CONTENT_MARKER',
      created_at = '2026-01-01T00:00:00Z', updated_at = '2026-01-02T00:00:00Z'`)
    await db.exec(`update public.contact_submissions set ${change}`)
    await db.exec('alter table public.contact_submissions enable trigger on_contact_submissions_updated')
    const before = await schemaSnapshot(db)
    await assert.rejects(db.exec(migration), error => {
      assert.equal(error.code, 'P0001')
      assert.equal(error.message, 'Contact receipt migration refused: existing rows need private compatibility review.')
      const errorText = [error.message, error.detail, error.hint].join(' ')
      for (const privateValue of [receipt.email, receipt.name, 'SYNTHETIC_PRIVATE_CONTENT_MARKER']) {
        assert.equal(errorText.includes(privateValue), false)
      }
      return true
    })
    await db.exec('rollback')
    assert.deepEqual(await schemaSnapshot(db), before)
  }
})

test('unexpected existing policy requires review and rolls back known-policy removals and other changes', async t => {
  const db = await database(t, { historical: true })
  await seedHistoricalReceipt(db)
  await db.exec('create policy unrelated_contact_policy on public.contact_submissions for select to authenticated using (true)')
  const before = await schemaSnapshot(db)
  await assert.rejects(db.exec(migration), {
    code: 'P0001',
    message: 'Contact receipt migration refused: unexpected policies need private review.',
  })
  await db.exec('rollback')
  assert.deepEqual(await schemaSnapshot(db), before)
})
