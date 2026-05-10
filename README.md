# Pietru

Cloudflare-native centralized mail gateway. Send, capture, and track transactional emails across all your projects through a single API.

**API:** `https://api.pietru.dev`
**Dashboard:** `https://app.pietru.dev`
**Marketing:** `https://pietru.dev`

---

## Overview

Pietru is a monorepo that provides a unified mail gateway running on Cloudflare Workers. It supports multiple projects, environment-aware sending modes (capture in dev, send in prod), template-based emails, provider management, and webhook-driven event tracking — all backed by D1, R2, and KV.

Key capabilities:

- **Multi-project support** — manage mail for many apps under one account
- **Environment-aware sending** — development/preview emails are captured (not sent), production emails are delivered
- **Template engine** — Mustache-style `{{var}}` and `{{{var}}}` syntax with dot-notation data binding
- **Idempotent sends** — `Idempotency-Key` header prevents duplicate messages
- **Account-level API keys** — let external services provision their own projects programmatically
- **Provider abstraction** — Resend today, extensible to other providers tomorrow
- **Webhook ingestion** — receive delivery, bounce, open, and click events from providers

## Architecture

```
pietru/
├── apps/
│   ├── api/              # Hono Worker (Cloudflare) — all REST endpoints
│   ├── dashboard/        # Vue 3 + Vite + @sil/ui — project management UI
│   └── marketing/        # Vue 3 + Vite + @sil/ui — public landing page
├── packages/
│   ├── core/             # Types, constants, utils, template rendering
│   ├── auth/             # Password hashing, API key generation, encryption
│   ├── db/               # D1 migration files
│   ├── providers/        # Mail provider implementations (Resend)
│   └── validation/       # Zod schemas for all request bodies
├── package.json          # Workspaces root
└── vitest.config.ts      # Shared test config
```

### Packages

| Package | Purpose |
|---------|---------|
| `@pietru/core` | Shared types, ID generation, slugify, template rendering, constants |
| `@pietru/auth` | Password hashing (bcrypt), API key generation & hashing, AES-GCM encrypt/decrypt, token utilities |
| `@pietru/db` | D1 SQL migration files |
| `@pietru/providers` | Mail provider interface + Resend implementation (send, validate, webhook) |
| `@pietru/validation` | Zod schemas for auth, projects, providers, messages |

### Cloudflare Bindings (API Worker)

| Binding | Type | Purpose |
|---------|------|---------|
| `DB` | D1 | Relational data (users, projects, messages, templates, keys) |
| `KV` | KV | Idempotency key deduplication (24h TTL) |
| `STORAGE` | R2 | Message HTML/text storage for captured emails, large event payloads |

### Secrets (set via `wrangler secret put`)

| Secret | Purpose |
|--------|---------|
| `JWT_SECRET` | Signs session JWTs (HS256) |
| `ENCRYPTION_KEY` | AES-GCM encryption for provider API keys stored in D1 |

## Quick Start

**Prerequisites:** Node.js ≥ 22, [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) logged in.

```bash
# Clone and install
git clone <repo-url> pietru
cd pietru
npm install

# Build packages first
npm run build:packages

# Set required secrets (interactive prompts)
cd apps/api
npx wrangler secret put JWT_SECRET
npx wrangler secret put ENCRYPTION_KEY
cd ../..

# Run database migrations
cd apps/api
npx wrangler d1 migrations apply pietru-production
cd ../..

# Start development
npm run dev:api        # API on localhost:8787
npm run dev:dashboard  # Dashboard on localhost:5174
npm run dev:marketing  # Marketing on localhost:5173
```

## Environment Setup

Two secrets are required for the API worker:

```bash
cd apps/api

# Generate a strong random string for JWT signing
npx wrangler secret put JWT_SECRET
# Enter a cryptographically random string (e.g. from openssl rand -base64 32)

# Generate a 256-bit key for AES-GCM encryption
npx wrangler secret put ENCRYPTION_KEY
# Enter a 32-byte hex string or base64-encoded key
```

You also need Cloudflare resources configured in `apps/api/wrangler.toml`:

- A **D1 database** named `pietru-production`
- A **KV namespace** bound to `KV`
- An **R2 bucket** named `pietru-storage`

## Database Migrations

Migrations live in `packages/db/migrations/` and are referenced by `wrangler.toml`.

```bash
# Apply all pending migrations
cd apps/api
npx wrangler d1 migrations apply pietru-production

# Apply to a local dev DB
npx wrangler d1 migrations apply pietru-production --local
```

Current migrations:
- `0001_initial.sql` — users, sessions, auth tokens, projects, API keys, provider configs, messages, message events
- `0002_account_keys_templates.sql` — account-level API keys, user settings, email templates

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start API worker locally (wrangler dev) |
| `npm run dev:dashboard` | Start dashboard dev server (:5174) |
| `npm run dev:marketing` | Start marketing dev server (:5173) |
| `npm run build:packages` | Build all packages |
| `npm run build:api` | Build (dry-run deploy) API |
| `npm run build:dashboard` | Type-check and build dashboard |
| `npm run build:marketing` | Type-check and build marketing |
| `npm run build` | Build everything |
| `npm run test` | Run all tests (vitest) |
| `npm run typecheck` | Run TypeScript type-checking across the monorepo |
| `npm run typecheck:api` | Type-check API only |
| `npm run typecheck:dashboard` | Type-check dashboard only |
| `npm run typecheck:marketing` | Type-check marketing only |

## Deployment

### API Worker

```bash
cd apps/api
npx wrangler deploy
```

### Dashboard & Marketing (Cloudflare Pages)

Both frontend apps are built as static sites and deployed to Cloudflare Pages:

- **Dashboard** → `pietru-dashboard` Pages project (builds from `apps/dashboard/dist/`)
- **Marketing** → `pietru-marketing` Pages project (builds from `apps/marketing/dist/`)

```bash
npm run build:dashboard   # outputs to apps/dashboard/dist/
npm run build:marketing   # outputs to apps/marketing/dist/
```

Configure each Pages project to use the respective `dist/` directory as the output.

## Documentation

- **[API.md](./API.md)** — Full REST API reference with all endpoints, request/response schemas, and authentication details
- **[INTEGRATION.md](./INTEGRATION.md)** — Integration guide for external projects to use Pietru programmatically
