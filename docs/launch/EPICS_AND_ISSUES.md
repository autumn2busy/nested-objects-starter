# Epics & Issues Guide

This guide explains how to structure epics and issues for launch work and how they map to the launch phases and risks defined in `docs/launch/PHASES.md`.

## Phase Alignment
Every epic and issue should map to one or more launch phases:
- **Phase 0 - Readiness & Alignment**: Scope, owners, and pre-launch prerequisites.
- **Phase 1 - Pre-Launch Validation**: QA, route checks, auth, data access, and linting.
- **Phase 2 - Cutover & Verification**: DNS cutover and post-cutover checks.
- **Phase 3 - Stabilization & Retrospective**: Monitoring and post-launch improvements.

When creating issues, include a checkbox or short note indicating the relevant phase(s).

## Label Taxonomy
Use the following labels to make launch work searchable and consistent:

### Type Labels
- `bug`: Something is broken or regressed.
- `enhancement`: A new feature or improvement.
- `epic`: A multi-issue initiative.

### Phase Labels
- `phase-0-readiness`
- `phase-1-prelaunch`
- `phase-2-cutover`
- `phase-3-stabilization`

### Risk Labels
Align risk labels to the risk register in `docs/launch/PHASES.md`:
- `risk-dns-propagation-delay`
- `risk-next-public-site-url`
- `risk-outseta-misconfiguration`
- `risk-supabase-rls-access`
- `risk-stripe-plan-gating`
- `risk-vercel-build-output`

Apply one or more risk labels when an issue mitigates or investigates a known risk.

## Epic Expectations
An epic should:
- Enumerate the phases it covers.
- List the risks it mitigates.
- Include a checklist of child issues or tasks.
- Identify owners and success criteria.

## Issue Expectations
Every issue should include:
- A clear summary and business impact.
- Steps to reproduce (for bugs) or goals (for features).
- The relevant phase label(s).
- Risk labels if applicable.

## PR Checklist
Use this checklist in PRs linked to launch work:
- [ ] Phase(s) referenced in the PR description.
- [ ] Risk(s) referenced if the PR mitigates a known risk.
- [ ] Validation steps or test coverage documented.
- [ ] Rollback or mitigation steps included when touching cutover or auth flows.
- [ ] Stakeholder sign-off captured for phase completion.
