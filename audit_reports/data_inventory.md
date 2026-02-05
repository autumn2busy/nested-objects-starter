# Data Inventory & Collection Audit

## 1. Data Collection Points

| Source | Data Collected | Purpose | Storage Location |
| :--- | :--- | :--- | :--- |
| **Outseta (Script)** | Email, Name, Phone, IP Address, User Agent, Referer, Subscription Data, Login timestamps | Authentication, Billing, CRM, Analytics | Outseta Servers (Primary), Supabase (Synced) |
| **Supabase (Webhook)** | Full copy of Outseta Profile (including IP/UA), Plan details, Billing terms | User Profile Management, Access Control | `profiles` table in Supabase |
| **Supabase (Direct)** | Application state, Saved Jobs, Firm interactions | Core Application Functionality | `jobs`, `firms`, etc. |
| **Browser Cookies** | `outseta_jwt`, `outseta_user` (approx names), Session tokens | Session Management, Auth State | User's Browser (LocalStorage/Cookies) |
| **AI Tools** | User inputs (Resumes, Job descriptions) | Processing for AI features | Likely Transient (sent to AI provider) or Local State |

## 2. Third-Party Processors

| Processor | Role | Integration Method | Data Shared |
| :--- | :--- | :--- | :--- |
| **Outseta** | Auth, Payments, CRM, Email | Client-side Script (`cdn.outseta.com`) | Full PII, Activity Logs, Billing Info |
| **Supabase** | Database, Backend-as-a-Service | `@supabase/supabase-js`, Webhooks | Synced User Profiles, App Data |
| **Stripe** | Payment Processing | via Outseta (Backend) | Credit Card info (tokenized), Billing Address |
| **ActiveCampaign** | Email Marketing | via Outseta (Native Integration) | Email, Name, Subscription Status |

## 3. Data Retention & Deletion

*   **Retention**: Data is retained indefinitely in Supabase `profiles` table even after cancellation, unless explicitly deleted. `outseta_data` column stores a snapshot of the Outseta record.
*   **Deletion**: No automated "Right to be Forgotten" self-service. Deletion requires manual intervention in both Outseta and Supabase.

## 4. Tracking & Cookies

*   **Scripts**: Outseta script `cdn.outseta.com` is loaded globally in `layout.tsx`.
*   **Scope**: Tracks `auth`, `profile`, `emailList` interactions.
*   **Consent**: **MISSING**. No mechanism to block scripts before consent.
