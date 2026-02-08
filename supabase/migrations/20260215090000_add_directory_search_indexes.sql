-- Additional indexes to speed up directory search and pagination.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS firms_published_created_at_idx
  ON public.firms (is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS firms_name_trgm_idx
  ON public.firms USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS firms_industry_focus_trgm_idx
  ON public.firms USING GIN (industry_focus gin_trgm_ops);

CREATE INDEX IF NOT EXISTS firms_geographic_coverage_trgm_idx
  ON public.firms USING GIN (geographic_coverage gin_trgm_ops);
