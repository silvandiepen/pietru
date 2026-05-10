# Pietru Integration Guide

This guide explains how external projects integrate with Pietru to send transactional emails.

**API Base URL:** `https://api.pietru.dev`

---

## Overview

Pietru provides a centralized mail gateway: instead of each project managing its own email provider credentials, templates, and sending logic, projects send emails through Pietru's API. This gives you:

- **Unified mail management** — one dashboard for all projects
- **Environment-aware sending** — dev/preview emails are captured, not sent
- **Template management** — create and update templates without deploying code
- **Message tracking** — delivery, bounce, open, and click events via webhooks

## Integration Flow

```
1. Account holder creates an account in the Pietru dashboard
2. Account holder creates an Account API Key (POST /account/api-keys)
3. Account holder configures default Resend API key in settings
4. Account holder shares the Account API Key with the external project
5. External project creates a project via API (POST /api/projects)
6. External project receives a Project API Key
7. External project sends messages using the Project API Key
```

---

## Step 1: Create an Account API Key

The account holder creates this in the dashboard or via the API (while logged in):

```bash
curl -X POST https://api.pietru.dev/account/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<session-cookie>" \
  -d '{"name": "kod-integration"}'
```

**Response:**
```json
{
  "data": {
    "id": "aak_abc123",
    "key": "mg_ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "keyPrefix": "mg_ak_",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

> The full `key` is shown only once. Store it securely — it grants access to create projects on your behalf.

## Step 2: Configure Default Resend API Key

In the Pietru dashboard, the account holder sets their default Resend API key in user settings. This allows auto-provisioning of provider configs when projects are created via the API.

If no default Resend key is set, projects can still be created, but a provider config must be added manually via the dashboard or API before sending production emails.

## Step 3: Create a Project

The external project uses the account API key to create a project:

```bash
curl -X POST https://api.pietru.dev/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mg_ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{"name": "kod", "environment": "production"}'
```

**Body fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | yes | — | Project name |
| `slug` | string | no | auto from name | URL-safe slug |
| `environment` | `"development"` \| `"preview"` \| `"production"` | no | `"development"` | Key environment |

**Response:**
```json
{
  "data": {
    "id": "proj_xyz789",
    "user_id": "usr_...",
    "name": "kod",
    "slug": "kod",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z",
    "environment": "production",
    "projectApiKeys": [
      {
        "id": "pak_def456",
        "key": "mg_pk_live_yyyyyyyyyyyyyyyyyyyyyyyy",
        "keyPrefix": "mg_pk_live_",
        "environment": "production",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

Save the `projectApiKeys[0].key` — this is the project API key used to send messages.

If the account holder has a default Resend API key configured, a provider config is automatically created for the specified environment.

---

## Step 4: Send Messages

### Direct Email (no template)

```bash
curl -X POST https://api.pietru.dev/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mg_pk_live_yyyyyyyyyyyyyyyyyyyyyyyy" \
  -d '{
    "to": "user@example.com",
    "from": "noreply@yourdomain.com",
    "subject": "Welcome to Kod",
    "html": "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
    "text": "Welcome! Thanks for signing up."
  }'
```

### Using a Template

First, create a template (via dashboard or API):

```bash
curl -X POST https://api.pietru.dev/projects/proj_xyz789/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mg_pk_live_yyyyyyyyyyyyyyyyyyyyyyyy" \
  -d '{
    "name": "welcome-email",
    "subject": "Welcome, {{user.name}}!",
    "html": "<h1>Hello {{user.name}}</h1><p>Thanks for joining {{app.name}}.</p>",
    "text": "Hello {{user.name}}, thanks for joining {{app.name}}."
  }'
```

Then send using the template:

```bash
curl -X POST https://api.pietru.dev/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mg_pk_live_yyyyyyyyyyyyyyyyyyyyyyyy" \
  -d '{
    "to": "user@example.com",
    "from": "noreply@yourdomain.com",
    "templateId": "tpl_abc123",
    "data": {
      "user": {
        "name": "Alice"
      },
      "app": {
        "name": "Kod"
      }
    }
  }'
```

### Idempotent Sends

To prevent duplicate messages on retries, use the `Idempotency-Key` header:

```bash
curl -X POST https://api.pietru.dev/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mg_pk_live_yyyyyyyyyyyyyyyyyyyyyyyy" \
  -H "Idempotency-Key: unique-transaction-id-12345" \
  -d '{ ... }'
```

If the same key is used within 24 hours, the original message is returned without sending again.

### Multiple Recipients

```bash
curl -X POST https://api.pietru.dev/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mg_pk_live_yyyyyyyyyyyyyyyyyyyyyyyy" \
  -d '{
    "to": ["user1@example.com", "user2@example.com"],
    "from": "noreply@yourdomain.com",
    "subject": "Team Update",
    "html": "<p>Here is your weekly update.</p>",
    "cc": ["manager@example.com"],
    "replyTo": "support@yourdomain.com",
    "tags": { "type": "weekly-digest" }
  }'
```

---

## Template Syntax

Pietru uses Mustache-style template rendering with support for dot-notation.

### Variables

```
{{variable}}       → HTML-escaped output
{{{variable}}}     → Raw (unescaped) output
```

### Dot Notation

Access nested objects with dots:

```
{{user.name}}          → "Alice"
{{user.address.city}}  → "San Francisco"
```

### Example

**Template subject:**
```
Welcome, {{user.name}}! Your order #{{order.id}} is confirmed.
```

**Template HTML:**
```html
<h1>Hello {{{user.name}}}</h1>
<p>Thank you for your order!</p>
<table>
  <tr><td>Order</td><td>{{order.id}}</td></tr>
  <tr><td>Total</td><td>${{order.total}}</td></tr>
</table>
<p>Track your order at <a href="{{order.trackingUrl}}">{{order.trackingUrl}}</a></p>
```

**Data payload:**
```json
{
  "user": { "name": "Alice" },
  "order": {
    "id": "ORD-12345",
    "total": "49.99",
    "trackingUrl": "https://tracking.example.com/ord-12345"
  }
}
```

**Rules:**
- Double mustache `{{ }}` — value is HTML-escaped (safe for user content)
- Triple mustache `{{{ }}}` — value is inserted raw (use for trusted HTML)
- Undefined variables are left as-is (the `{{var}}` placeholder remains)
- Dot notation traverses nested objects — returns empty if path doesn't exist

---

## Environment Modes

The API key prefix determines the environment, and the environment determines the default sending behavior:

| Key Prefix | Environment | Default Mode | Behavior |
|------------|-------------|-------------|----------|
| `mg_pk_test_` | development | `capture` | Message stored in DB + R2, not sent |
| `mg_pk_test_` | preview | `capture` | Message stored in DB + R2, not sent |
| `mg_pk_live_` | production | `send` | Message sent via provider, content not stored in R2 |

The provider config can override the default mode:

| Mode | Behavior |
|------|----------|
| `capture` | Stores message and content in DB/R2, never sends |
| `send` | Sends via provider, does not store content in R2 |
| `send_and_capture` | Sends via provider AND stores content in DB/R2 |

**Development workflow:** Use `mg_pk_test_` keys during development. Emails are captured and viewable via the test inbox endpoint, so you can inspect them without sending real emails.

---

## Test Inboxes

Captured messages (in development/preview) can be retrieved via test inboxes:

```bash
# List captured messages for project slug "kod" in development
curl https://api.pietru.dev/test-inboxes/kod-development/messages \
  -H "Authorization: Bearer mg_pk_test_yyyyyyyyyyyyyyyyyyyyyyyy"
```

The inbox format is `{slug}-{environment}`. Only `development` and `preview` environments are supported.

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable description"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `unauthorized` | 401 | Missing or invalid API key / session |
| `validation_error` | 400 | Request body failed validation |
| `not_found` | 404 | Resource not found |
| `missing_from` | 400 | No `from` address and no default configured |
| `invalid_from_domain` | 400 | `from` domain not in allowed domains list |
| `provider_not_configured` | 400 | No provider config for this environment |
| `internal_error` | 500 | Server error |

### Example Error Response

```json
{
  "error": {
    "code": "validation_error",
    "message": "Either html, text, or templateId must be provided"
  }
}
```

---

## Complete Integration Example (JavaScript)

```javascript
const PIETRU_API = 'https://api.pietru.dev';
const ACCOUNT_KEY = process.env.PIETRU_ACCOUNT_KEY;

// Step 1: Create a project (do this once during setup)
async function createProject(name, environment = 'production') {
  const res = await fetch(`${PIETRU_API}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCOUNT_KEY}`,
    },
    body: JSON.stringify({ name, environment }),
  });

  const { data } = await res.json();

  // Store the project API key securely
  return {
    projectId: data.id,
    projectSlug: data.slug,
    apiKey: data.projectApiKeys[0].key,
  };
}

// Step 2: Send a welcome email
async function sendWelcomeEmail(apiKey, { to, from, userName, appName }) {
  const res = await fetch(`${PIETRU_API}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      to,
      from,
      templateId: 'tpl_welcome',
      data: {
        user: { name: userName },
        app: { name: appName },
      },
    }),
  });

  const { data, error } = await res.json();
  if (error) throw new Error(error.message);
  return data;
}

// Step 3: Send a direct email with idempotency
async function sendDirectEmail(apiKey, { idempotencyKey, to, from, subject, html, text }) {
  const res = await fetch(`${PIETRU_API}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ to, from, subject, html, text }),
  });

  const { data, error } = await res.json();
  if (error) throw new Error(error.message);
  return data;
}

// Usage
const project = await createProject('my-saas-app');
await sendWelcomeEmail(project.apiKey, {
  to: 'user@example.com',
  from: 'noreply@myapp.com',
  userName: 'Alice',
  appName: 'MyApp',
});
```

---

## API Key Reference

| Key Type | Prefix | Scope | Usage |
|----------|--------|-------|-------|
| Account API Key | `mg_ak_` | Account-wide | Create projects programmatically |
| Project API Key (prod) | `mg_pk_live_` | Single project, production | Send production emails |
| Project API Key (dev/preview) | `mg_pk_test_` | Single project, dev/preview | Send captured emails for testing |
