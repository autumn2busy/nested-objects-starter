import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('Directory Pass constraint migration preserves every legacy tier, records and RLS while rejecting unknown tiers', async t => {
  const db = new PGlite()
  t.after(() => db.close())
  await db.exec(`CREATE TABLE public.profiles (id integer PRIMARY KEY, subscription_tier text);
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY fixture_policy ON public.profiles FOR SELECT USING (false);`)
  await db.exec(readFileSync(new URL('../../../supabase/migrations/20260309214152_add_founders_to_subscription_tier.sql', import.meta.url), 'utf8'))
  const tiers = ['free', 'starter', 'pro', 'elite', 'agency', 'founders']
  for (const [index, tier] of tiers.entries()) await db.query('INSERT INTO public.profiles VALUES ($1, $2)', [index, tier])
  const before = (await db.query('SELECT * FROM public.profiles ORDER BY id')).rows
  const migration = readFileSync(new URL('../../../supabase/migrations/20261114151438_add_directory_pass_subscription_tier.sql', import.meta.url), 'utf8')
  await db.exec(migration)
  assert.deepEqual((await db.query('SELECT * FROM public.profiles ORDER BY id')).rows, before)
  await db.query('INSERT INTO public.profiles VALUES (100, $1)', ['directory_pass'])
  await assert.rejects(db.query('INSERT INTO public.profiles VALUES (101, $1)', ['unknown']), e => e.code === '23514')
  assert.equal((await db.query("SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profiles'::regclass")).rows[0].relrowsecurity, true)
  assert.equal((await db.query("SELECT count(*)::integer AS count FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'fixture_policy'")).rows[0].count, 1)
  await db.exec(migration)
  assert.equal((await db.query("SELECT subscription_tier FROM public.profiles WHERE id = 100")).rows[0].subscription_tier, 'directory_pass')
})
