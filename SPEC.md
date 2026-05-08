# Pietru Mail Gateway — Build Specification

## Overview

Pietru is a centralized, API-first, Cloudflare-native mail gateway for sending, capturing, debugging, routing, and tracking outgoing email across projects. One API for every app that sends email.

## Domains

- `pietru.dev` — marketing/docs site (Vue SPA on CF Pages)
- `app.pietru.dev` — authenticated dashboard (Vue SPA on CF Pages)
- `api.pietru.dev` — public API (Hono on CF Workers + D1 + R2 + KV)

## Stack

- **API**: Hono, TypeScript, Cloudflare Workers, D1, R2, KV, Queues
- **Dashboard**: Vue 3, TypeScript, Vite, @sil/ui, SCSS, CSS custom properties, Pinia
- **Marketing**: Vue 3, TypeScript, Vite, @sil/ui, SCSS
- **Shared packages**: core, auth, db, providers, validation
- **Node**: 25
- **Monorepo**: npm workspaces (NOT pnpm)
- **Package manager**: npm

## Monorepo Structure

```
apps/
  api/                    # Hono Worker — api.pietru.dev
  dashboard/              # Vue SPA — app.pietru.dev
  marketing/              # Vue SPA — pietru.dev

packages/
  core/                   # shared types, utils, constants
  auth/                   # password hashing, JWT, session, token logic
  db/                     # D1 schema, migrations, query helpers
  providers/              # mail provider adapters (Resend first)
  validation/             # Zod request/response schemas
```

## Crypto Constraints (CRITICAL)

Cloudflare Workers do NOT support bcrypt, argon2, WASM, or `new Function()`.

- **Password hashing**: PBKDF2 via Web Crypto API (`crypto.subtle`). Format: `pbkdf2$100000$<salt-hex>$<hash-hex>`
- **API key hashing**: SHA-256 via `crypto.subtle.digest`
- **Provider secrets**: AES-GCM encryption via `crypto.subtle` (encrypt before D1 storage)
- **JWT**: Use `hono/jwt` (pure JS, no WASM)
- **NO**: hash-wasm, argon2, bcrypt, argon2-browser, eval, new Function

## D1 Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE project_api_keys (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  environment TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE provider_configs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  config_encrypted TEXT NOT NULL,
  mode TEXT NOT NULL,
  environment TEXT NOT NULL,
  default_from TEXT,
  allowed_domains_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider_config_id TEXT,
  environment TEXT NOT NULL,
  to_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  reply_to TEXT,
  cc_json TEXT,
  bcc_json TEXT,
  subject TEXT NOT NULL,
  html TEXT,
  text TEXT,
  status TEXT NOT NULL,
  provider TEXT,
  provider_message_id TEXT,
  error TEXT,
  tags_json TEXT,
  raw_storage_key TEXT,
  html_storage_key TEXT,
  text_storage_key TEXT,
  idempotency_key_hash TEXT,
  created_at TEXT NOT NULL,
  queued_at TEXT,
  sent_at TEXT,
  failed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (provider_config_id) REFERENCES provider_configs(id)
);

CREATE TABLE message_events (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT,
  payload_json TEXT,
  payload_storage_key TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

## API Endpoints

Base: `https://api.pietru.dev`

### Auth (session-based, HTTP-only cookies)
```
POST   /auth/register          { email, password } → user + session cookie
POST   /auth/login             { email, password } → user + session cookie
POST   /auth/logout            → clear cookie
POST   /auth/verify-email      { token }
POST   /auth/forgot-password   { email }
POST   /auth/reset-password    { token, password }
POST   /auth/change-password   { currentPassword, newPassword }  (authed)
GET    /auth/me                → current user  (authed)
GET    /auth/sessions          → list sessions  (authed)
DELETE /auth/sessions/:id      → revoke session  (authed)
```

### Projects (authed)
```
GET    /projects
POST   /projects               { name, slug }
GET    /projects/:id
PATCH  /projects/:id           { name?, slug? }
DELETE /projects/:id
```

### API Keys (authed)
```
GET    /projects/:id/api-keys
POST   /projects/:id/api-keys           { name?, environment } → shows key ONCE
DELETE /projects/:id/api-keys/:keyId
```

### Provider Configs (authed)
```
GET    /projects/:id/provider-configs
POST   /projects/:id/provider-configs            { providerType, config, mode, environment, defaultFrom, allowedDomains }
PATCH  /projects/:id/provider-configs/:configId
POST   /projects/:id/provider-configs/:configId/validate
```

### Messages (authed OR project API key)
```
POST   /messages              { to, from, subject, html?, text?, tags? } + Authorization: Bearer mg_pk_xxx
GET    /messages              ?project&environment&to&from&status&limit&cursor
GET    /messages/:id
```

### Test Inboxes (authed OR project API key)
```
GET    /test-inboxes/:inbox/messages
```

### Webhooks (public, signature-verified)
```
POST   /webhooks/providers/resend
```

## Authentication

### User Auth
- Sessions via HTTP-only cookies (`SameSite=None; Secure` for cross-domain)
- JWT stored in cookie, verified via `hono/jwt`
- Session tokens stored hashed in D1

### Project API Keys
- Prefix: `mg_pk_live_xxxxx` (production), `mg_pk_test_xxxxx` (development/preview)
- Generated once, shown once, stored hashed (SHA-256)
- Scoped to project + environment
- Passed as `Authorization: Bearer mg_pk_xxx`

## Sending Modes

| Mode | Behavior |
|------|----------|
| `send` | Sends through provider, stores metadata |
| `capture` | Stores message, does NOT send |
| `send_and_capture` | Sends AND stores full body |

Defaults: development=capture, preview=capture, production=send

## Provider System

```typescript
export interface MailProvider {
  sendEmail(message: OutgoingEmail, config: ProviderConfig): Promise<ProviderSendResult>;
  validateConfig(config: ProviderConfig): Promise<void>;
  handleWebhook?(payload: unknown, headers: Headers): Promise<ProviderEvent[]>;
}
```

First provider: Resend. Uses `fetch` to call Resend API directly (no SDK).

## CORS

API must allow:
- `https://app.pietru.dev`
- `https://pietru.dev`
- `http://localhost:5173` (dev)
- `http://localhost:5174` (dev dashboard)

Credentials: true. Expose: Set-Cookie.

## Wrangler Config (apps/api/wrangler.toml)

```toml
name = "pietru-api"
main = "src/index.ts"
compatibility_date = "2025-04-01"

[[d1_databases]]
binding = "DB"
database_name = "pietru-production"
database_id = "placeholder"
migrations_dir = "../../packages/db/migrations"

[[kv_namespaces]]
binding = "KV"
id = "placeholder"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "pietru-storage"
```

## Dashboard App (apps/dashboard)

- Vue 3 + Vite + Pinia + Vue Router
- @sil/ui for components
- CSS custom properties only (no Sass variables)
- SCSS for nesting/mixins only
- BEMM-style classes

### Views
- `/login` — login form
- `/register` — register form
- `/forgot-password` — forgot password
- `/reset-password` — reset password
- `/verify-email` — email verification
- `/` — dashboard home (project list)
- `/projects/:id` — project detail (env config, API keys, providers)
- `/projects/:id/messages` — message list
- `/projects/:id/messages/:messageId` — message detail (inspect HTML/text, events)
- `/projects/:id/test-inboxes` — test inbox list
- `/projects/:id/test-inboxes/:inbox` — captured messages
- `/settings` — profile, password, sessions

### API Client
- Pinia store `useApi` with fetch wrapper
- Auto-includes credentials: 'include'
- Base URL from env var `VITE_PIETRU_API_URL`

## Marketing Site (apps/marketing)

- Simple Vue 3 + Vite SPA
- Landing page, features, docs links
- @sil/ui for consistent look
- Minimal — just a shell for now

## Key Implementation Notes

1. D1 `result.meta.changes` for affected rows (NOT `meta.rows_changed`)
2. Hono `c.json()` status needs `ContentfulStatusCode` cast
3. PBKDF2: 100,000 iterations, SHA-256, 16-byte salt
4. API key prefix format: `mg_pk_live_` / `mg_pk_test_` + 32 random chars
5. Idempotency keys: hash with SHA-256, store in message, check before creating
6. Large HTML/text bodies: store in R2, keep reference in D1
7. Message IDs: `msg_` prefix + nanoid-style random string
8. All timestamps: ISO 8601 strings
9. Error responses: `{ error: { code: string, message: string } }`
10. Success responses: `{ data: T }`
