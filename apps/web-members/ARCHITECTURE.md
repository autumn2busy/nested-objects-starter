# System Architecture Overview

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js App                           │   │
│  │                                                           │   │
│  │  ┌─────────────┐    ┌──────────────┐   ┌─────────────┐ │   │
│  │  │  layout.tsx │───>│ Outseta      │   │ AuthProvider│ │   │
│  │  │  (loads     │    │ Script       │──>│ Context     │ │   │
│  │  │  script)    │    │ (cdn)        │   │             │ │   │
│  │  └─────────────┘    └──────────────┘   └──────┬──────┘ │   │
│  │                                                 │        │   │
│  │                                                 v        │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              Page Components                     │   │   │
│  │  │                                                   │   │   │
│  │  │  /directory/page.tsx                             │   │   │
│  │  │  └─> <Gate feature="directory_access">          │   │   │
│  │  │                                                   │   │   │
│  │  │  /ai_chatbot/page.tsx (when built)               │   │   │
│  │  │  └─> <Gate feature="ai_chatbot">                 │   │   │
│  │  └───────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬───────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    v               v               v
        ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
        │    Outseta       │  │  Next.js API │  │   Supabase   │
        │                  │  │   Routes     │  │   Database   │
        │  - Auth/Login    │  │              │  │              │
        │  - Plans/Billing │  │  /api/*      │  │  - firms     │
        │  - JWT Tokens    │  │  (server)    │  │  - jobs      │
        │  - Webhooks      │  │              │  │  - resources │
        └──────────────────┘  └──────────────┘  └──────────────┘
```

---

## Component Interaction Flow

### 1. Initial Page Load
```
User visits /directory
    │
    ├─> layout.tsx renders
    │   └─> Loads Outseta script from CDN
    │   └─> Wraps app in <AuthProvider>
    │
    ├─> AuthProvider initializes
    │   └─> Checks for Outseta.getUser()
    │   └─> Sets user state
    │   └─> Listens for token changes
    │
    └─> directory/page.tsx renders
        └─> <Gate feature="directory_access"> checks
            │
            ├─> If no user → Show login prompt
            │
            ├─> If user but no access → Show upgrade CTA
            │
            └─> If user has access → Fetch firms from Supabase
```

### 2. User Signs Up
```
User clicks "Sign Up"
    │
    ├─> AuthProvider calls login()
    │   └─> Outseta.auth.open({ mode: 'register' })
    │
    ├─> Outseta modal opens
    │   └─> User fills form
    │   └─> Selects plan (Starter/Pro/Elite/Agency)
    │   └─> Submits payment (if paid plan)
    │
    ├─> Outseta creates account
    │   └─> Generates JWT token
    │   └─> Redirects to Post Login URL with token
    │
    ├─> /auth/callback receives token
    │   └─> Stores in cookie: outseta_access_token
    │   └─> Calls Outseta.setAccessToken()
    │   └─> Redirects to /directory
    │
    └─> AuthProvider detects token change
        └─> Updates user state
        └─> Updates planUid
        └─> Page re-renders with access
```

### 3. Feature Access Check (Client-Side)
```
<Gate feature="ai_chatbot"> renders
    │
    ├─> useAuth() hook retrieves:
    │   - user (from JWT)
    │   - planUid (from JWT)
    │   - hasAccess() function
    │
    ├─> hasAccess('ai_chatbot') checks:
    │   │
    │   ├─> FEATURE_ACCESS['ai_chatbot'] = [PRO, ELITE, AGENCY]
    │   │
    │   └─> planUid === 'rQVqlLm6' (Pro)? → TRUE
    │       planUid === 'L9nbKV9Z' (Starter)? → FALSE
    │
    ├─> If FALSE:
    │   └─> Render upgrade CTA
    │
    └─> If TRUE:
        └─> Render children (feature content)
```

### 4. Feature Access Check (Server-Side)
```
API route receives request
    │
    ├─> requireFeature('directory_access') called
    │
    ├─> getCurrentUser() reads cookie
    │   └─> Gets 'outseta_access_token'
    │
    ├─> verifyOutsetaToken(token)
    │   └─> jwt.decode() extracts payload
    │   └─> Checks expiration
    │   └─> Verifies issuer
    │
    ├─> hasAccess(planUid, 'directory_access')
    │   └─> Checks FEATURE_ACCESS mapping
    │
    ├─> If FALSE:
    │   └─> throw Error('Access denied')
    │
    └─> If TRUE:
        └─> Return user data
        └─> API proceeds with logic
```

---

## Data Flow: JWT Token

### JWT Token Contents (Example)
```json
{
  "email": "[email protected]",
  "name": "Test User",
  "given_name": "Test",
  "family_name": "User",
  "sub": "abc123xyz",
  "outseta:accountUid": "def456",
  "outseta:subscriptionUid": "ghi789",
  "outseta:planUid": "rQVqlLm6",     // ← This is what we check!
  "outseta:addOnUids": [],
  "exp": 1735689600,
  "iss": "nested-objects.outseta.com",
  "aud": "nested-objects.outseta.com"
}
```

### How planUid Maps to Access
```
Plan UID: rQVqlLm6 (Pro)
    │
    ├─> Check FEATURE_ACCESS mapping
    │
    ├─> directory_access: [STARTER, PRO, ELITE, AGENCY]
    │   └─> PRO included → ✅ ACCESS GRANTED
    │
    ├─> ai_chatbot: [PRO, ELITE, AGENCY]
    │   └─> PRO included → ✅ ACCESS GRANTED
    │
    ├─> priority_support: [ELITE, AGENCY]
    │   └─> PRO not included → ❌ ACCESS DENIED
    │
    └─> white_label: [AGENCY]
        └─> PRO not included → ❌ ACCESS DENIED
```

---

## File Responsibility Matrix

| File | Responsibility | Runs On |
|------|---------------|---------|
| `layout.tsx` | Load Outseta script, wrap in AuthProvider | Server + Client |
| `auth-provider.tsx` | Manage auth state, expose hooks | Client |
| `gate.tsx` | Component-level access control | Client |
| `auth-server.ts` | JWT verification, server-side gates | Server |
| `auth/callback/page.tsx` | Handle post-login redirect | Client |
| `upgrade/page.tsx` | Show pricing, handle upgrades | Client |
| `feature-gate.ts` | Legacy helper (wraps auth-server) | Server |

---

## Environment Variable Usage

### Client-Side (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_OUTSETA_DOMAIN
    └─> Used in: layout.tsx (Outseta script config)
    └─> Used in: auth-provider.tsx (for validation)
    └─> Safe to expose in browser

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
    └─> Used in: Supabase client initialization
    └─> Protected by RLS policies
```

### Server-Side (No NEXT_PUBLIC_*)
```
OUTSETA_API_KEY
OUTSETA_API_SECRET
    └─> Used in: API routes for Outseta API calls
    └─> NEVER exposed to browser

SUPABASE_SERVICE_ROLE_KEY
    └─> Used in: Server-side Supabase queries
    └─> Bypasses RLS (use carefully)
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Outseta URL Protection (Client-Side)               │
│  ├─> Redirects based on content groups                       │
│  ├─> Can be bypassed if JS disabled                          │
│  └─> Good for UX, not for security                           │
│                                                               │
│  Layer 2: React Gate Component (Client-Side)                 │
│  ├─> Shows/hides UI elements                                 │
│  ├─> Checks JWT claims                                       │
│  └─> Can be bypassed by modifying JS                         │
│                                                               │
│  Layer 3: API Route Verification (Server-Side) ✅            │
│  ├─> Verifies JWT on every request                           │
│  ├─> Checks planUid against feature map                      │
│  └─> Cannot be bypassed                                      │
│                                                               │
│  Layer 4: Supabase RLS (Database-Level) ✅                   │
│  ├─> PostgreSQL row-level security                           │
│  ├─> Enforced at DB level                                    │
│  └─> Cannot be bypassed                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle:** 
- Layers 1-2 = UX optimization
- Layers 3-4 = Real security
- Never trust client-side gates alone!

---

## Integration Points

### Outseta ↔ Next.js
```
Outseta provides:
  - JWT tokens (via login)
  - User/account data
  - Plan/subscription info
  - Webhook events

Next.js consumes:
  - JWT for auth state
  - planUid for feature gating
  - User data for personalization
```

### Next.js ↔ Supabase
```
Next.js provides:
  - Queries via Supabase client
  - User context (eventually via JWT)

Supabase provides:
  - Firm directory data
  - Jobs data
  - Resources data
  - RLS protection
```

### Future: Outseta JWT → Supabase RLS
```
Phase 2 Goal:
  Pass Outseta JWT to Supabase
    └─> Supabase RLS reads JWT claims
    └─> Row-level filtering by planUid
    └─> Single source of truth for auth

Implementation:
  1. Create custom Supabase client
  2. Pass Outseta token in headers
  3. Update RLS policies to verify Outseta JWT
  4. Remove service role usage
```

---

## State Management Flow

```
Application State Tree:

┌─ AuthProvider (Context)
│   ├─ user: OutsetaUser | null
│   ├─ planUid: string | null
│   ├─ isLoading: boolean
│   ├─ isAuthenticated: boolean
│   └─ hasAccess: (feature: string) => boolean
│
├─ Page Components
│   ├─ directory/page.tsx
│   │   └─ firms: Firm[] (local state)
│   │
│   └─ upgrade/page.tsx
│       └─ plans: Plan[] (constant)
│
└─ Gate Components
    └─ Inherit auth state via useAuth() hook
```

---

## Error Handling Strategy

```
Error Type → Handler → User Experience

JWT Expired
    └─> AuthProvider detects
    └─> Clears user state
    └─> Shows login prompt

JWT Invalid
    └─> auth-server.ts returns null
    └─> API returns 401
    └─> Client shows error message

No Access (wrong plan)
    └─> Gate component detects
    └─> Shows upgrade CTA
    └─> Links to /upgrade

Supabase Query Fails
    └─> Try/catch in component
    └─> Show error message
    └─> Allow retry

Outseta Script Fails to Load
    └─> AuthProvider timeout
    └─> Shows static login link
    └─> Fallback to manual redirect
```

---

## Performance Considerations

### Optimizations in Place:
1. **Lazy JWT Verification** - Only verify on protected routes
2. **Cookie Storage** - Persists across page loads
3. **Context Caching** - Auth state shared across components
4. **Static Rendering** - Public pages pre-rendered

### Future Optimizations:
1. **Token Refresh** - Auto-refresh before expiry
2. **Service Worker** - Cache static assets
3. **Edge Functions** - JWT verify at edge (Vercel Edge)
4. **Request Deduplication** - Share auth checks

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Next.js)                      │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Static Pages (Pre-rendered)                       │  │
│  │  - Home page                                       │  │
│  │  - Upgrade page                                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Dynamic Pages (SSR)                               │  │
│  │  - Directory (protected)                           │  │
│  │  - Auth callback                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  API Routes (Serverless Functions)                 │  │
│  │  - /api/agents/concierge                           │  │
│  │  - /api/agents/job-intel                           │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        v                   v                   v
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Outseta    │    │   Supabase   │    │     CDN      │
│              │    │              │    │              │
│  Auth/Billing│    │   Database   │    │  Static      │
│  JWT Tokens  │    │   pgvector   │    │  Assets      │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

**This architecture supports:**
- ✅ Scalable auth flow
- ✅ Secure server-side verification
- ✅ Fast client-side UX
- ✅ Clear separation of concerns
- ✅ Easy to extend with new features