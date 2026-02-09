# Security Policy

## Baseline Controls

- **Authentication & sessions**: Use Outseta-backed authentication, store access tokens
  in HttpOnly cookies, and validate tokens server-side before any privileged action.
- **Authorization**: Gate API routes by subscription tier and feature flags. Enforce
  least privilege by default.
- **Input validation**: Validate and sanitize request payloads for all API routes,
  especially webhooks and file uploads.
- **Rate limiting**: Apply per-user rate limits for sensitive or costly endpoints (e.g.,
  AI Concierge, data exports).
- **Secrets management**: Keep secrets in environment variables. Never expose service
  role keys or webhook secrets to the client.
- **Transport security**: Require HTTPS for all external communication; ensure cookies
  are marked `Secure` in production.
- **Logging**: Log security-relevant events (auth failures, webhook verification
  failures, admin actions), while minimizing PII in logs.
- **Dependency hygiene**: Keep dependencies updated and monitor for vulnerabilities.

## Incident Response

1. **Detect & triage**: Confirm scope and severity of the issue. Capture timelines,
   affected systems, and potential data exposure.
2. **Containment**: Disable affected routes, rotate secrets, and revoke compromised
   tokens or sessions.
3. **Eradication**: Patch the root cause, add mitigations (rate limits, validation),
   and review relevant logs.
4. **Recovery**: Restore service, validate security fixes, and monitor for recurrence.
5. **Post-incident review**: Document root cause, impact, remediation, and follow-up
   actions. Share a summary with stakeholders.

## Responsible Disclosure

- **Contact**: Email `security@nestedobjects.com` (or a designated security contact).
- **What to include**: Clear reproduction steps, impact assessment, and any PoC code.
- **Safe harbor**: We support good-faith security research and will not pursue legal
  action against researchers who follow this policy.
- **Response expectations**: We aim to acknowledge reports within 3 business days and
  provide a remediation timeline after triage.
