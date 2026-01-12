-- SQL function to increment API usage atomically
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_user_id TEXT,
  p_date DATE,
  p_feature TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO api_usage (user_id, date, ai_resume_calls, concierge_calls, routing_calls)
  VALUES (
    p_user_id,
    p_date,
    CASE WHEN p_feature = 'ai_resume_calls' THEN 1 ELSE 0 END,
    CASE WHEN p_feature = 'concierge_calls' THEN 1 ELSE 0 END,
    CASE WHEN p_feature = 'routing_calls' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    ai_resume_calls = CASE
      WHEN p_feature = 'ai_resume_calls' THEN api_usage.ai_resume_calls + 1
      ELSE api_usage.ai_resume_calls
    END,
    concierge_calls = CASE
      WHEN p_feature = 'concierge_calls' THEN api_usage.concierge_calls + 1
      ELSE api_usage.concierge_calls
    END,
    routing_calls = CASE
      WHEN p_feature = 'routing_calls' THEN api_usage.routing_calls + 1
      ELSE api_usage.routing_calls
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
