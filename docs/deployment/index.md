---
title: Deployment
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Deployment

## Supabase (v0.1)

Covered in [Installation](/installation). `wingport deploy` = migrate + deploy function. Redeploying updates the gateway in place; config changes take effect on deploy.

**Runtime notes:** the gateway is stateless — all state lives in Postgres — so it scales with Supabase's edge runtime. Long generations are bounded by edge function wall-clock limits; the SDK's chunk-timeout and retry semantics are designed around this, and streaming responses are unaffected in typical use.

## Firebase <Badge type="info" text="Planned" />

Cloud Functions target with Firebase Auth verification and Firestore-backed metering.

## Self-hosted Dart (Shelf) <Badge type="info" text="Planned" />

A pure-Dart gateway for teams running Dart on the server (Shelf/Dart Frog/Serverpod) — one language end to end.

## Wingport Cloud <Badge type="info" text="Planned" />

The hosted option for teams who don't want to manage even a config file: managed gateway, key vault, team dashboard, and a managed-keys mode where you skip provider signups entirely and are billed per token. The open-source core remains the foundation — Cloud runs the same code you can read.
