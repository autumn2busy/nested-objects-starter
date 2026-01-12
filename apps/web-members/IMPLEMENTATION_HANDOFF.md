# Handoff Implementation Plan
**Date:** 2026-01-12
**Context:** Fixing "Outseta Profile Widget Loops & Logout Persistence"

## Recent Changes
I have addressed two critical bugs in the member portal:

1.  **Infinite Redirect Loop on Profile Page**
    *   **Issue:** The native Outseta profile widget's "Back" button was triggering a redirect to the dashboard, which then redirected back to the profile if the query params were sticky or if state wasn't cleared, creating a loop.
    *   **Fix:** Replaced the native `Outseta.profile.open()` modal with a custom-built **embedded overlay** in `apps/web-members/app/(portal)/profile/page.tsx`.
    *   **Mechanism:**
        *   We now toggle a local `activeTab` state (`profile` | `billing`).
        *   When active, we render a fixed-position `<div>` overlay.
        *   Inside, we mount the `OutsetaProfileWidget` component (which uses `Outseta.c.parse`).
        *   This gives us full control over the close button/navigation, preventing the "Back" loop.

2.  **Logout Persistence (Zombie Session)**
    *   **Issue:** Users remained logged in after clicking "Logout" because Outseta's local storage items weren't being fully cleared.
    *   **Fix:** Enhanced the `logout` function in `apps/web-members/components/auth-provider.tsx`.
    *   **Mechanism:**
        *   Explicitly calls `Outseta.auth.logout()`.
        *   Sets `Outseta.setAccessToken(null)`.
        *   Clears the cookie.
        *   **Aggressively iterates** through all `localStorage` and `sessionStorage` keys to delete anything containing "outseta".
        *   Forces a full `window.location.href = '/'` reload.

3.  **Build Fixes**
    *   **Issue:** The build failed because `refreshUser` was used in `ProfilePage` but not defined in `AuthContextValue`.
    *   **Fix:** Updated `auth-provider.tsx` to expose `refreshUser` in the context and added the implementation to fully re-fetch the JWT payload from Outseta.

## Current State
*   All code changes are committed and pushed to `main` (latest commit ends in `91baecd`).
*   A Vercel build has been triggered by the push.

## Next Steps for the Next Agent

1.  **Verify Vercel Build:**
    *   Check for the deployment status. If it fails again, check the logs for any remaining type errors.

2.  **Verify Fixes (User Acceptance Testing):**
    *   **Profile Overlay:** Go to `/profile`, click "Edit Profile". Ensure it opens in the *new custom overlay* (white box with an X in the top right), NOT the native Outseta slide-over or center modal. Verify you can edit and save.
    *   **Logout:** Click "Logout". Ensure you are taken to the home page and the "Login" button reappears. Refresh the page to make sure you stay logged out.

3.  **Clean Up:**
    *   If verification passes, you can remove `apps/web-members/IMPLEMENTATION_HANDOFF.md` (this file).

## Affected Files
*   `apps/web-members/app/(portal)/profile/page.tsx`
*   `apps/web-members/components/auth-provider.tsx`
