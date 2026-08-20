-- First-party conversion telemetry for the Free -> Paid member funnel.
-- Browser clients never access this table directly. All writes and dashboard reads
-- go through service-role server routes.

CREATE TABLE IF NOT EXISTS public.conversion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_event_id TEXT UNIQUE,
    event_name TEXT NOT NULL,
    anonymous_id TEXT,
    session_id TEXT,
    member_uid TEXT,
    member_email TEXT,
    plan_uid TEXT,
    plan_name TEXT,
    source_page TEXT,
    source TEXT,
    reason TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT conversion_events_event_name_length CHECK (char_length(event_name) BETWEEN 1 AND 80),
    CONSTRAINT conversion_events_event_data_is_object CHECK (jsonb_typeof(event_data) = 'object')
);

CREATE INDEX IF NOT EXISTS conversion_events_occurred_at_idx
    ON public.conversion_events (occurred_at DESC);

CREATE INDEX IF NOT EXISTS conversion_events_event_name_occurred_at_idx
    ON public.conversion_events (event_name, occurred_at DESC);

CREATE INDEX IF NOT EXISTS conversion_events_member_uid_idx
    ON public.conversion_events (member_uid, occurred_at DESC)
    WHERE member_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS conversion_events_member_email_idx
    ON public.conversion_events (lower(member_email), occurred_at DESC)
    WHERE member_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS conversion_events_anonymous_id_idx
    ON public.conversion_events (anonymous_id, occurred_at DESC)
    WHERE anonymous_id IS NOT NULL;

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage conversion events" ON public.conversion_events;
CREATE POLICY "Service role can manage conversion events"
ON public.conversion_events
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.conversion_events IS
    'Private first-party product events used to measure and recover Free-to-Paid conversion drop-off.';
