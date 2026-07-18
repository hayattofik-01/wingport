---
title: Reference — CLI
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# CLI

```bash
npx wingport init       # scaffold gateway, config, and migrations into your project
npx wingport deploy     # run migrations + deploy the edge function
npx wingport doctor     # verify secrets, auth config, and connectivity
npx wingport token create --role service   # mint a server-to-server token
```

`init` is idempotent and never overwrites your edited config. `doctor` is the first thing to run when something misbehaves — it checks each link in the chain (secrets present, function deployed, JWT verifiable, provider reachable) and tells you which one broke.

---
