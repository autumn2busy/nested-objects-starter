-- Add indexes to speed up firm directory filters, sorting, slug lookups, and search.

CREATE INDEX IF NOT EXISTS firms_is_published_idx
  ON public.firms (is_published);

CREATE INDEX IF NOT EXISTS firms_created_at_idx
  ON public.firms (created_at);

-- Enforce unique slugs for stable firm URLs if data permits.
CREATE UNIQUE INDEX IF NOT EXISTS firms_slug_uidx
  ON public.firms (slug);

-- GIN index for full-text search across key firm descriptors.
CREATE INDEX IF NOT EXISTS firms_search_gin_idx
  ON public.firms
  USING GIN (
    to_tsvector(
      'english',
      concat_ws(' ', name, industry_focus, geographic_coverage)
    )
  );
