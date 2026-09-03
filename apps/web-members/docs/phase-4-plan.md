# Phase 4: Firms, Monetization & Enterprise Features

> **Superseded on 2026-09-03.** Autumn has deferred this firm-side lane until Nested Objects has a surplus of inspectors. Preserve this as historical planning input; current status and any restart decision live only in `docs/intelligence-os/issue-318-foundation-execution-ledger.md`.

## Overview
Phase 4 transforms the platform from a single-player "Inspector" tool into a multi-player "Firm" management system. This enables business owners to claim their directory listings, manage a team of inspectors, and access premium features (Agency Plan).

## Goals
1.  **Firm Claiming**: Allow verified businesses to take ownership of their generated profile.
2.  **Team Management**: Allow Firms to invite inspectors and centralize billing/management.
3.  **Monetization**: Enforce "Agency" plan limits for Firm features.

## Milestone Plan

### [P0] PR 4.1: Firm Data Model & Claim Flow
-   **Scope**:
    -   Update `firms` table (owner_id, claim_status).
    -   Create `firm_invites` table.
    -   "Claim This Firm" UI on public directory.
-   **Success**:
    -   User can submit a claim request.
    -   Admin can see it in DB.

### [P1] PR 4.2: Firm Dashboard (Enterprise View)
-   **Scope**:
    -   New `app/(portal)/firm` layout.
    -   "Edit Firm Profile" form.
    -   "My Team" list.
-   **Success**:
    -   Claimed firm owners can update their Logo/Bio.

### [P1] PR 4.3: Plan Enforcement
-   **Scope**:
    -   Gate Firm features behind `outseta_plan_id`.
    -   Show "Upgrade to Agency" CTA.

### [P2] PR 4.4: Admin Validation Tool
-   **Scope**:
    -   Internal admin route to approve/reject claims.

## Execution
-   Sequential PRs.
-   Feature Flag `enableFirms` will remain `false` until PR 4.2 is polished.
