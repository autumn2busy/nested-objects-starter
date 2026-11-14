-- Directory Pass is a distinct nonrecurring product, not legacy Starter.
-- This changes only allowed projection values; existing members and policies are unchanged.
BEGIN;
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'starter', 'pro', 'elite', 'agency', 'founders', 'directory_pass'));
COMMIT;
