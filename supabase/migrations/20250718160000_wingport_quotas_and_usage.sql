-- Wingport per-user quota and usage metering.
-- Stripe-for-AI primitives: founders meter AI spend per user.

-- Quotas per user. Windows roll over each minute and each day.
CREATE TABLE IF NOT EXISTS public.wingport_quotas (
  user_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'free',
  minute_limit INTEGER NOT NULL DEFAULT 10,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  used_minute INTEGER NOT NULL DEFAULT 0,
  used_day INTEGER NOT NULL DEFAULT 0,
  minute_window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', now()),
  day_window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('day', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Token-level usage log for every generate/stream call.
CREATE TABLE IF NOT EXISTS public.wingport_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'error', 'interrupted')),
  model TEXT,
  provider TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for dashboard/billing queries.
CREATE INDEX IF NOT EXISTS idx_wingport_usage_user_id ON public.wingport_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_wingport_usage_created_at ON public.wingport_usage (created_at);

-- Row-level security: users can only read their own rows.
ALTER TABLE public.wingport_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wingport_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wingport_quotas_select_own ON public.wingport_quotas;
CREATE POLICY wingport_quotas_select_own
  ON public.wingport_quotas
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS wingport_usage_select_own ON public.wingport_usage;
CREATE POLICY wingport_usage_select_own
  ON public.wingport_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Service role bypasses RLS automatically; anon has no access.

-- Tier defaults. Kept in a function so limits are easy to change centrally.
CREATE OR REPLACE FUNCTION public.wingport_tier_limits(p_tier TEXT)
RETURNS TABLE (minute_limit INTEGER, daily_limit INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN p_tier = 'enterprise' THEN 1000
      WHEN p_tier = 'pro' THEN 100
      ELSE 10
    END,
    CASE
      WHEN p_tier = 'enterprise' THEN 100000
      WHEN p_tier = 'pro' THEN 10000
      ELSE 100
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atomically check, roll over minute/day windows, and consume one request.
-- The INSERT ... ON CONFLICT ensures the row exists with the right window,
-- then the UPDATE increments only if the user is still under the limit.
-- Because both statements touch the same primary-key row, concurrent calls
-- serialize on the row lock, so a burst cannot overshoot the limit.
CREATE OR REPLACE FUNCTION public.wingport_check_and_use_quota(
  p_user_id TEXT,
  p_tier TEXT DEFAULT 'free',
  p_input_tokens INTEGER DEFAULT 0,
  p_output_tokens INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_minute TIMESTAMPTZ := date_trunc('minute', v_now);
  v_day TIMESTAMPTZ := date_trunc('day', v_now);
  v_minute_limit INTEGER;
  v_daily_limit INTEGER;
  v_allowed BOOLEAN := false;
  v_retry_after INTEGER := 0;
  v_used_minute INTEGER;
  v_used_day INTEGER;
BEGIN
  SELECT l.minute_limit, l.daily_limit
  INTO v_minute_limit, v_daily_limit
  FROM public.wingport_tier_limits(p_tier) l;

  INSERT INTO public.wingport_quotas (
    user_id, tier, minute_limit, daily_limit, used_minute, used_day,
    minute_window_start, day_window_start
  )
  VALUES (p_user_id, p_tier, v_minute_limit, v_daily_limit, 0, 0, v_minute, v_day)
  ON CONFLICT (user_id) DO UPDATE SET
    tier = EXCLUDED.tier,
    minute_limit = EXCLUDED.minute_limit,
    daily_limit = EXCLUDED.daily_limit,
    used_minute = CASE
      WHEN public.wingport_quotas.minute_window_start = EXCLUDED.minute_window_start
      THEN public.wingport_quotas.used_minute
      ELSE 0
    END,
    used_day = CASE
      WHEN public.wingport_quotas.day_window_start = EXCLUDED.day_window_start
      THEN public.wingport_quotas.used_day
      ELSE 0
    END,
    minute_window_start = EXCLUDED.minute_window_start,
    day_window_start = EXCLUDED.day_window_start,
    updated_at = v_now;

  UPDATE public.wingport_quotas
  SET used_minute = used_minute + 1,
      used_day = used_day + 1,
      updated_at = v_now
  WHERE user_id = p_user_id
    AND used_minute < minute_limit
    AND used_day < daily_limit
  RETURNING used_minute, used_day INTO v_used_minute, v_used_day;

  IF FOUND THEN
    v_allowed := true;
  ELSE
    -- Pull current usage to decide which window is exhausted.
    SELECT used_minute, used_day, minute_limit, daily_limit
    INTO v_used_minute, v_used_day, v_minute_limit, v_daily_limit
    FROM public.wingport_quotas
    WHERE user_id = p_user_id;

    IF v_used_day >= v_daily_limit THEN
      v_retry_after := GREATEST(0, EXTRACT(EPOCH FROM (v_day + INTERVAL '1 day' - v_now))::INTEGER) + 1;
    ELSE
      v_retry_after := GREATEST(0, EXTRACT(EPOCH FROM (v_minute + INTERVAL '1 minute' - v_now))::INTEGER) + 1;
    END IF;
  END IF;

  RETURN json_build_object(
    'allowed', v_allowed,
    'retry_after', v_retry_after,
    'limit_minute', v_minute_limit,
    'limit_day', v_daily_limit,
    'used_minute', v_used_minute,
    'used_day', v_used_day,
    'remaining_minute', GREATEST(0, v_minute_limit - v_used_minute),
    'remaining_day', GREATEST(0, v_daily_limit - v_used_day)
  );
END;
$$ LANGUAGE plpgsql;

-- Record usage after a generate/stream call completes.
CREATE OR REPLACE FUNCTION public.wingport_record_usage(
  p_user_id TEXT,
  p_status TEXT,
  p_model TEXT,
  p_provider TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_total_tokens INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.wingport_usage (
    user_id, status, model, provider, input_tokens, output_tokens, total_tokens
  )
  VALUES (p_user_id, p_status, p_model, p_provider, p_input_tokens, p_output_tokens, p_total_tokens);
END;
$$ LANGUAGE plpgsql;

-- Get current quota for GET /v1/quota.
CREATE OR REPLACE FUNCTION public.wingport_get_quota(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_row public.wingport_quotas%ROWTYPE;
  v_minute_limit INTEGER;
  v_daily_limit INTEGER;
BEGIN
  SELECT * INTO v_row FROM public.wingport_quotas WHERE user_id = p_user_id;

  IF FOUND THEN
    RETURN json_build_object(
      'user_id', v_row.user_id,
      'tier', v_row.tier,
      'limit_minute', v_row.minute_limit,
      'limit_day', v_row.daily_limit,
      'used_minute', v_row.used_minute,
      'used_day', v_row.used_day,
      'remaining_minute', GREATEST(0, v_row.minute_limit - v_row.used_minute),
      'remaining_day', GREATEST(0, v_row.daily_limit - v_row.used_day)
    );
  END IF;

  -- No row yet: return the tier defaults.
  SELECT l.minute_limit, l.daily_limit INTO v_minute_limit, v_daily_limit
  FROM public.wingport_tier_limits('free') l;

  RETURN json_build_object(
    'user_id', p_user_id,
    'tier', 'free',
    'limit_minute', v_minute_limit,
    'limit_day', v_daily_limit,
    'used_minute', 0,
    'used_day', 0,
    'remaining_minute', v_minute_limit,
    'remaining_day', v_daily_limit
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute on the functions to the roles Supabase uses.
GRANT EXECUTE ON FUNCTION public.wingport_check_and_use_quota(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wingport_record_usage(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.wingport_get_quota(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wingport_tier_limits(TEXT) TO anon, authenticated, service_role;
