-- Drop the existing constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

-- Add the new constraint with 'founders' included
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_subscription_tier_check
CHECK (subscription_tier IN ('free', 'starter', 'pro', 'elite', 'agency', 'founders'));
