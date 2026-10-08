-- Member-visible firm recommendation status and attributed reputation evidence.
-- Suppressed firms remain published so members can understand the reason and evidence.

alter table public.firms
  add column if not exists recommendation_status text not null default 'recommended',
  add column if not exists reputation_notice text,
  add column if not exists reputation_sources jsonb not null default '[]'::jsonb,
  add column if not exists reputation_reviewed_at timestamptz;

alter table public.firms
  drop constraint if exists firms_recommendation_status_check;

alter table public.firms
  add constraint firms_recommendation_status_check
  check (recommendation_status in ('recommended', 'under_review', 'suppressed'));

alter table public.firms
  drop constraint if exists firms_reputation_sources_array_check;

alter table public.firms
  add constraint firms_reputation_sources_array_check
  check (jsonb_typeof(reputation_sources) = 'array');

comment on column public.firms.recommendation_status is
  'Nested Objects recommendation posture. Suppressed firms stay visible but are excluded from recommendation and application paths.';

comment on column public.firms.reputation_notice is
  'Neutral member-facing explanation for an under-review or suppressed recommendation status.';

comment on column public.firms.reputation_sources is
  'Attributed evidence objects with publisher, title, URL, date, summary, and verification status.';

create index if not exists firms_recommendation_status_idx
  on public.firms (recommendation_status)
  where is_published = true;

update public.firms
set
  recommendation_status = 'suppressed',
  reputation_notice = 'Recommendation paused while Nested Objects reviews a September 15, 2026 Foreclosurepedia report alleging approximately $40,000 in unpaid balances owed to Puerto Rico technicians and inspectors.',
  reputation_sources = jsonb_build_array(jsonb_build_object(
    'publisher', 'Foreclosurepedia',
    'title', 'Drought, Debt, and Fast Eddie: How 24 Asset Management Bleeds Puerto Rico Dry While HUD Looks Away',
    'url', 'https://foreclosurepedia.org/drought-debt-and-fast-eddie-how-24-asset-management-bleeds-puerto-rico-dry-while-hud-looks-away/',
    'published_at', '2026-09-15',
    'summary', 'The article alleges that Puerto Rico technicians and inspectors are owed approximately $40,000.',
    'verification_status', 'unverified_third_party_report'
  )),
  reputation_reviewed_at = '2026-09-16 12:00:00+00'
where slug = '24-asset-management'
   or lower(trim(name)) = '24 asset management';

update public.firms
set
  recommendation_status = 'suppressed',
  reputation_notice = 'Recommendation paused while Nested Objects reviews a September 15, 2026 Foreclosurepedia report alleging that a contractor remained unpaid for six months after completing work.',
  reputation_sources = jsonb_build_array(jsonb_build_object(
    'publisher', 'Foreclosurepedia',
    'title', 'Evangelo Told Labor His Clients Weren''t Paying Him. Now One of Them Says They Already Paid.',
    'url', 'https://foreclosurepedia.org/evangelo-told-labor-his-clients-werent-paying-him-now-one-of-them-says-they-already-paid/',
    'published_at', '2026-09-15',
    'summary', 'The article alleges that a contractor remained unpaid for six months and reports that a client disputed the firm''s explanation for the delay.',
    'verification_status', 'unverified_third_party_report'
  )),
  reputation_reviewed_at = '2026-09-16 12:00:00+00'
where slug = 'national-mortgage-field-services'
   or lower(trim(name)) = 'national mortgage field services';
