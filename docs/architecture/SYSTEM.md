# System Architecture

## Overview

This platform is a Next.js application that serves public marketing content, member
experiences, and API routes that integrate with third-party services (Outseta, Supabase,
N8N, and external data providers). The system relies on browser sessions, server-side
rendering, and API routes for authenticated operations and backend integrations.

## Mermaid Diagram

```mermaid
flowchart LR
  subgraph Client[Client Boundary]
    Browser[Browser / Web Client]
  end

  subgraph Edge[Next.js App Boundary]
    NextApp[Next.js App Router
(app/layout.tsx + pages)]
    ApiRoutes[API Routes
(app/api/**)]
  end

  subgraph AuthBilling[Outseta Boundary]
    Outseta[Outseta Auth + Billing]
  end

  subgraph Data[Data Boundary]
    Supabase[(Supabase Postgres)]
  end

  subgraph Automation[Automation Boundary]
    N8N[N8N Workflows]
  end

  subgraph External[External Providers]
    WeatherAPI[Weather Provider]
    JobsFeeds[Job Feeds]
  end

  Browser -->|HTTPS| NextApp
  NextApp -->|Set HttpOnly cookie
(outseta_access_token)| Browser

  Browser -->|API calls + auth cookie| ApiRoutes

  ApiRoutes -->|JWT validation
+ profile sync| Outseta
  Outseta -->|Webhook events| ApiRoutes

  ApiRoutes -->|Service role
updates| Supabase
  ApiRoutes -->|Webhook POST| N8N

  ApiRoutes -->|Fetch external data| WeatherAPI
  ApiRoutes -->|Fetch jobs data| JobsFeeds
```

## Trust Boundaries

1. **Client boundary**: The browser is untrusted. Any data from the browser is validated
   in API routes and server components.
2. **Next.js boundary**: Server-rendered components and API routes run in the platform
   environment with access to secrets and service role keys.
3. **Outseta boundary**: Handles authentication, billing, and webhooks. Webhook requests
   must be verified before use.
4. **Supabase boundary**: Stores application data. Service role credentials are sensitive
   and must only be used in server-side routes.
5. **Automation boundary (N8N)**: External automation endpoints receive validated payloads
   from API routes.
6. **External provider boundary**: Weather/jobs feeds are fetched via HTTPS and treated
   as untrusted input until sanitized.

## PII Flows

- **Authentication**: Users authenticate through Outseta; an access token is stored as an
  HttpOnly cookie (`outseta_access_token`) and read by API routes to resolve the current
  user.
- **Profile sync**: Outseta webhooks deliver PII (name, email, phone, subscription
  details). API routes map the payload and store the data in Supabase profile tables.
- **Member APIs**: Routes for member jobs, profiles, and training progress return data
  scoped to authenticated users and their subscription tier.
- **AI Concierge**: User prompts and user identifiers are sent to N8N for processing.
  Prompts should be treated as potentially sensitive user-provided content.
- **Avatar uploads**: Profile avatar endpoints may handle user-uploaded images and must
  enforce size/type validation and storage controls.

## Audit Logging Points

Capture structured logs with request IDs, user IDs (when authenticated), and minimal
PII for the following actions:

- Authentication session creation, validation failures, and logout events.
- Outseta webhook receipt (including signature verification outcome and event type).
- Supabase profile updates triggered by webhooks.
- AI Concierge requests (rate limiting, quota checks, and outbound N8N requests).
- Membership or billing-related API calls (checkout, upgrades, plan entitlements).
- Administrative or bulk data operations (job ingest, firm import, temp migrations).

Log retention should align with compliance requirements and be scrubbed of sensitive
payload fields where feasible.
