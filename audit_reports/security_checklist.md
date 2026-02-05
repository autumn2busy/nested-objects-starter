# Security Audit Task List

- [x] **Infrastructure & Configuration**
    - [x] Review `middleware.ts` for global auth and route protection
    - [x] Check `next.config.js` for security headers
    - [x] Audit Supabase RLS policies in `infra/sql`
    - [x] Check for hardcoded secrets in codebase
    - [x] Review environment variable handling

- [x] **Authentication & Authorization**
    - [x] Verify session handling and token storage
    - [x] Audit plan gating enforcement (client & server)
    - [x] Review redirect logic for open/closed redirects

- [x] **API & Endpoint Security**
    - [x] specific AI endpoint protection (`/api/ai/*`)
    - [x] File upload security
    - [x] Webhook verification logic
    - [x] Rate limiting configuration

- [x] **Dependencies & Vulnerabilities**
    - [x] Run `npm audit`
    - [x] Review `package.json` for known vulnerable packages

- [x] **Reporting**
    - [x] specific `security_audit.md` with findings and threat model
    - [x] Create launch blocking list
