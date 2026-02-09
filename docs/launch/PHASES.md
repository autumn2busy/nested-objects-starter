# Launch Phases

## Phase 0 - Readiness & Alignment
**Goal:** Confirm the production launch scope, owners, and prerequisites for the `apps/web-members` Next.js app.

**Key outputs**
- Launch checklist with owners.
- Risk register with mitigations.
- Confirmed production environment configuration in Vercel.

### Checklist
- [ ] Review current stack details (Next.js App Router, Vercel, Supabase, Outseta, Stripe, OpenAI relay) for dependencies and handoffs.
- [ ] Confirm production domains and ownership for DNS cutover.
- [ ] Verify environment variables in Vercel, including `NEXT_PUBLIC_SITE_URL`.
- [ ] Validate that `vercel.json` build settings match current deployment expectations.

**Owners**
- Product/Program: Launch PM
- Engineering: Web Lead
- Platform/Infra: DevOps Lead
- Security: Security Lead

**Definition of Done (DoD)**
- Launch plan reviewed and approved by owners.
- DNS cutover plan and rollback steps confirmed.
- Environment variable inventory verified.

---

## Phase 1 - Pre-Launch Validation
**Goal:** Validate production readiness for the `apps/web-members` stack before DNS cutover.

### Checklist
- [ ] Validate app routes: marketing (`/`), directory (`/directory`), dashboard (`/dashboard`), tools (`/tools`).
- [ ] Confirm Outseta login redirect paths and access denied settings are correct.
- [ ] Confirm Supabase data access for directory queries.
- [ ] Confirm Stripe test/production key mapping and plan gating behavior.
- [ ] Run `npm run lint` to ensure no baseline lint issues.

**Owners**
- QA: QA Lead
- Engineering: Web Lead
- Data: Data/Backend Lead

**DoD**
- QA sign-off and issue list closed or approved for deferral.
- Monitoring/alerts configured for production endpoints.

---

## Phase 2 - Cutover & Verification
**Goal:** Execute DNS cutover and verify production stability.

### Checklist
- [ ] Freeze production changes during the cutover window.
- [ ] Update DNS according to the cutover runbook.
- [ ] Validate `NEXT_PUBLIC_SITE_URL` points to the production domain.
- [ ] Execute post-cutover verification checks and log results.

**Owners**
- Platform/Infra: DevOps Lead
- Engineering: Web Lead
- Support: Support Lead

**DoD**
- All verification checks pass.
- Stakeholders notified of successful cutover.

---

## Phase 3 - Stabilization & Retrospective
**Goal:** Monitor and improve after launch.

### Checklist
- [ ] Monitor errors, performance, and auth/sign-in funnel.
- [ ] Review feature gating and subscription upgrades.
- [ ] Conduct post-launch retro and document follow-up tasks.

**Owners**
- Engineering: Web Lead
- Product/Program: Launch PM
- Support: Support Lead

**DoD**
- Retro notes published with action items and owners.
- Monitoring dashboards updated with real-world data.

---

## Risk Register
| Risk | Impact | Likelihood | Mitigation | Owner |
| --- | --- | --- | --- | --- |
| DNS propagation delay causes split traffic | High | Medium | Schedule cutover during low-traffic window; set low TTL ahead of time | DevOps Lead |
| Incorrect `NEXT_PUBLIC_SITE_URL` causes auth redirect issues | High | Medium | Verify env var before cutover and re-check post-cutover | Web Lead |
| Outseta misconfiguration blocks logins | High | Medium | Validate Post Login/Access Denied URLs pre-cutover | Web Lead |
| Supabase RLS or data access fails | Medium | Medium | Pre-cutover test queries and monitor errors post-cutover | Data/Backend Lead |
| Stripe plan gating mismatch | Medium | Low | Pre-cutover upgrade flow test; validate plan IDs | Web Lead |
| Vercel build output mismatch | Medium | Low | Confirm `vercel.json` output directory is correct | DevOps Lead |
