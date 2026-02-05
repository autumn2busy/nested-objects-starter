# Launch Week SEO Checklist
**Phase**: Pre-Launch to Day 7

## 🛑 Pre-Launch (Do this now)

### Technical Verification
- [ ] **Critical**: Add `apps/web-members/public/robots.txt` (See Technical Report).
- [ ] **Critical**: Verify `process.env.NEXT_PUBLIC_SITE_URL` matches production domain (`https://members.nestedobjects.com`).
- [ ] **Sitemap**: Ensure `sitemap.xml` is accessible locally (`npm run dev` -> navigate to `localhost:3000/sitemap.xml`).
- [ ] **Metadata**: Click through top 5 pages; hover over browser tab to verify title is not "Untitled" or "Just Site Name".

### Content Readiness
- [ ] **Homepage**: Update Title Tag to include "Field Inspector Directory" (See Content Plan P1).
- [ ] **Legal**: Ensure `Privacy Policy` and `Terms` are accessible (Google requires these for valid business verification).
- [ ] **404 Page**: Test a random URL (e.g. `/random-page`) and ensure a custom 404 page loads, not a generic Vercel error.

---

## 🚀 Launch Day (The Button Push)

### Search Console & Analytics
- [ ] **GSC**: Create Property in Google Search Console for the production domain.
- [ ] **Verification**: Add the TXT record to DNS *or* ensure the GTM container is live.
- [ ] **Sitemap**: Submit `https://members.nestedobjects.com/sitemap.xml` to GSC immediately.
- [ ] **Indexing**: Use "URL Inspection" tool in GSC to "Request Indexing" for the Homepage.

### Social Signal
- [ ] **Social Profiles**: Update BIO links on Twitter/LinkedIn to point to the new domain.
- [ ] **Announce**: Post on LinkedIn with the specific phrase "New Field Inspector Directory...".

---

## 📈 Post-Launch (Days 1-7)

### Monitoring
- [ ] **Day 1**: Check GSC "Coverage" report for 5xx server errors.
- [ ] **Day 3**: Search `site:members.nestedobjects.com` in Google to see what is indexed.
- [ ] **Day 7**: Check "Performance" tab in GSC for initial queries.

### Content Velocity
- [ ] **Start**: Publish the first "How-to" guide from the Content Plan (P3).
- [ ] **Outreach**: Email 5 friendly firms and ask them to verify their profile (generates traffic + signals).

---

## ⚠️ Common Pitfalls to Avoid
1.  **Leaving `noindex` on**: Check `layout.tsx` for any accidental `<meta name="robots" content="noindex" />`.
2.  **Broken Links**: Run a tool like "Broken Link Checker" extension before announcing.
3.  **Slow Images**: Run PageSpeed Insights. If Hero image is slow, convert to WebP/AVIF.
