# Compliance Checklist

## General Privacy
- [ ] **Privacy Policy Link**: Ensure it is visible in the Footer interacting with the Outseta embed.
- [ ] **Cookie Banner**: **CRITICAL**. Must implement a banner that prevents `outseta-loader` script from running until "Accept" is clicked.
- [ ] **Contact Info**: Verify `support@nestedobjects.com` is monitored for privacy requests.

## GDPR (European Economic Area)
- [ ] **Legal Basis**: Define "Legitimate Interest" or "Contract" for collecting IP/UA data in Supabase.
- [ ] **Cookie Consent**: Implement "Prior Consent" (Zero-cookie load until opt-in).
- [ ] **Data Processing Agreement (DPA)**: Ensure signed DPAs with Outseta and Supabase.
- [ ] **Cross-Border Transfer**: Privacy Policy should mention data is processed in the US.

## CCPA / CPRA (California)
- [ ] **Notice at Collection**: explicit list of categories collected (Identifiers, Internet Activity).
- [ ] **Opt-Out Link**: "Do Not Sell or Share My Personal Information" link in footer (even if it just leads to a policy explaining you don't sell).
- [ ] **Sensitive Data**: You collect "Account Logins" (via Outseta). Ensure strict security (already handled by Outseta).

## AI Compliance
- [ ] **Disclaimer**: Add "AI can make mistakes. Verify important info." near AI inputs (Resume Builder).
- [ ] **Transparency**: Explicitly state that user data (resumes) is processed by an AI provider (OpenAI/Anthropic via Outseta or other API).
