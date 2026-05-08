# Pietru API Reference

Base URL: `https://kodapi.hakobs.com`

All responses use JSON. Successful responses follow the envelope format `{ "data": ... }`. Errors follow `{ "error": { "code": "...", "message": "..." } }`.

---

## Authentication

Pietru uses three authentication methods depending on the endpoint:

| Method | Header/Cookie | Prefix | Used By |
|--------|---------------|--------|---------|
| User session | Cookie: `session` (httpOnly JWT) | — | Dashboard endpoints, project management |
| Project API key | `Authorization: Bearer mg_pk_live_...` or `mg_pk_test_...` | `mg_pk_live_` (prod), `mg_pk_test_` (dev/preview) | Sending messages, listing messages |
| Account API key | `Authorization: Bearer mg_ak_...` | `mg_ak_` | Programmatic project provisioning |

Session cookies are set with `httpOnly`, `secure`, `sameSite: None`, and a 7-day max age.

### Error Response Format

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Missing API key"
  }
}
```

Common error codes: `unauthorized`, `validation_error`, `not_found`, `email_taken`, `invalid_credentials`, `invalid_token`, `provider_not_configured`, `missing_from`, `invalid_from_domain`, `internal_error`.

---

## Root

### `GET /`

Health check.

**Response** `200`
```json
{ "data": { "ok": true } }
```

---

## Authentication

### `POST /auth/register`

Create a new account. Automatically creates a session and sets the `session` cookie.

**Body**
| Field | Type | Required |
|-------|------|----------|
| `email` | string (email) | yes |
| `password` | string (min 8) | yes |

**Response** `201`
```json
{
  "data": {
    "user": {
      "id": "usr_...",
      "email": "user@example.com",
      "emailVerifiedAt": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Errors:** `409` — email already registered.

---

### `POST /auth/login`

Authenticate and create a session.

**Body**
| Field | Type | Required |
|-------|------|----------|
| `email` | string (email) | yes |
| `password` | string (min 8) | yes |

**Response** `200`
```json
{
  "data": {
    "user": {
      "id": "usr_...",
      "email": "user@example.com",
      "emailVerifiedAt": "2025-01-01T00:00:00.000Z",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Errors:** `401` — invalid email or password.

---

### `POST /auth/logout`

Revoke the current session. Requires user session.

**Response** `200`
```json
{ "data": { "ok": true } }
```

---

### `POST /auth/verify-email`

Verify an email address with a token (sent during registration).

**Body**
| Field | Type | Required |
|-------|------|----------|
| `token` | string | yes |

**Response** `200`
```json
{ "data": { "verifiedAt": "..." } }
```

**Errors:** `400` — invalid or expired token.

---

### `POST /auth/forgot-password`

Request a password reset. Always returns success to prevent email enumeration.

**Body**
| Field | Type | Required |
|-------|------|----------|
| `email` | string (email) | yes |

**Response** `200`
```json
{ "data": { "ok": true } }
```

---

### `POST /auth/reset-password`

Reset password using a token from `/auth/forgot-password`.

**Body**
| Field | Type | Required |
|-------|------|----------|
| `token` | string | yes |
| `password` | string (min 8) | yes |

**Response** `200`
```json
{ "data": { "ok": true } }
```

**Errors:** `400` — invalid or expired token.

---

### `POST /auth/change-password`

Change the authenticated user's password. Requires user session.

**Body**
| Field | Type | Required |
|-------|------|----------|
| `currentPassword` | string (min 8) | yes |
| `newPassword` | string (min 8) | yes |

**Response** `200`
```json
{ "data": { "ok": true } }
```

**Errors:** `401` — current password is incorrect.

---

### `GET /auth/me`

Get the authenticated user's profile. Requires user session.

**Response** `200`
```json
{
  "data": {
    "id": "usr_...",
    "email": "user@example.com",
    "email_verified_at": "2025-01-01T00:00:00.000Z",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

### `GET /auth/sessions`

List all sessions for the authenticated user. Requires user session.

**Response** `200`
```json
{
  "data": [
    {
      "id": "sess_...",
      "created_at": "...",
      "expires_at": "...",
      "revoked_at": null
    }
  ]
}
```

---

### `DELETE /auth/sessions/:id`

Revoke a specific session. Requires user session.

**Response** `200`
```json
{ "data": { "ok": true } }
```

**Errors:** `404` — session not found.

---

## Account API Keys

*All endpoints require user session (cookie).*

### `POST /account/api-keys`

Create an account-level master API key. This key can be used by external services to programmatically create projects.

**Body**
| Field | Type | Required |
|-------|------|----------|
| `name` | string | no |

**Response** `201`
```json
{
  "data": {
    "id": "aak_...",
    "key": "mg_ak_...",
    "keyPrefix": "mg_ak_",
    "createdAt": "..."
  }
}
```

> ⚠️ The full `key` is only returned once at creation time. Store it securely.

---

### `GET /account/api-keys`

List all account API keys. Only the prefix is shown (not the full key).

**Response** `200`
```json
{
  "data": [
    {
      "id": "aak_...",
      "name": "My Integration",
      "key_prefix": "mg_ak_",
      "created_at": "...",
      "revoked_at": null
    }
  ]
}
```

---

### `DELETE /account/api-keys/:keyId`

Revoke an account API key.

**Response** `200`
```json
{ "data": { "ok": true } }
```

**Errors:** `404` — API key not found or already revoked.

---

## API Project Management

*All endpoints require account API key via `Authorization: Bearer mg_ak_...`*

### `POST /api/projects`

Create a new project programmatically. Automatically generates a project API key for the specified environment. If the account holder has configured a default Resend API key in their user settings, a provider config is also auto-provisioned.

**Body**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| `name` | string (min 1) | yes | — |
| `slug` | string (min 1) | no | auto-generated from `name` |
| `environment` | `"development"` \| `"preview"` \| `"production"` | no | `"development"` |

**Response** `201`
```json
{
  "data": {
    "id": "proj_...",
    "user_id": "usr_...",
    "name": "my-app",
    "slug": "my-app",
    "created_at": "...",
    "updated_at": "...",
    "environment": "development",
    "projectApiKeys": [
      {
        "id": "pak_...",
        "key": "mg_pk_test_...",
        "keyPrefix": "mg_pk_test_",
        "environment": "development",
        "createdAt": "..."
      }
    ]
  }
}
```

> ⚠️ The project API key (`key`) is only returned once. Store it securely.

---

## Projects

*All endpoints require user session (cookie).*

### `GET /`

List all projects for the authenticated user.

**Response** `200`
```json
{
  "data": [
    {
      "id": "proj_...",
      "user_id": "usr_...",
      "name": "My App",
      "slug": "my-app",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### `POST /`

Create a new project.

**Body**
| Field | Type | Required |
|-------|------|----------|
| `name` | string (min 1) | yes |
| `slug` | string (min 1) | no |

**Response** `201`
```json
{
  "data": {
    "id": "proj_...",
    "user_id": "usr_...",
    "name": "My App",
    "slug": "my-app",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

### `GET /:id`

Get a single project.

**Response** `200`
```json
{
  "data": {
    "id": "proj_...",
    "user_id": "usr_...",
    "name": "My App",
    "slug": "my-app",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Errors:** `404` — project not found.

---

### `PATCH /:id`

Update a project.

**Body** (all fields optional)
| Field | Type |
|-------|------|
| `name` | string (min 1) |
| `slug` | string (min 1) |

**Response** `200` — returns the updated project.

**Errors:** `404` — project not found.

---

### `DELETE /:id`

Delete a project.

**Response** `200`
```json
{ "data": { "ok": true } }
```

**Errors:** `404` — project not found.

---

## Project API Keys

*All endpoints require user session (cookie).*

### `GET /projects/:id/api-keys`

List all API keys for a project.

**Response** `200`
```json
{
  "data": [
    {
      "id": "pak_...",
      "name": "Production key",
      "key_prefix": "mg_pk_live_",
      "environment": "production",
      "created_at": "...",
      "revoked_at": null
    }
  ]
}
```

**Errors:** `404` — project not found.

---

### `POST /projects/:id/api-keys`

Create a new API key for a project.

**Body**
| Field | Type | Required |
|-------|------|----------|
| `name` | string | no |
| `environment` | `"development"` \| `"preview"` \| `"production"` | yes |

**Response** `201`
```json
{
  "data": {
    "id": "pak_...",
    "key": "mg_pk_live_...",
    "keyPrefix": "mg_pk_live_",
    "environment": "production",
    "createdAt": "..."
  }
}
```

> ⚠️ The full key is only returned once at creation.

**Errors:** `404` — project not found.

---

### `DELETE /projects/:id/api-keys/:keyId`

Revoke a project API key.

**Response** `200`
```json
{ "data": { "ok": true } }
```

**Errors:** `404` — project or key not found.

---

## Provider Configs

*All endpoints require user session (cookie).*

### `GET /projects/:id/provider-configs`

List provider configurations for a project. Encrypted secrets are not returned.

**Response** `200`
```json
{
  "data": [
    {
      "id": "pcfg_...",
      "project_id": "proj_...",
      "provider_type": "resend",
      "mode": "send",
      "environment": "production",
      "default_from": "noreply@example.com",
      "allowed_domains_json": "[\"example.com\"]",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### `POST /projects/:id/provider-configs`

Create a provider configuration. The config secrets are encrypted before storage and validated against the provider API.

**Body**
| Field | Type | Required |
|-------|------|----------|
| `providerType` | string | yes |
| `config.apiKey` | string (min 1) | yes |
| `config.webhookSecret` | string (min 1) | no |
| `mode` | `"send"` \| `"capture"` \| `"send_and_capture"` | yes |
| `environment` | `"development"` \| `"preview"` \| `"production"` | yes |
| `defaultFrom` | string | no |
| `allowedDomains` | string[] | no |

**Response** `201`
```json
{
  "data": {
    "id": "pcfg_...",
    "providerType": "resend",
    "mode": "send",
    "environment": "production",
    "defaultFrom": "noreply@example.com",
    "allowedDomains": ["example.com"],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### `PATCH /projects/:id/provider-configs/:configId`

Update a provider configuration. Supports partial updates — omitted fields retain their current values.

**Body** (all fields optional)
| Field | Type |
|-------|------|
| `providerType` | string |
| `config` | `{ apiKey?: string, webhookSecret?: string }` |
| `mode` | `"send"` \| `"capture"` \| `"send_and_capture"` |
| `environment` | `"development"` \| `"preview"` \| `"production"` |
| `defaultFrom` | string |
| `allowedDomains` | string[] |

**Response** `200` — returns the updated config (without secrets).

**Errors:** `404` — provider config not found.

---

### `POST /projects/:id/provider-configs/:configId/validate`

Validate a provider configuration by calling the provider's verification endpoint.

**Response** `200`
```json
{ "data": { "ok": true } }
```

**Errors:** `400` — validation failed (provider returned an error).

---

## Messages

### `POST /messages`

Send an email. Requires project API key via `Authorization: Bearer mg_pk_live_...` or `mg_pk_test_...`.

The API key prefix determines the environment:
- `mg_pk_live_` → production (sends via provider, or captures if mode is `capture`)
- `mg_pk_test_` → development/preview (captures by default)

**Headers**
| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | yes | `Bearer <project-api-key>` |
| `Idempotency-Key` | no | Deduplication key (SHA-256 hashed, stored in KV for 24h) |

**Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string (email) \| string[] (email) | yes | Recipient(s) |
| `from` | string | no* | Sender address (*required if no `default_from` on provider config) |
| `subject` | string | no* | Subject line (*required when not using `templateId`) |
| `html` | string | no* | HTML body (*required when not using `templateId`) |
| `text` | string | no | Plain text body |
| `templateId` | string | no | Use a stored template instead of inline content |
| `data` | object | no* | Template variables (*required when using `templateId`) |
| `cc` | string[] (email) | no | CC recipients |
| `bcc` | string[] (email) | no | BCC recipients |
| `replyTo` | string (email) | no | Reply-to address |
| `tags` | Record\<string, string\> | no | Provider tags for tracking |

**Sending Modes by Environment:**

| Environment | Default Mode | Behavior |
|-------------|-------------|----------|
| `development` | `capture` | Stores message in DB/R2, does not send |
| `preview` | `capture` | Stores message in DB/R2, does not send |
| `production` | `send` | Sends via provider, does not store content in R2 |

Provider config can override the default mode with `send_and_capture` to both send and store.

**Response** `201`
```json
{
  "data": {
    "id": "msg_...",
    "project_id": "proj_...",
    "environment": "production",
    "to_address": "user@example.com",
    "from_address": "noreply@example.com",
    "subject": "Welcome",
    "status": "sent",
    "provider": "resend",
    "provider_message_id": "re_...",
    "created_at": "...",
    "sent_at": "...",
    ...
  }
}
```

Message statuses: `queued`, `sent`, `failed`, `captured`.

**Errors:**
- `400` — `validation_error`, `missing_from`, `invalid_from_domain`, `provider_not_configured`
- `401` — unauthorized

---

### `GET /messages`

List messages. Supports both project API key auth (scoped to that project) and user session auth (scoped to all owned projects).

**Auth:** `Authorization: Bearer <project-api-key>` or session cookie.

**Query Parameters**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `project` | string | — | Filter by project ID (session auth only) |
| `environment` | string | — | Filter by environment |
| `to` | string | — | Filter by recipient address |
| `from` | string | — | Filter by sender address |
| `status` | string | — | Filter by status |
| `dateFrom` | string (ISO 8601) | — | Filter created_at >= value |
| `dateTo` | string (ISO 8601) | — | Filter created_at <= value |
| `cursor` | string | — | Cursor for pagination (from previous response) |
| `limit` | number | 20 | Items per page (max 100) |

**Response** `200`
```json
{
  "data": {
    "items": [ ... ],
    "nextCursor": "base64-encoded-cursor-or-null"
  }
}
```

Pagination uses cursor-based encoding (base64 of `{ createdAt, id }`).

---

### `GET /messages/:id`

Get a single message with all its events.

**Auth:** `Authorization: Bearer <project-api-key>` or session cookie.

**Response** `200`
```json
{
  "data": {
    "id": "msg_...",
    "project_id": "proj_...",
    "to_address": "user@example.com",
    "from_address": "noreply@example.com",
    "subject": "Welcome",
    "status": "sent",
    "created_at": "...",
    ...,
    "events": [
      {
        "id": "mevt_...",
        "message_id": "msg_...",
        "type": "delivered",
        "provider": "resend",
        "payload_json": "{...}",
        "created_at": "..."
      }
    ]
  }
}
```

**Errors:** `404` — message not found.

---

## Test Inboxes

### `GET /test-inboxes/:inbox/messages`

List captured messages for a test inbox. Only available for `development` and `preview` environments.

**Auth:** `Authorization: Bearer <project-api-key>` or session cookie.

The inbox identifier format is `{projectSlug}-{environment}`:
- `my-app-development`
- `my-app-preview`

**Query Parameters**
| Param | Type | Default |
|-------|------|---------|
| `limit` | number | 50 (max 100) |

**Response** `200`
```json
{
  "data": [
    {
      "id": "msg_...",
      "project_id": "proj_...",
      "environment": "development",
      "to_address": "user@example.com",
      "from_address": "noreply@example.com",
      "subject": "Welcome",
      "status": "captured",
      "created_at": "..."
    }
  ]
}
```

**Errors:** `400` — invalid inbox format or invalid environment. `404` — project not found.

---

## Templates

*All template endpoints accept both project API key and user session authentication.*

### `GET /projects/:projectId/templates`

List templates for a project.

**Query Parameters**
| Param | Type | Default |
|-------|------|---------|
| `limit` | number | 50 (max 100) |
| `offset` | number | 0 |

**Response** `200`
```json
{
  "data": [
    {
      "id": "tpl_...",
      "project_id": "proj_...",
      "name": "welcome-email",
      "description": "Welcome email for new users",
      "subject": "Welcome, {{name}}!",
      "html": "<h1>Hello {{name}}</h1>",
      "text": "Hello {{name}}",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### `POST /projects/:projectId/templates`

Create a template.

**Body**
| Field | Type | Required |
|-------|------|----------|
| `name` | string (min 1, max 255) | yes |
| `subject` | string (min 1) | yes |
| `html` | string \| null | no |
| `text` | string \| null | no |
| `description` | string (max 1000) \| null | no |

At least one of `html` or `text` should be provided.

**Response** `201` — returns the created template.

---

### `GET /projects/:projectId/templates/:templateId`

Get a single template.

**Response** `200` — returns the template.

**Errors:** `404` — template not found.

---

### `PATCH /projects/:projectId/templates/:templateId`

Update a template. All fields are optional — only provided fields are updated.

**Body** (all optional)
| Field | Type |
|-------|------|
| `name` | string (min 1, max 255) |
| `subject` | string (min 1) |
| `html` | string \| null |
| `text` | string \| null |
| `description` | string (max 1000) \| null |

**Response** `200` — returns the updated template.

---

### `DELETE /projects/:projectId/templates/:templateId`

Delete a template.

**Response** `200`
```json
{ "data": { "deleted": true } }
```

---

## Webhooks

### `POST /webhooks/providers/resend`

Inbound webhook for Resend events. This endpoint is called by Resend when email delivery events occur (delivered, bounced, opened, clicked, complained). It verifies the Svix signature against all Resend provider configs and records matching events.

**No authentication required** — signature verification is performed internally.

**Response** `200`
```json
{ "data": { "ok": true } }
```

**Errors:** `401` — webhook could not be verified against any provider config.

---

## Message Event Types

Events recorded from provider webhooks:

| Type | Description |
|------|-------------|
| `created` | Message created in Pietru |
| `queued` | Message queued for sending |
| `sent` | Message sent to provider |
| `delivered` | Email delivered to recipient |
| `opened` | Email opened by recipient |
| `clicked` | Link in email clicked |
| `bounced` | Email bounced |
| `complained` | Recipient marked as spam |
| `failed` | Sending failed |
