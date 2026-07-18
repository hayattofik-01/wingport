---
title: Usage & Quotas
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Usage & Quotas

The features you can't build with a raw provider key: control and visibility **per end user**.

## Per-user limits

Configured in `limits` (see Gateway Configuration). Three independent meters per user:

- `requestsPerMinute` — burst control
- `requestsPerDay` — request budget
- `tokensPerDay` — spend budget (input + output tokens)

When a limit is exceeded the gateway returns `429` with a `retryAfter`, and the SDK throws `QuotaExceededException` carrying `limit`, `used`, and `resetsAt` — everything you need to render "3 of 50 free messages left" UI.

## Tiers

Map your app's own subscription tiers to limits. The gateway reads the tier from a JWT claim (or a Postgres column) you specify — so your existing "pro" flag instantly gates AI usage:

```dart
// Client-side: show remaining quota
final quota = await wing.quota();
Text('${quota.requestsRemaining} messages left today');
```

## Usage data is yours

Every completed request writes a row to `wingport_usage` in your Postgres:

```sql
-- Your AI cost per user, this month
select user_id, sum(total_tokens) as tokens
from wingport_usage
where created_at > date_trunc('month', now())
group by user_id
order by tokens desc;
```

No dashboard lock-in: it's your table. (A hosted analytics dashboard is on the roadmap for teams who want it — reading these same tables.)

---
