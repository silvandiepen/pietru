# Pietru API — Complete Endpoint Reference

> Hono Worker on Cloudflare · D1 + KV + R2 bindings  
> Base URL: `https://api.pietru.dev` (or local dev)

---

## Authentication & Middleware

### Three auth strategies

| Strategy | Mechanism | Middleware | Sets on `c` |
|---|---|---|---|
| **User Session** | Cookie `session` (JWT HS256) | `requireUserSession` | `userId`, `sessionId` |
| **Project API Key** | `Authorization: Bearer <key>` | `requireProjectApiKey` | `projectId`, `environment` |
| **Account API Key** | `Authorization: Bearer <key>` | `requireAccountApiKey` | `userId`, `accountId` |

### Session cookie details

- **Cookie name:** `session`
- **Value:** JWT signed with `JWT_SECRET` (HS256)
- **JWT payload:** `{ sub: userId, sid: sessionId, sth: tokenHash, exp }`
- **Cookie options:** `HttpOnly`, `Secure`, `SameSite=None`, `Path=/`, `Max-Age=604800` (7 days)
- **DB backing:** `user_sessions` table — verified on every request (checks `token_hash`, `revoked_at`, `expires_at`)

### API key prefix detection

- Project keys: prefix determines environment (`development` / `production`)
- Account keys: use `API_KEY_PREFIXES.account` prefix
- Keys are looked up by SHA hash of the raw key

### Flexible auth (messages & templates)

Messages `GET /messages`, `GET /messages/:id`, `GET /test-inboxes/:inbox/messages` and all template routes use a local `authenticateAccess()` that tries:
1. `Authorization: Bearer` → project API key, then account API key
2. Cookie `session` → user session

### Error response shape (auth)

```json
{ "error": { "code": "unauthorized", "message": "Missing session cookie" } }
```

---

## Global error handler

Any unhandled error returns:

```json
{ "error": { "code": "internal_error", "message": "<error message>" } }
```
Status `500`.

---

## CORS

- Allowed origins: `pietru.dev`, `app.pietru.dev`, `api.pietru.dev`, `localhost:5173`, `localhost:5174`, and `*.pietru-dashboard.pages.dev` / `*.pietru-marketing.pages.dev`
- Credentials: `true`
- Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- Headers: `Content-Type`, `Authorization`
- Exposed: `Set-Cookie`

---

## Endpoints

### Health Check

#### `GET /`

- **Auth:** None
- **Response:** `{ "data": { "ok": true } }`

---

### Auth Routes (`/auth`)

#### `POST /auth/register`

- **Auth:** None
- **Body:** `{ email: string, password: string }` (validated by `registerSchema`)
- **Response (201):** `{ "data": { user: { id, email, emailVerifiedAt, createdAt, updatedAt } } }`
- **Side effects:** Creates user, creates `email_verification` token, sends verification email (non-blocking), sets `session` cookie, auto-logs in
- **Errors:** `400 validation_error`, `409 email_taken`

#### `POST /auth/login`

- **Auth:** None
- **Body:** `{ email: string, password: string }` (validated by `loginSchema`)
- **Response (200):** `{ "data": { user: { id, email, emailVerifiedAt, createdAt, updatedAt } } }`
- **Side effects:** Sets `session` cookie
- **Errors:** `400 validation_error`, `401 invalid_credentials`

#### `POST /auth/logout`

- **Auth:** User session (`requireUserSession`)
- **Body:** None
- **Response (200):** `{ "data": { "ok": true } }`
- **Side effects:** Revokes session in DB, clears `session` cookie

#### `POST /auth/verify-email`

- **Auth:** None
- **Body:** `{ token: string }` (validated by `resetPasswordSchema.pick({ token: true })`)
- **Response (200):** `{ "data": { verifiedAt: "<ISO date>" } }`
- **Errors:** `400 validation_error`, `400 invalid_token`

#### `POST /auth/forgot-password`

- **Auth:** None
- **Body:** `{ email: string }` (validated by `forgotPasswordSchema`)
- **Response (200):** `{ "data": { "ok": true } }` (always returns success to prevent email enumeration)
- **Side effects:** Creates `password_reset` token (1hr TTL), sends reset email (non-blocking)

#### `POST /auth/reset-password`

- **Auth:** None
- **Body:** `{ token: string, password: string }` (validated by `resetPasswordSchema`)
- **Response (200):** `{ "data": { "ok": true } }`
- **Errors:** `400 validation_error`, `400 invalid_token`

#### `POST /auth/change-password`

- **Auth:** User session (`requireUserSession`)
- **Body:** `{ currentPassword: string, newPassword: string }` (validated by `changePasswordSchema`)
- **Response (200):** `{ "data": { "ok": true } }`
- **Errors:** `400 validation_error`, `401 invalid_credentials`

#### `GET /auth/me`

- **Auth:** User session (`requireUserSession`)
- **Response (200):** `{ "data": { id, email, email_verified_at, created_at, updated_at } }`

#### `GET /auth/sessions`

- **Auth:** User session (`requireUserSession`)
- **Response (200):** `{ "data": [{ id, created_at, expires_at, revoked_at }, ...] }`

#### `DELETE /auth/sessions/:id`

- **Auth:** User session (`requireUserSession`)
- **Params:** `id` — session ID to revoke
- **Response (200):** `{ "data": { "ok": true } }`
- **Errors:** `404 not_found`

---

### Projects (`/` — mounted at root)

All project routes require **User session** (`requireUserSession` via `projectRoutes.use('*', ...)`).

#### `GET /`

- **Auth:** User session
- **Response (200):** `{ "data": [{ id, user_id, name, slug, created_at, updated_at }, ...] }`

#### `POST /`

- **Auth:** User session
- **Body:** `{ name: string, slug?: string }` (validated by `createProjectSchema`)
- **Response (201):** `{ "data": { id, user_id, name, slug, created_at, updated_at } }`
- **Note:** Slug auto-generated from `slug` field or `name` via `slugify()`, uniqueness enforced

#### `GET /:id`

- **Auth:** User session
- **Params:** `id` — project ID
- **Response (200):** `{ "data: { id, user_id, name, slug, created_at, updated_at } }`
- **Errors:** `400 validation_error`, `404 not_found`

#### `PATCH /:id`

- **Auth:** User session
- **Params:** `id` — project ID
- **Body:** `{ name?: string, slug?: string }` (validated by `updateProjectSchema`)
- **Response (200):** `{ "data": { id, user_id, name, slug, created_at, updated_at } }`
- **Errors:** `400 validation_error`, `404 not_found`

#### `DELETE /:id`

- **Auth:** User session
- **Params:** `id` — project ID
- **Response (200):** `{ "data": { "ok": true } }`
- **Errors:** `400 validation_error`, `404 not_found`

---

### Project API Keys (`/projects/:id/api-keys`)

All require **User session** (`requireUserSession` via `apiKeyRoutes.use('*', ...)`).

#### `GET /projects/:id/api-keys`

- **Auth:** User session
- **Params:** `id` — project ID
- **Response (200):** `{ "data": [{ id, name, key_prefix, environment, created_at, revoked_at }, ...] }`
- **Errors:** `400 validation_error`, `401 unauthorized`, `404 not_found`

#### `POST /projects/:id/api-keys`

- **Auth:** User session
- **Params:** `id` — project ID
- **Body:** `{ name?: string, environment: "development" | "preview" | "production" }`
- **Response (201):** `{ "data": { id, key: "<full API key>", keyPrefix, environment, createdAt } }`
- **Note:** Full key only returned once on creation
- **Errors:** `400 validation_error`, `401 unauthorized`, `404 not_found`

#### `DELETE /projects/:id/api-keys/:keyId`

- **Auth:** User session
- **Params:** `id` — project ID, `keyId` — API key ID
- **Response (200):** `{ "data": { "ok": true } }`
- **Note:** Soft-delete (sets `revoked_at`)
- **Errors:** `400 validation_error`, `401 unauthorized`, `404 not_found`

---

### Account API Keys (`/account/api-keys`)

All require **User session** (`requireUserSession` via `accountApiKeysRoutes.use('*', ...)`).

#### `GET /account/api-keys`

- **Auth:** User session
- **Response (200):** `{ "data": [{ id, name, key_prefix, created_at, revoked_at }, ...] }`

#### `POST /account/api-keys`

- **Auth:** User session
- **Body:** `{ name?: string }`
- **Response (201):** `{ "data": { id, key: "<full account API key>", keyPrefix, createdAt } }`
- **Note:** Full key only returned once on creation

#### `DELETE /account/api-keys/:keyId`

- **Auth:** User session
- **Params:** `keyId` — account API key ID
- **Response (200):** `{ "data": { "ok": true } }`
- **Note:** Soft-delete (sets `revoked_at`)
- **Errors:** `400 validation_error`, `401 unauthorized`, `404 not_found`

---

### Provider Configs (`/projects/:id/provider-configs`)

All require **User session** (`requireUserSession`).

#### `GET /projects/:id/provider-configs`

- **Auth:** User session
- **Params:** `id` — project ID
- **Response (200):** `{ "data": [{ id, project_id, provider_type, mode, environment, default_from, allowed_domains_json, created_at, updated_at }, ...] }`
- **Errors:** `400`, `401`, `404 not_found`

#### `POST /projects/:id/provider-configs`

- **Auth:** User session
- **Params:** `id` — project ID
- **Body:** (validated by `createProviderConfigSchema`):
  ```json
  {
    "providerType": "resend",
    "config": { "apiKey": "..." },
    "mode": "send" | "capture" | "send_and_capture",
    "environment": "development" | "preview" | "production",
    "defaultFrom": "optional@email.com",
    "allowedDomains": ["example.com"]
  }
  ```
- **Response (201):** `{ "data": { id, providerType, mode, environment, defaultFrom, allowedDomains, createdAt, updatedAt } }`
- **Side effects:** Config is encrypted with `ENCRYPTION_KEY` before storage; provider validation runs first
- **Errors:** `400 validation_error`, `404 not_found`

#### `PATCH /projects/:id/provider-configs/:configId`

- **Auth:** User session
- **Params:** `id` — project ID, `configId` — provider config ID
- **Body:** Partial of create schema (all fields optional)
- **Response (200):** `{ "data": { id, providerType, mode, environment, defaultFrom, allowedDomains, updatedAt } }`
- **Side effects:** Merges with existing config, re-encrypts, re-validates
- **Errors:** `400`, `404 not_found`

#### `POST /projects/:id/provider-configs/:configId/validate`

- **Auth:** User session
- **Params:** `id` — project ID, `configId` — provider config ID
- **Body:** None
- **Response (200):** `{ "data": { "ok": true } }`
- **Side effects:** Decrypts config and runs provider validation (e.g. Resend API check)
- **Errors:** `400`, `404 not_found`, `500` if validation fails (caught by global handler)

---

### Messages

#### `POST /messages` — Send a message

- **Auth:** Project API key (`requireProjectApiKey`)
- **Headers:** `Idempotency-Key` (optional — deduplicates for 24h via KV)
- **Body:** (validated by `sendMessageSchema`):
  ```json
  {
    "to": "user@example.com" | ["user1@example.com", "user2@example.com"],
    "from": "sender@example.com",
    "subject": "Hello",
    "html": "<p>HTML body</p>",
    "text": "Plain text body",
    "templateId": "tpl_xxx",
    "data": { "name": "John" },
    "cc": ["cc@example.com"],
    "bcc": ["bcc@example.com"],
    "replyTo": "reply@example.com",
    "tags": { "key": "value" }
  }
  ```
- **Response (201):** `{ "data": { id, project_id, ...full message record } }`
- **Behavior:**
  - If `templateId` provided, `subject`/`html`/`text` are rendered from template + `data`
  - If `Idempotency-Key` header sent, returns existing message if already processed
  - Provider config resolved for project+environment; mode determines behavior:
    - `capture` — stores in R2, no send
    - `send` — sends via Resend, no storage of body
    - `send_and_capture` — sends + stores in R2
  - Defaults: production → `send`, non-production → `capture`
- **Errors:** `400 validation_error / invalid_from_domain / missing_from / provider_not_configured`, `401 unauthorized / missing project scope`, `404 not_found (template)`

#### `GET /messages` — List messages

- **Auth:** Flexible (`Authorization: Bearer` project/account API key **or** `session` cookie)
- **Query params:**
  - `project` — filter by project ID (user session only)
  - `environment` — filter by environment
  - `to` — filter by recipient
  - `from` — filter by sender
  - `status` — filter by status
  - `dateFrom` — ISO date lower bound
  - `dateTo` — ISO date upper bound
  - `cursor` — base64 pagination cursor
  - `limit` — max results (default 20, max 100)
- **Response (200):** `{ "data": { "items": [...], "nextCursor": "<base64>|null" } }`
- **Note:** User session sees all their projects' messages; API key scoped to its project+environment

#### `GET /messages/:id` — Get single message with events

- **Auth:** Flexible (same as list)
- **Params:** `id` — message ID
- **Response (200):** `{ "data": { ...message, "events": [...] } }`
- **Errors:** `400 validation_error`, `401 unauthorized`, `404 not_found`

#### `GET /test-inboxes/:inbox/messages` — Test inbox

- **Auth:** Flexible (same as list)
- **Params:** `inbox` — format `{projectSlug}-{environment}` (e.g. `my-app-development`)
- **Query params:** `limit` (default 50, max 100)
- **Response (200):** `{ "data": [...] }` — list of captured messages
- **Note:** Only works for `development` and `preview` environments
- **Errors:** `400 validation_error`, `401 unauthorized`, `404 not_found`

---

### Templates (`/projects/:projectId/templates`)

All use **Flexible auth** (project API key, account API key, or session cookie). Project API keys are scoped to their own project.

#### `GET /projects/:projectId/templates`

- **Params:** `projectId`
- **Query params:** `limit` (default 50, max 100), `offset` (default 0)
- **Response (200):** `{ "data": [{ id, project_id, name, description, subject, html, text, created_at, updated_at }, ...] }`
- **Errors:** `401 unauthorized`, `404 not_found`

#### `POST /projects/:projectId/templates`

- **Params:** `projectId`
- **Body:**
  ```json
  {
    "name": "Welcome Email",
    "subject": "Welcome, {{name}}!",
    "html": "<p>Hello {{name}}</p>",
    "text": "Hello {{name}}",
    "description": "Optional description"
  }
  ```
- **Response (201):** `{ "data": { id, project_id, name, description, subject, html, text, created_at, updated_at } }`
- **Errors:** `400 validation_error`, `401 unauthorized`, `404 not_found`

#### `GET /projects/:projectId/templates/:templateId`

- **Params:** `projectId`, `templateId`
- **Response (200):** `{ "data": { ...template record } }`
- **Errors:** `401 unauthorized`, `404 not_found`

#### `PATCH /projects/:projectId/templates/:templateId`

- **Params:** `projectId`, `templateId`
- **Body:** Partial update:
  ```json
  {
    "name": "string?",
    "subject": "string?",
    "html": "string?|null",
    "text": "string?|null",
    "description": "string?|null"
  }
  ```
- **Response (200):** `{ "data": { ...updated template } }`
- **Errors:** `400 validation_error`, `401 unauthorized`, `404 not_found`

#### `DELETE /projects/:projectId/templates/:templateId`

- **Params:** `projectId`, `templateId`
- **Response (200):** `{ "data": { "deleted": true } }`
- **Errors:** `401 unauthorized`, `404 not_found`

---

### Webhooks

#### `POST /webhooks/providers/resend` — Inbound Resend webhook

- **Auth:** None (verified via webhook secret in provider config — Resend signs payloads)
- **Body:** Raw text payload (Resend webhook format)
- **Response (200):** `{ "data": { "ok": true } }` if signature verified and events processed
- **Response (401):** `{ "error": { "code": "invalid_signature", "message": "Webhook could not be verified" } }`
- **Behavior:** Iterates all Resend provider configs, attempts signature verification with each config's `webhookSecret`. On match, parses events and inserts `message_events` records linked by `provider_message_id`. Large payloads stored in R2.

---

### API Projects (programmatic project creation)

#### `POST /api/projects` — Create project via API

- **Auth:** Account API key (`requireAccountApiKey`)
- **Body:**
  ```json
  {
    "name": "My Project",
    "slug": "my-project",
    "environment": "development"
  }
  ```
  - `slug` optional, defaults to slugified `name`
  - `environment` defaults to `"development"`
- **Response (201):**
  ```json
  {
    "data": {
      "id": "proj_xxx",
      "user_id": "usr_xxx",
      "name": "My Project",
      "slug": "my-project",
      "created_at": "...",
      "updated_at": "...",
      "environment": "development",
      "projectApiKeys": [{
        "id": "pak_xxx",
        "key": "re_dev_xxxx...",
        "keyPrefix": "re_dev",
        "environment": "development",
        "createdAt": "..."
      }]
    }
  }
  ```
- **Side effects:**
  - Creates project
  - Auto-provisions Resend provider config if user has `default_resend_api_key_encrypted` in `user_settings`
  - Auto-generates a project API key for the requested environment
- **Errors:** `400 validation_error`, `401 unauthorized`

---

## Cloudflare Bindings (`Env`)

| Binding | Type | Usage |
|---|---|---|
| `DB` | D1 Database | All persistent data (users, projects, messages, etc.) |
| `KV` | KV Namespace | Idempotency key dedup (24h TTL) |
| `STORAGE` | R2 Bucket | Captured message bodies, event payloads |
| `JWT_SECRET` | string | Signs/verifies session JWTs |
| `ENCRYPTION_KEY` | string | Encrypts/decrypts provider configs |
| `SYSTEM_EMAIL_API_KEY` | string | Sends verification & password reset emails |
| `SYSTEM_EMAIL_FROM` | string | From address for system emails |
| `DASHBOARD_URL` | string | Base URL for email verification/reset links |

---

## App Context Variables

Set by middleware, available in route handlers via `c.get()`:

| Variable | Type | Set by |
|---|---|---|
| `userId` | `string` | Session or API key auth |
| `sessionId` | `string` | User session auth only |
| `accountId` | `string` | Account API key auth only |
| `projectId` | `string` | Project API key auth only |
| `environment` | `Environment` | Project API key auth only |

---

## Summary Table

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | None | Health check |
| `POST` | `/auth/register` | None | Register + auto-login |
| `POST` | `/auth/login` | None | Login |
| `POST` | `/auth/logout` | Session | Logout + revoke session |
| `POST` | `/auth/verify-email` | None | Verify email with token |
| `POST` | `/auth/forgot-password` | None | Request password reset |
| `POST` | `/auth/reset-password` | None | Reset password with token |
| `POST` | `/auth/change-password` | Session | Change password (current + new) |
| `GET` | `/auth/me` | Session | Get current user |
| `GET` | `/auth/sessions` | Session | List user sessions |
| `DELETE` | `/auth/sessions/:id` | Session | Revoke a session |
| `GET` | `/` | Session | List projects |
| `POST` | `/` | Session | Create project |
| `GET` | `/:id` | Session | Get project |
| `PATCH` | `/:id` | Session | Update project |
| `DELETE` | `/:id` | Session | Delete project |
| `GET` | `/projects/:id/api-keys` | Session | List project API keys |
| `POST` | `/projects/:id/api-keys` | Session | Create project API key |
| `DELETE` | `/projects/:id/api-keys/:keyId` | Session | Revoke project API key |
| `GET` | `/account/api-keys` | Session | List account API keys |
| `POST` | `/account/api-keys` | Session | Create account API key |
| `DELETE` | `/account/api-keys/:keyId` | Session | Revoke account API key |
| `GET` | `/projects/:id/provider-configs` | Session | List provider configs |
| `POST` | `/projects/:id/provider-configs` | Session | Create provider config |
| `PATCH` | `/projects/:id/provider-configs/:configId` | Session | Update provider config |
| `POST` | `/projects/:id/provider-configs/:configId/validate` | Session | Validate provider config |
| `POST` | `/messages` | Project API Key | Send message |
| `GET` | `/messages` | Flexible | List messages |
| `GET` | `/messages/:id` | Flexible | Get message + events |
| `GET` | `/test-inboxes/:inbox/messages` | Flexible | Test inbox messages |
| `GET` | `/projects/:projectId/templates` | Flexible | List templates |
| `POST` | `/projects/:projectId/templates` | Flexible | Create template |
| `GET` | `/projects/:projectId/templates/:templateId` | Flexible | Get template |
| `PATCH` | `/projects/:projectId/templates/:templateId` | Flexible | Update template |
| `DELETE` | `/projects/:projectId/templates/:templateId` | Flexible | Delete template |
| `POST` | `/webhooks/providers/resend` | None (signed) | Resend webhook |
| `POST` | `/api/projects` | Account API Key | Create project + key via API |
