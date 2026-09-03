-- Browser clients never access the private conversion ledger directly.
-- Keep table privileges aligned with the existing service-role-only RLS policy.
REVOKE ALL PRIVILEGES ON TABLE public.conversion_events FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.conversion_events TO service_role;
