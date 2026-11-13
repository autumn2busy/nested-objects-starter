import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
const migration=fs.readFileSync(new URL('../../../supabase/migrations/20261103170434_firm_customer_profiles.sql',import.meta.url),'utf8')
const profile={legalName:'Fixture Firm',displayName:'Fixture',website:'https://example.test',address:'',primaryContactName:'Fixture Contact',primaryContactEmail:'fixture@example.test',serviceZips:['30301'],inspectionTypes:['Occupancy'],requirements:'Exterior only'}
const db=new PGlite()
await db.exec('create role anon; create role authenticated; create role service_role bypassrls;')
await db.exec(migration)
const read=(account,person,primary)=>db.query('select public.read_firm_customer_profile($1,$2,$3) as result',[account,person,primary]).then(x=>x.rows[0].result)
const save=(account,person,revision,value=profile,primary=true)=>db.query('select public.save_firm_customer_profile($1,$2,$3,$4,$5::jsonb) as result',[account,person,primary,revision,JSON.stringify(value)]).then(x=>x.rows[0].result)
test('private profile persistence, tenant isolation, revocation and audit privileges',async t=>{
  await t.test('anonymous and authenticated cannot read, write or execute tenant functions',async()=>{
    for(const role of ['anon','authenticated']) {
      await db.exec('set role '+role)
      for(const table of ['firm_customer_accounts','firm_customer_memberships','firm_customer_profile_events']) await assert.rejects(db.query('select * from public.'+table),/permission denied/)
      await assert.rejects(read('account1','person01',true),/permission denied/)
      await assert.rejects(save('account1','person01',0),/permission denied/)
      await db.exec('reset role')
    }
  })
  await t.test('first owner save binds one tenant and reloads the same operational profile',async()=>{
    await db.exec('set role service_role')
    assert.deepEqual(await read('account1','person01',true),{profile:null,canEdit:true})
    const first=await save('account1','person01',0)
    assert.equal(first.profile.revision,1)
    assert.equal(first.profile.legalName,'Fixture Firm')
    assert.equal(first.profile.pilotStage,'profile_pending')
    assert.deepEqual(await read('account1','person01',true),first)
    await assert.rejects(db.query('select * from public.firm_customer_accounts'),/permission denied/)
    await assert.rejects(db.query('delete from public.firm_customer_profile_events'),/permission denied/)
  })
  await t.test('same save is idempotent; stale revision cannot overwrite; audit is atomic',async()=>{
    assert.equal((await save('account1','person01',1)).profile.revision,1)
    await assert.rejects(save('account1','person01',0,{...profile,displayName:'Changed'}),/reload before saving/)
    assert.equal((await save('account1','person01',1,{...profile,displayName:'Changed'})).profile.revision,2)
    await db.exec('reset role')
    assert.equal((await db.query('select count(*)::int as n from public.firm_customer_profile_events')).rows[0].n,2)
    await db.exec('set role service_role')
  })
  await t.test('staff read-only, unknown staff and cross-tenant actors are denied',async()=>{
    await assert.rejects(save('account2','staff001',0,profile,false),/access denied/)
    await save('account2','person02',0,{...profile,displayName:'Other firm'})
    await assert.rejects(read('account2','person01',false),/access denied/)
    await assert.rejects(save('account2','person01',1),/membership review required/)
    await db.exec('reset role')
    await db.exec("insert into public.firm_customer_memberships(firm_id,outseta_person_uid,member_role) select id,'staff001','staff' from public.firm_customer_accounts where outseta_account_uid='account1'")
    await db.exec('set role service_role')
    assert.equal((await read('account1','staff001',false)).canEdit,false)
    await assert.rejects(save('account1','staff001',2,profile,false),/access denied/)
  })
  await t.test('revoked membership and suspended tenant never self-reactivate',async()=>{
    await db.exec('reset role')
    await db.exec("update public.firm_customer_memberships set membership_state='revoked' where outseta_person_uid='person01'")
    await db.exec('set role service_role')
    await assert.rejects(read('account1','person01',true),/access denied/)
    await assert.rejects(save('account1','person01',2),/access denied/)
    await db.exec('reset role')
    await db.exec("update public.firm_customer_accounts set lifecycle_state='suspended' where outseta_account_uid='account2'")
    await db.exec('set role service_role')
    await assert.rejects(read('account2','person02',true),/access denied/)
    await assert.rejects(save('account2','person02',1),/access denied/)
  })
  await t.test('SQL also rejects forged fields and invalid profile values without partial inserts',async()=>{
    for(const value of [{...profile,pilotStage:'pilot_active'},{...profile,legalName:''},{...profile,serviceZips:['bad']},{...profile,inspectionTypes:[null]}]) await assert.rejects(save('account3','person03',0,value),/Invalid profile/)
    await db.exec('reset role')
    assert.equal((await db.query("select count(*)::int as n from public.firm_customer_accounts where outseta_account_uid='account3'")).rows[0].n,0)
  })
  await t.test('two initial saves cannot create duplicate company, membership or audit rows',async()=>{
    await db.exec('set role service_role')
    const results=await Promise.allSettled([save('account4','person04',0),save('account4','person04',0)])
    assert.equal(results.filter(result=>result.status==='fulfilled').length,1)
    assert.equal(results.filter(result=>result.status==='rejected').length,1)
    await db.exec('reset role')
    const counts=(await db.query("select (select count(*)::int from public.firm_customer_accounts where outseta_account_uid='account4') as companies,(select count(*)::int from public.firm_customer_memberships m join public.firm_customer_accounts a on a.id=m.firm_id where a.outseta_account_uid='account4') as members,(select count(*)::int from public.firm_customer_profile_events e join public.firm_customer_accounts a on a.id=e.firm_id where a.outseta_account_uid='account4') as events")).rows[0]
    assert.deepEqual(counts,{companies:1,members:1,events:1})
  })
})
test.after(async()=>db.close())
