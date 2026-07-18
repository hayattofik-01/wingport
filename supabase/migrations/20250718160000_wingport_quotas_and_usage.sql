-- Wingport v0.1 quota and usage metering.
-- See DEVIN.md §3.3 — schema is verbatim.

-- Usage log: one row per completed (or failed/interrupted) request.
create table wingport_usage (
  id            bigint generated always as identity primary key,
  user_id       uuid not null,
  model_alias   text not null,
  provider_used text not null,
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  total_tokens  int generated always as (input_tokens + output_tokens) stored,
  status        text not null,
  duration_ms   int,
  created_at    timestamptz not null default now()
);

create index on wingport_usage (user_id, created_at);

-- Quota state: one row per user, updated atomically.
create table wingport_quota_state (
  user_id       uuid primary key,
  day           date not null,
  requests_used int not null default 0,
  tokens_used   int not null default 0,
  minute_bucket timestamptz,
  minute_count  int not null default 0
);

-- Row-level security: users can read their own rows only.
alter table wingport_usage enable row level security;
alter table wingport_quota_state enable row level security;

create policy wingport_usage_select_own
  on wingport_usage
  for select
  to authenticated
  using (user_id = auth.uid());

create policy wingport_quota_state_select_own
  on wingport_quota_state
  for select
  to authenticated
  using (user_id = auth.uid());

-- Service role bypasses RLS for writes.

-- Tier limits. Expand as needed; unknown tiers fall back to 'default'.
create or replace function wingport_tier_limits(p_tier text)
returns table (
  requests_per_minute int,
  requests_per_day int,
  tokens_per_day int
) as $$
begin
  return query select
    case p_tier
      when 'pro' then 100
      when 'enterprise' then 1000
      else 10
    end,
    case p_tier
      when 'pro' then 1000
      when 'enterprise' then 10000
      else 50
    end,
    case p_tier
      when 'pro' then 2000000
      when 'enterprise' then 10000000
      else 100000
    end;
end;
$$ language plpgsql immutable;

-- Atomically consume quota. Returns allowed boolean, remaining quota,
-- and retry_after seconds (0 when allowed, >0 when denied).
-- Implemented as a single INSERT ... ON CONFLICT ... WHERE so concurrent
-- calls serialize on the primary-key row and cannot overshoot limits.
create or replace function wingport_consume_quota(
  p_user_id uuid,
  p_tier text,
  p_input_estimate int default 0,
  p_output_estimate int default 0
)
returns json as $$
declare
  v_now timestamptz := now();
  v_day date := (v_now at time zone 'UTC')::date;
  v_minute timestamptz := date_trunc('minute', v_now);
  v_rpm int;
  v_rpd int;
  v_tpd int;
  v_estimate int := p_input_estimate + p_output_estimate;
  v_allowed boolean := false;
  v_retry_after int := 0;
  v_row wingport_quota_state%rowtype;
begin
  select l.requests_per_minute, l.requests_per_day, l.tokens_per_day
  into v_rpm, v_rpd, v_tpd
  from wingport_tier_limits(p_tier) l;

  insert into wingport_quota_state as q (
    user_id, day, requests_used, tokens_used, minute_bucket, minute_count
  )
  values (p_user_id, v_day, 1, v_estimate, v_minute, 1)
  on conflict (user_id) do update set
    day = excluded.day,
    requests_used = case
      when q.day is distinct from excluded.day then excluded.requests_used
      else q.requests_used + excluded.requests_used
    end,
    tokens_used = case
      when q.day is distinct from excluded.day then excluded.tokens_used
      else q.tokens_used + excluded.tokens_used
    end,
    minute_bucket = excluded.minute_bucket,
    minute_count = case
      when q.minute_bucket is distinct from excluded.minute_bucket then excluded.minute_count
      else q.minute_count + excluded.minute_count
    end
  where
    (q.day is distinct from excluded.day or q.requests_used < v_rpd)
    and (q.day is distinct from excluded.day or q.tokens_used + excluded.tokens_used <= v_tpd)
    and (q.minute_bucket is distinct from excluded.minute_bucket or q.minute_count < v_rpm)
  returning * into v_row;

  if found then
    v_allowed := true;
    return json_build_object(
      'allowed', true,
      'retry_after', 0,
      'requests_used', v_row.requests_used,
      'tokens_used', v_row.tokens_used,
      'requests_remaining', greatest(0, v_rpd - v_row.requests_used),
      'tokens_remaining', greatest(0, v_tpd - v_row.tokens_used),
      'resets_at', (v_day + interval '1 day')::timestamptz
    );
  end if;

  -- Denied: read current state to compute retry_after and remaining.
  select * into v_row from wingport_quota_state where user_id = p_user_id;

  if v_row.day is distinct from v_day or v_row.requests_used >= v_rpd or v_row.tokens_used >= v_tpd then
    v_retry_after := greatest(0, extract(epoch from ((v_day + interval '1 day') at time zone 'UTC' - v_now))::int) + 1;
  else
    v_retry_after := greatest(0, extract(epoch from (v_minute + interval '1 minute' - v_now))::int) + 1;
  end if;

  return json_build_object(
    'allowed', false,
    'retry_after', v_retry_after,
    'requests_used', coalesce(v_row.requests_used, 0),
    'tokens_used', coalesce(v_row.tokens_used, 0),
    'requests_remaining', greatest(0, v_rpd - coalesce(v_row.requests_used, 0)),
    'tokens_remaining', greatest(0, v_tpd - coalesce(v_row.tokens_used, 0)),
    'resets_at', (v_day + interval '1 day')::timestamptz
  );
end;
$$ language plpgsql;

-- Record a completed request and settle token usage from estimate to actual.
create or replace function wingport_record_usage(
  p_user_id uuid,
  p_status text,
  p_model_alias text,
  p_provider_used text,
  p_input_tokens int,
  p_output_tokens int,
  p_input_estimate int,
  p_output_estimate int,
  p_duration_ms int default null
)
returns void as $$
declare
  v_delta int := (p_input_tokens + p_output_tokens) - (p_input_estimate + p_output_estimate);
begin
  insert into wingport_usage (
    user_id, model_alias, provider_used, input_tokens, output_tokens, status, duration_ms
  )
  values (p_user_id, p_model_alias, p_provider_used, p_input_tokens, p_output_tokens, p_status, p_duration_ms);

  update wingport_quota_state
  set tokens_used = greatest(0, tokens_used + v_delta)
  where user_id = p_user_id;
end;
$$ language plpgsql;

-- Get current quota for GET /v1/quota.
create or replace function wingport_get_quota(
  p_user_id uuid,
  p_tier text default 'default'
)
returns json as $$
declare
  v_now timestamptz := now();
  v_day date := (v_now at time zone 'UTC')::date;
  v_rpd int;
  v_tpd int;
  v_row wingport_quota_state%rowtype;
begin
  select l.requests_per_day, l.tokens_per_day into v_rpd, v_tpd
  from wingport_tier_limits(p_tier) l;

  select * into v_row from wingport_quota_state where user_id = p_user_id;

  if found then
    return json_build_object(
      'requestsRemaining', greatest(0, v_rpd - v_row.requests_used),
      'tokensRemaining', greatest(0, v_tpd - v_row.tokens_used),
      'resetsAt', (v_row.day + interval '1 day')::timestamptz
    );
  end if;

  return json_build_object(
    'requestsRemaining', v_rpd,
    'tokensRemaining', v_tpd,
    'resetsAt', (v_day + interval '1 day')::timestamptz
  );
end;
$$ language plpgsql;

grant execute on function wingport_consume_quota(uuid, text, int, int) to anon, authenticated, service_role;
grant execute on function wingport_record_usage(uuid, text, text, text, int, int, int, int, int) to service_role;
grant execute on function wingport_get_quota(uuid, text) to anon, authenticated, service_role;
grant execute on function wingport_tier_limits(text) to anon, authenticated, service_role;
