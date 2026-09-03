# AGENTS Guidelines for This Repository

This repository contains a Next.js application located in the root of this repository. When
working on the project interactively with an agent (e.g. the Codex CLI) please follow
the guidelines below so that the development experience – in particular Hot Module
Replacement (HMR) – continues to work smoothly.

## 1. Use the Development Server, **not** `npm run build`

* **Always use `npm run dev` (or `pnpm dev`, `yarn dev`, etc.)** while iterating on the
  application.  This starts Next.js in development mode with hot-reload enabled.
* **Do _not_ run `npm run build` inside the agent session.**  Running the production
  build command switches the `.next` folder to production assets which disables hot
  reload and can leave the development server in an inconsistent state.  If a
  production build is required, do it outside of the interactive agent workflow.

## 2. Keep Dependencies in Sync

If you add or update dependencies remember to:

1. Update the appropriate lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`).
2. Re-start the development server so that Next.js picks up the changes.

## 3. Coding Conventions

* Prefer TypeScript (`.tsx`/`.ts`) for new components and utilities.
* Co-locate component-specific styles in the same folder as the component when
  practical.

## 4. Useful Commands Recap

| Command            | Purpose                                            |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Start the Next.js dev server with HMR.             |
| `npm run lint`     | Run ESLint checks.                                 |
| `npm run test`     | Execute the test suite (if present).               |
| `npm run build`    | **Production build – _do not run during agent sessions_** |

## 5. Canonical Nested Objects Implementation Ledger

The single implementation plan, status ledger, decision record, and handoff for the Nested Objects improvement program is:

`docs/intelligence-os/issue-318-foundation-execution-ledger.md`

This rule applies to every Codex task that touches any of the following:

- `apps/agent-runtime/**`;
- member lifecycle, pricing, tools, opportunities, SEO/AEO/CRO, admin, directory access, profile access, or entitlements in `apps/web-members/**`;
- public positioning, landing pages, SEO/AEO/CRO, analytics, or conversion surfaces in `apps/web-public/**`;
- firm-product, firm-directory, or firm-acquisition work in `apps/web-firms/**`, including work that changes the current deferral boundary;
- `supabase/**`;
- database/privacy operations in `infra/sql/**` and messaging/opportunity artifacts in `email-templates/**`;
- operational scripts, monitors, ActiveCampaign integrations, Vercel workflows, or GitHub workflows;
- `docs/intelligence-os/**` or GitHub Issue #318.

Before changing an in-scope area, the task must:

1. Read the canonical ledger.
2. State the stable ledger task IDs it owns.
3. Verify and record the current branch, `HEAD`, and base SHA.
4. Check for staged, unstaged, and untracked work and preserve unrelated active-branch ownership.

Before finishing an in-scope change, the task must:

1. Update the owned ledger rows in the same pull request as the implementation.
2. Add exact repository, migration, test, commit, pull-request, and environment evidence that actually exists.
3. Use only the ledger's allowed status values and never infer completion from a filename, registration, interface, placeholder, pull-request title, merge, or deployment alone.
4. Avoid rewriting rows owned by unrelated active branches.
5. Reconcile ledger merge conflicts from evidence; never choose one side blindly.
6. Preserve append-only decision, migration, deployment, incident, and blocker history.
7. Never create another competing roadmap, implementation plan, status ledger, progress report, or handoff. Scope-specific evidence documents may remain historical inputs, but current status belongs only in the canonical ledger.
8. Include the canonical-ledger validation check and pull-request checklist results in the pull request.

If an in-scope pull request cannot update the ledger safely because another active branch owns the same rows, mark the conflict explicitly and coordinate the row update before merge. Code presence alone is never sufficient evidence for `validated_staging`, `verified_preview`, or `production_live`.

---

Following these practices ensures that the agent-assisted development workflow stays
fast and dependable.  When in doubt, restart the dev server rather than running the
production build.
