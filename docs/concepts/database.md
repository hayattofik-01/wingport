---
title: Database
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Database

`wingport init` generates one migration. Two tables, both in your Postgres, both yours.

```sql
create table wingport_usage (
  id            bigint generated always as identity primary key,
  user_id       uuid not null,
  model_alias   text not null,
  provider_used text not null,
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  total_tokens  int generated always as (input_tokens + output_tokens) stored,
  status        text not null,          -- ok | error | interrupted
  duration_ms   int,
  created_at    timestamptz not null default now()
);

create table wingport_quota_state (
  user_id       uuid primary key,
  day           date not null,
  requests_used int not null default 0,
  tokens_used   int not null default 0,
  minute_bucket timestamptz,
  minute_count  int not null default 0
);
```

Indexes on `(user_id, created_at)` are included. RLS policies: users `select` their own rows; writes are service-role only. Migrations are versioned — `wingport deploy` applies pending ones and never edits your own tables.
