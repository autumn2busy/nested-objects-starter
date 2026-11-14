import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('real PostgreSQL receipt migration protects identity, leases, uncertainty, refunds and roles', async t => {
  const db = new PGlite(); t.after(() => db.close())
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon, authenticated, service_role;')
  await db.exec(readFileSync(new URL('../../../supabase/migrations/20261114182130_ac_pass_payment_sync_receipts.sql', import.meta.url), 'utf8'))
  const identity = { accountUid: 'Account1', acContactId: '123', acCustomerId: '456', capturedMinor: 19900, currency: 'USD',
    externalId: 'outseta-pass-invoice-Invoice1', paidAt: '2026-11-14T18:00:00Z', personUid: 'Person01', planUid: 'PassPlan',
    stripeAccountId: 'acct_fixture', stripeChargeId: 'ch_fixture', subscriptionUid: 'Subscr01' }
  const claim = async (refund = 0, i = identity) => (await db.query('select public.claim_ac_pass_order_sync($1,$2,$3,$4) as receipt', ['4', 'Invoice1', i, refund])).rows[0].receipt
  for (const role of ['anon', 'authenticated']) {
    await db.exec('set role ' + role)
    await assert.rejects(db.query('select * from public.ac_pass_payment_sync_receipts'), e => e.code === '42501')
    await assert.rejects(claim(), e => e.code === '42501')
    await assert.rejects(db.query("insert into public.ac_nonrecurring_identity_intents values ('4','Person01','Account1','customer',now())"), e => e.code === '42501')
    await db.exec('reset role')
  }
  await db.exec('set role service_role')
  for (const i of [null, { ...identity, currency: null }, { ...identity, acContactId: null }, { ...identity, extra: true }]) await assert.rejects(claim(0, i))
  const a = await claim(); assert.equal(a.writeStarted, false)
  assert.equal(await claim(), null)
  await assert.rejects(db.query('select public.finish_ac_pass_order_sync($1,$2,$3,$4,$5)', [a.token, 'verified', 'unsafe', '99', 0]))
  await db.query('select public.mark_ac_pass_order_write($1)', [a.token])
  await db.query('select public.finish_ac_pass_order_sync($1,$2,$3)', [a.token, 'uncertain', 'write_unknown'])
  const b = await claim(); assert.equal(b.writeStarted, true); assert.equal(b.orderId, null)
  await db.query('select public.finish_ac_pass_order_sync($1,$2,$3,$4,$5)', [b.token, 'verified', 'readback_verified', '99', 0])
  const c = await claim(5000); assert.equal(c.orderId, '99'); assert.equal(c.refundedMinor, 0)
  await assert.rejects(db.query('select public.finish_ac_pass_order_sync($1,$2,$3,$4,$5)', [c.token, 'verified', 'bad_order', '100', 5000]))
  await assert.rejects(db.query('select public.finish_ac_pass_order_sync($1,$2,$3,$4,$5)', [c.token, 'verified', 'bad_refund', '99', 0]))
  await db.query('select public.finish_ac_pass_order_sync($1,$2,$3,$4,$5)', [c.token, 'verified', 'refund_verified', '99', 5000])
  await assert.rejects(claim(0))
  await assert.rejects(claim(5000, { ...identity, accountUid: 'Other001' }))
  const d = await claim(19900)
  await db.query("update public.ac_pass_payment_sync_receipts set lease_until=now()-interval '1 minute'")
  await assert.rejects(db.query('select public.mark_ac_pass_order_write($1)', [d.token]))
  const e = await claim(19900); assert.notEqual(d.token, e.token)
  await assert.rejects(db.query('select public.finish_ac_pass_order_sync($1,$2,$3)', [d.token, 'blocked', 'expired']))
  await db.query('select public.finish_ac_pass_order_sync($1,$2,$3,$4,$5)', [e.token, 'verified', 'full_refund_verified', '99', 19900])
  const saved = (await db.query('select * from public.ac_pass_payment_sync_receipts')).rows[0]
  assert.equal(Number(saved.refunded_minor), 19900); assert.equal(saved.ac_order_id, '99'); assert.equal(saved.state, 'verified')
  await db.query("insert into public.ac_nonrecurring_identity_intents(connection_id,person_uid,account_uid,kind) values ('4','Person01','Account1','customer')")
  await assert.rejects(db.query("insert into public.ac_nonrecurring_identity_intents(connection_id,person_uid,account_uid,kind) values ('4','Person01','Account1','customer')"), e => e.code === '23505')
  await assert.rejects(db.query('delete from public.ac_nonrecurring_identity_intents'), e => e.code === '42501')
})
