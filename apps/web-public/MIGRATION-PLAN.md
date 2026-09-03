# nestedobjects.com Migration Plan

> **Superseded for current implementation status on 2026-09-03.** Preserve this as historical domain-migration evidence. Current SEO, deployment, and conversion work lives only in `docs/intelligence-os/issue-318-foundation-execution-ledger.md`.
## GoDaddy → Vercel (Zero SEO Drop)

---

## Current State
- **nestedobjects.com** → GoDaddy Website Builder (~6 pages, low index count)
- **members.nestedobjects.com** → Vercel (Next.js member hub)
- Google has indexed: homepage, about page, possibly 1-2 others
- Domain authority is low but exists — we want to preserve it

---

## Phase 1: Deploy to Vercel on Preview URL (Do This Now)

### Step 1: Create a NEW Vercel project
1. Go to vercel.com → "Add New Project"
2. Import the **same GitHub repo** (nested-objects-starter)
3. In the project settings, set:
   - **Root Directory**: leave empty (monorepo root)
   - **Build Command**: `cd apps/web-public && npm run build`
   - **Output Directory**: `apps/web-public/.next`
   - **Install Command**: `npm install && cd apps/web-public && npm install`
   - **Framework**: Next.js
4. Name the project: `nested-objects-public` (or similar)
5. Deploy — you'll get a preview URL like `nested-objects-public.vercel.app`

### Step 2: Configure Ignored Build Step
So that pushes to `apps/web-members/` don't trigger rebuilds of the public site:
1. In the public project → Settings → Git → Ignored Build Step
2. Set to: `git diff --quiet HEAD^ HEAD -- apps/web-public/`
3. Do the same for the members project:
   - `git diff --quiet HEAD^ HEAD -- apps/web-members/`

### Step 3: Test the preview URL
- Verify homepage loads
- Verify `/guides` loads and lists all 3 guides
- Verify each guide page renders correctly
- Verify 301 redirects work (`/job-directory-1` → `/hiring-firms`, etc.)

---

## Phase 2: Wire the Domain (When Preview Looks Good)

### Step 4: Add domain to Vercel
1. In the public Vercel project → Settings → Domains
2. Add `nestedobjects.com`
3. Add `www.nestedobjects.com` (redirect to apex)
4. Vercel will show you the DNS records you need

### Step 5: Update DNS at GoDaddy
**Option A: Change nameservers to Vercel (recommended)**
1. GoDaddy → Domain Settings → Nameservers → Change to Custom
2. Set nameservers to Vercel's (they'll provide these)
3. This gives Vercel full DNS control including automatic SSL

**Option B: Keep GoDaddy DNS, add records**
1. Add an A record: `@` → `76.76.21.21`
2. Add a CNAME: `www` → `cname.vercel-dns.com`
3. IMPORTANT: Verify `members` CNAME still points to Vercel for the member hub

### Step 6: Verify members subdomain still works
- `members.nestedobjects.com` must still resolve to its own Vercel project
- If using Option A (Vercel nameservers), add the CNAME in Vercel DNS dashboard
- If using Option B (GoDaddy DNS), the existing CNAME should still work

### Step 7: SSL will auto-provision
Vercel handles SSL automatically. Give it 5-10 minutes after DNS propagation.

---

## Phase 3: Post-Migration SEO Checklist

### Step 8: Submit new sitemap to Google
1. Go to Google Search Console
2. If `nestedobjects.com` is already verified, submit `https://nestedobjects.com/sitemap.xml`
3. If not verified, verify ownership via DNS TXT record
4. Request indexing for key pages:
   - `/`
   - `/guides`
   - `/guides/how-to-become-a-field-inspector`
   - `/guides/property-preservation-pay-rates`
   - `/guides/mortgage-field-services-explained`

### Step 9: Verify 301 redirects
Test each old URL resolves to the new equivalent:
```
nestedobjects.com/job-directory-1  → /hiring-firms (301)
nestedobjects.com/about-us         → /about (301)
nestedobjects.com/qualifications   → /about (301)
nestedobjects.com/services         → /about (301)
nestedobjects.com/news             → /guides (301)
```

### Step 10: Update external links
- Update link in members.nestedobjects.com that points to nestedobjects.com
- Update any social profiles (LinkedIn, Twitter, etc.)
- Update Google Business Profile if you have one

---

## 301 Redirect Map

| Old URL (GoDaddy) | New URL (Vercel) | Status |
|---|---|---|
| `/` | `/` | Homepage replaced |
| `/job-directory-1` | `members.nestedobjects.com/hiring-firms` | 301 redirect |
| `/about-us` | `/about` | 301 redirect |
| `/qualifications` | `/about` | 301 redirect |
| `/services` | `/about` | 301 redirect |
| `/news` | `/guides` | 301 redirect |
| `/contact` | `/contact` | Same path, new content |

---

## Domain Architecture (Final State)

```
nestedobjects.com          → Public marketing site (Vercel: web-public)
                              Homepage, guides, pricing, about, contact
                              SEO content lives here

members.nestedobjects.com  → Member hub (Vercel: web-members)
                              Auth, directory, training, AI tools, profile
                              Gated content lives here

firms.nestedobjects.com    → B2B portal (future)
                              Firm dashboards, analytics, job posting
```

---

## Timeline
- **Today**: Push `apps/web-public` to GitHub, create Vercel project, test preview URL
- **This week**: Polish any issues on preview, verify redirects
- **When ready**: Point DNS from GoDaddy → Vercel (5 min of downtime max)
- **Same day**: Submit sitemap to Google Search Console
- **Week after**: Monitor Google Search Console for index status and any crawl errors
