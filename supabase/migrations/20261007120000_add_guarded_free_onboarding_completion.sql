-- Operational marker derived by the server from saved profile inputs plus the
-- existing current-cycle income_scenario_completed receipt. This column is not
-- membership, consent, billing, or ActiveCampaign authority.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS
  'Server-derived one-time onboarding marker. Requires saved profile inputs and an exact current-cycle Income Scenarios receipt; never establishes membership or marketing consent.';
