-- Cost Control Database Schema
-- Implements caching, rate limiting, and usage tracking

-- Weather cache (1-hour TTL)
CREATE TABLE IF NOT EXISTS weather_cache (
  location_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_cache_expires ON weather_cache(expires_at);

-- Distance cache for routing (infinite TTL - distances don't change)
CREATE TABLE IF NOT EXISTS distance_cache (
  from_key TEXT NOT NULL,
  to_key TEXT NOT NULL,
  distance_miles DECIMAL NOT NULL,
  duration_mins INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (from_key, to_key)
);

-- AI output cache for resume builder
CREATE TABLE IF NOT EXISTS resume_ai_cache (
  user_id TEXT NOT NULL,
  profile_hash TEXT NOT NULL,
  outputs JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, profile_hash)
);

CREATE INDEX idx_resume_ai_cache_user ON resume_ai_cache(user_id);

-- API usage tracking for rate limiting
CREATE TABLE IF NOT EXISTS api_usage (
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  ai_resume_calls INT DEFAULT 0,
  concierge_calls INT DEFAULT 0,
  routing_calls INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX idx_api_usage_user_date ON api_usage(user_id, date);

-- Saved locations for weather tool
CREATE TABLE IF NOT EXISTS saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_locations_user ON saved_locations(user_id);

-- Saved routes
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routes_user ON routes(user_id);

-- Route stops
CREATE TABLE IF NOT EXISTS route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  stop_order INT NOT NULL,
  vendor TEXT,
  due_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_route_stops_route ON route_stops(route_id);

-- Function to clean up expired weather cache
CREATE OR REPLACE FUNCTION cleanup_weather_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM weather_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE weather_cache IS 'Caches weather forecasts for 1 hour to minimize API calls';
COMMENT ON TABLE distance_cache IS 'Caches distances between lat/lon pairs indefinitely';
COMMENT ON TABLE resume_ai_cache IS 'Caches AI-generated resume outputs to avoid redundant OpenAI calls';
COMMENT ON TABLE api_usage IS 'Tracks daily API usage per user for rate limiting';
