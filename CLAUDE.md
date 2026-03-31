# Nested Objects — Members App

## Project role
Membership platform for field inspectors, notaries, and property preservation contractors.
Next.js 14 (App Router) + Supabase + Outseta + Stripe + ActiveCampaign.
Deployed to Vercel.

## Architecture
- **Auth:** Outseta JWT verified via JWKS (lib/auth-server.ts)
- **Database:** Supabase (Postgres + pgvector)
- **Payments:** Outseta (primary) + Stripe (Pro checkout)
- **Email:** ActiveCampaign (deep data sync, automations)
- **AI:** n8n webhook relay to concierge (lib/ai-quota.ts for limits)
- **Rate limiting:** Upstash Redis with in-memory fallback
- **Jobs:** Adzuna API synced daily via Vercel cron

## Plan tiers (lib/plan-config.ts)
FREE → STARTER (hidden) → FOUNDERS ($37/yr legacy) → PRO ($49/mo) → ELITE ($97/mo) → AGENCY ($297/mo)

## Critical rules
- NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client
- NEVER commit data dumps, JSON exports, or temp files (see .gitignore)
- NEVER commit files containing member PII
- Use `createServiceRoleClient()` only in server-side API routes
- Always check plan tier for feature access, not just authentication
- Package manager: npm
- Use `npm run dev` during development, NEVER `npm run build` in agent sessions

## Two apps in this repo
- **apps/web-members** — main product (members.nestedobjects.com)
- **apps/web-public** — marketing site (nestedobjects.com)

---

## Development Standards

### Plan First
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Write detailed specs upfront to reduce ambiguity

### Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- One task per subagent for focused execution

### Self-Improvement Loop
- After ANY correction from the user: update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- Review lessons at session start for relevant project

### Verification Before Done
- Never mark a task complete without proving it works
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- Skip this for simple, obvious fixes — don't over-engineer

### Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests then resolve them

## Task Management
1. Write plan to tasks/todo.md with checkable items
2. Check in before starting implementation
3. Mark items complete as you go
4. High-level summary at each step
5. Add review section to tasks/todo.md
6. Update tasks/lessons.md after corrections

## Core Principles
- **Simplicity First:** Make every change as simple as possible. Impact minimal code.
- **No Laziness:** Find root causes. No temporary fixes. Senior developer standards.
- Prefer TypeScript (.tsx/.ts) for new components and utilities.

---

## Change Logging

After completing any task that modifies files, create or append to:
`C:/Users/Mother/Vault/command-center/00-Inbox/changelog-nested-objects.md`

Format each entry as:

```
### YYYY-MM-DD — [brief title]
**Files changed:**
- path/to/file.ts — what changed and why

**Decisions made:**
- any choices or tradeoffs

**Notes:**
- anything the owner should know

---
```

Always append to the end of the file. Never overwrite previous entries.