# Pietru — Full Product Specification

> The mailman for your projects. One API key, email handled.

## Vision

Pietru is a **self-hosted email platform** for Sil's project ecosystem. Instead of setting up email infrastructure per project, throw in a Pietru API key and Pietru handles: sending, receiving, tracking, templates, mailing lists, newsletters, and deliverability.

Pietru is **not** competing with Resend or Mailchimp. It's the internal email spine — like Lezu handles translations, Pietru handles mail. If others find it useful, great. But the primary user is Sil.

## Architecture

```
pietru.dev/
├── apps/
│   ├── api/          # Hono Worker — D1, R2, KV bindings
│   ├── dashboard/    # Vue 3 + Vite — app.pietru.dev
│   ├── docs/         # Girk (Markdown static site) — docs.pietru.dev
│   └── marketing/    # Vue 3 + Vite — pietru.dev
├── packages/
│   ├── auth/         # Encryption, API keys, passwords, tokens
│   ├── core/         # ID generation, address parsing, templates, system emails
│   ├── db/           # Migrations (snake_case, auto-inc IDs)
│   ├── providers/    # Resend, SES (AWS Sig V4), Mailgun
│   ├── pietru-sdk/   # TypeScript SDK (client, themes, webhooks)
│   └── validation/   # Zod schemas
```

### Services

| Service | URL | Deploy |
|---------|-----|--------|
| Marketing | pietru.dev | CF Pages (`pietru-marketing`) |
| Dashboard | app.pietru.dev | CF Pages (`pietru-dashboard`) |
| Docs | docs.pietru.dev | CF Pages (`pietru-docs`) |
| API | api.pietru.dev | CF Worker (`pietru-api`) |

### Infra

- **D1**: `pietru-production`
- **R2**: `pietru-storage` (raw email caching)
- **KV**: `ccf2e217b60d44e4bd6aeff05aaa52b6`
- **SES**: eu-west-1, shared account for Pietru SMTP

---

## Current Features (Built)

### ✅ Authentication & Users
- Register, login, logout (JWT sessions in cookies)
- Email verification, password reset
- User sessions management (list, revoke)
- Admin users (`is_admin` flag)

### ✅ Projects
- CRUD projects with slugs
- Environment support: `live`, `preview`, `test`
- Projects scope all email activity (messages, templates, lists, hooks)

### ✅ API Keys
- **Project API keys**: `mg_pk_live_*` / `mg_pk_test_*` (per-project, environment-scoped)
- **Account API keys**: `mg_ak_*` (account-level, cross-project)
- SHA-256 hashed storage, prefix-based lookup

### ✅ Outbound Email Providers
Four provider options per project:

| Provider | Credentials | Notes |
|----------|-------------|-------|
| **Resend** | User's own API key | HTTP API |
| **Amazon SES** | User's own AWS creds + region | AWS Sig V4 signing (no SDK) |
| **Mailgun** | User's own API key + domain | Form-encoded POST |
| **Pietru SMTP** | None (uses shared SES) | Domain verification required first |

- Provider credentials are AES-256-GCM encrypted at rest
- `provider_type === 'pietru'` injects system SES worker secrets, no user creds needed

### ✅ Domain Verification
- Verify domains in Pietru's shared SES account
- Flow: user adds domain → API creates SES identity → fetches DKIM CNAME tokens → user adds DNS records → API verifies
- Pre-send guard: blocks sends from unverified domains
- Global uniqueness: one verification per domain across system

### ✅ Message Sending
- `POST /send` — single message (direct HTML/text or template-based)
- Idempotency keys (hash stored, dedup on retry)
- Mustache-based template rendering with variable extraction
- Message statuses: `queued` → `sent` → `delivered` / `failed` / `bounced`
- Per-message tracking: to, from, cc, bcc, reply-to, subject, html, text, tags

### ✅ Message Tracking & Events
- Message events: `sent`, `delivered`, `bounced`, `opened`, `clicked`, `complained`
- Webhook ingestion from SES SNS, Resend, Mailgun
- Event timeline per message
- Stats aggregation (counts by type, per project)

### ✅ Inbound Email
- Cloudflare Email Routing catch-all (all subdomains)
- Worker `email()` handler parses MIME, stores HTML + text in D1, raw .eml in R2
- Routing priority: reserved addresses → test aliases → project/user slugs
- OTP extraction from email bodies (verification code patterns)

### ✅ Email Hooks
- Webhook triggers on inbound email matching
- Filter types: `tag`, `from_domain`, `subject_regex`, `any`
- HMAC-SHA256 signature on `X-Pietru-Signature` header
- Custom headers support
- Fire via `ctx.waitUntil()` (non-blocking)

### ✅ Reply to Inbound Messages
- `POST /reply` — reply to inbound messages via API

### ✅ Email Templates
- Per-project Mustache templates
- Variable extraction from template body
- CRUD via API + dashboard

### ✅ Mailing Lists
- Per-project lists with soft-delete
- Subscriber management: subscribe, unsubscribe, confirm
- **Double opt-in**: confirmation email with token, public confirmation page
- Subscriber statuses: `pending` → `confirmed` / `unsubscribed`
- Freeform `meta` JSON per subscriber
- Subscribe endpoint supports API key OR session auth (for external websites)
- Re-subscribe flows: resets status, regenerates token, resends confirmation
- Confirmation success redirect via `confirmation_success_url`

### ✅ Test Inboxes & Aliases
- `*@test.pietru.dev` addresses for testing
- Max 100 aliases per user
- Link aliases to projects
- Inbound routing matches test aliases

### ✅ Reserved Addresses
- System-level addresses: `info@`, `finance@`, `accounts@`, `support@`, `legal@`, `security@`
- Always route to admin project
- CRUD via admin API

### ✅ Global Inbox
- All messages across all projects in one view
- Filters: project, status, text search
- Cursor-based pagination

### ✅ Dashboard
- 20 views covering all features above
- Light theme (cream/navy/red design tokens)
- Auth views, project management, messages, inbox, mailing lists, settings, admin

### ✅ SDK
- `pietru-sdk` package: `PietruClient`, template rendering, webhook verification
- Theme config with defaults (colors, fonts, company info)
- Template IDs: newsletter, welcome, verification, notification, minimal
- Zero deps, uses native fetch + Web Crypto

### ✅ Marketing Site
- Vue 3 + @sil/ui + lezu-i18n
- Navy/cream aesthetic, hero with mascot SVG
- Sections: Hero → How It Works → Features → Mailing Lists → Environments → CTA
- Dark/light toggle, language switcher

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, password, admin flag) |
| `user_sessions` | JWT sessions |
| `auth_tokens` | Verification/reset tokens |
| `projects` | Project scoping (name, slug) |
| `project_api_keys` | Per-project API keys (hashed) |
| `account_api_keys` | Account-level API keys (hashed) |
| `provider_configs` | Per-project provider credentials (encrypted) |
| `messages` | All sent/received messages |
| `message_events` | Delivery tracking events |
| `email_templates` | Mustache templates per project |
| `inbound_addresses` | Per-project inbound addresses |
| `email_hooks` | Webhook rules on inbound |
| `reserved_addresses` | System-level address routing |
| `test_aliases` | Test email aliases |
| `domain_verifications` | SES domain verification tracking |
| `mailing_lists` | Per-project mailing lists |
| `mailing_list_subscribers` | List subscribers with status |
| `user_settings` | User preferences |

---

## Planned Features

### 🔲 Broadcast / Campaign Sending (Priority: HIGH)
> Mailing lists exist but can't send to them. This is the biggest gap.

**What's needed:**
- **Campaigns table**: `id`, `project_id`, `mailing_list_id`, `name`, `subject`, `html`, `text`, `template_id`, `status` (draft/scheduled/sending/sent/failed), `scheduled_at`, `sent_at`, `total_recipients`, `sent_count`, `failed_count`
- **Campaign API**: CRUD campaigns, send/schedule, duplicate, cancel
- **Broadcast endpoint**: `POST /campaigns/:id/send` — iterates confirmed subscribers, queues messages
- **Campaign analytics**: per-campaign open/click/bounce rates
- **Dashboard**: Campaign list, detail with stats, compose view
- **Unsubscribe handling**: automatic footer with one-click unsubscribe link per campaign

**New migrations needed:**
- `0011_campaigns.sql`
- `0011_campaign_events.sql` (or add to message_events)

### 🔲 Queue & Retry System (Priority: HIGH)
> Current sends are synchronous. Failed sends have no retry path.

**What's needed:**
- **Message queue**: Durable queue for outgoing messages (Cloudflare Queues or D1-based)
- **Retry logic**: exponential backoff for transient failures (3 retries max)
- **Dead letter queue**: permanently failed messages flagged for inspection
- **Background processing**: `ctx.waitUntil()` or Queue consumer for async send
- **Status tracking**: `queued` → `processing` → `sent` / `retrying` → `delivered` / `failed`

### 🔲 Attachments (Priority: HIGH)
> No file attachment support currently.

**What's needed:**
- **Attachment storage**: R2 bucket for file storage (already have `pietru-storage`)
- **Message attachments table**: `id`, `message_id`, `filename`, `content_type`, `size`, `storage_key`
- **Send API**: multipart support or base64-encoded attachments in JSON
- **Inbound**: extract attachments from MIME parts, store in R2
- **Size limits**: enforce max attachment size (e.g., 10MB per message)
- **Provider compatibility**: SES, Resend, Mailgun all support attachments

**New migration:** `0012_message_attachments.sql`

### 🔲 Scheduled Sends (Priority: MEDIUM)
> No delayed delivery currently.

**What's needed:**
- **Scheduled messages**: `scheduled_at` field on messages (already partially exists: `queued_at`)
- **Scheduler**: cron/scheduled trigger that picks up due messages and sends
- **Campaign scheduling**: campaigns can be scheduled for future delivery
- **Cancel scheduled**: ability to cancel before send
- **Timezone awareness**: sender-specified timezone for scheduled sends

### 🔲 Rate Limiting (Priority: MEDIUM)
> No throttling on send endpoint.

**What's needed:**
- **Per-project limits**: max sends per minute/hour/day
- **Per-key limits**: API key level throttling
- **Provider rate awareness**: respect SES sending limits (per-account)
- **Queue backpressure**: if provider rate limit hit, queue and retry after window
- **HTTP headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **429 responses**: proper rate limit exceeded errors
- **Implementation**: D1-based counter or KV-based sliding window

### 🔲 Suppression / Bounce Management (Priority: MEDIUM)
> No global suppression list to prevent re-sending to bounced addresses.

**What's needed:**
- **Suppression table**: `id`, `project_id`, `email`, `reason` (bounce/complaint/unsubscribe), `source` (manual/auto), `created_at`
- **Auto-suppression**: automatically add bounced/complained addresses
- **Pre-send check**: skip sends to suppressed addresses
- **Suppression API**: CRUD, lookup, export, import
- **Dashboard**: suppression list management per project

**New migration:** `0013_suppressions.sql`

### 🔲 Campaign Composer (Priority: MEDIUM)
> No visual or Markdown-based email composer.

**What's needed:**
- **Markdown composer**: Write in Markdown → Nizel renders to HTML
- **Live preview**: side-by-side editor + preview (like Lezin's approach)
- **Template integration**: start from template, customize per campaign
- **Theme support**: use Pietru SDK themes for consistent branding
- **Image upload**: R2-backed image storage for inline images
- **Not a WYSIWYG**: philosophy is Markdown-native, not drag-and-drop

### 🔲 SMTP Relay Server (Priority: LOW)
> No SMTP server exists — API-only sending.

**What's needed:**
- **SMTP daemon**: listens on port 25/587, accepts SMTP connections
- **Auth**: authenticate via API key as SMTP credentials
- **Message ingestion**: parse SMTP envelope, create message in D1, queue for sending
- **Relay**: forward via configured provider (SES/Resend/Mailgun)
- **NOT a full MTA**: receive → validate → queue → send. No mailbox storage.
- **This is complex**: requires a persistent process (not Worker), separate deployment

---

## API Endpoints (Current)

### Auth
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `POST /v1/auth/forgot-password`
- `POST /v1/auth/reset-password`
- `POST /v1/auth/verify-email`
- `GET /v1/auth/sessions`
- `DELETE /v1/auth/sessions/:id`

### Projects
- `GET /v1/projects`
- `POST /v1/projects`
- `GET /v1/projects/:id`
- `PATCH /v1/projects/:id`
- `DELETE /v1/projects/:id`

### Messages
- `POST /v1/messages/send`
- `GET /v1/messages`
- `GET /v1/messages/:id`
- `GET /v1/messages/:id/events`
- `POST /v1/messages/reply`

### API Keys
- `GET /v1/projects/:id/api-keys`
- `POST /v1/projects/:id/api-keys`
- `DELETE /v1/projects/:id/api-keys/:keyId`
- `GET /v1/account-api-keys`
- `POST /v1/account-api-keys`
- `DELETE /v1/account-api-keys/:keyId`

### Provider Configs
- `GET /v1/projects/:id/provider-configs`
- `POST /v1/projects/:id/provider-configs`
- `PATCH /v1/projects/:id/provider-configs/:configId`
- `DELETE /v1/projects/:id/provider-configs/:configId`
- `POST /v1/projects/:id/provider-configs/:configId/validate`

### Templates
- `GET /v1/projects/:id/templates`
- `POST /v1/projects/:id/templates`
- `GET /v1/projects/:id/templates/:templateId`
- `PATCH /v1/projects/:id/templates/:templateId`
- `DELETE /v1/projects/:id/templates/:templateId`

### Domain Verification
- `GET /v1/projects/:id/domain-verifications`
- `POST /v1/projects/:id/domain-verifications`
- `GET /v1/projects/:id/domain-verifications/:domainId`
- `POST /v1/projects/:id/domain-verifications/:domainId/verify`
- `DELETE /v1/projects/:id/domain-verifications/:domainId`

### Mailing Lists
- `GET /v1/mailing-lists`
- `POST /v1/mailing-lists`
- `GET /v1/mailing-lists/:id`
- `PATCH /v1/mailing-lists/:id`
- `DELETE /v1/mailing-lists/:id`
- `GET /v1/mailing-lists/:id/subscribers`
- `POST /v1/mailing-lists/:id/subscribers`
- `POST /v1/mailing-lists/subscribers/confirm`
- `POST /v1/mailing-lists/subscribers/unsubscribe`
- `DELETE /v1/mailing-lists/:id/subscribers/:subId`

### Inbound
- `GET /v1/projects/:id/inbound-addresses`
- `POST /v1/projects/:id/inbound-addresses`
- `PATCH /v1/projects/:id/inbound-addresses/:addressId`
- `DELETE /v1/projects/:id/inbound-addresses/:addressId`

### Email Hooks
- `GET /v1/projects/:id/email-hooks`
- `POST /v1/projects/:id/email-hooks`
- `PATCH /v1/projects/:id/email-hooks/:hookId`
- `DELETE /v1/projects/:id/email-hooks/:hookId`

### Inbox
- `GET /v1/inbox`
- `GET /v1/inbox/:id`

### Stats
- `GET /v1/stats`

### Test Aliases
- `GET /v1/test-aliases`
- `POST /v1/test-aliases`
- `PATCH /v1/test-aliases/:id`
- `DELETE /v1/test-aliases/:id`

### Admin
- `GET /v1/admin/reserved-addresses`
- `POST /v1/admin/reserved-addresses`
- `PATCH /v1/admin/reserved-addresses/:id`
- `DELETE /v1/admin/reserved-addresses/:id`

### Webhooks (Provider callbacks)
- `POST /v1/webhooks/ses`
- `POST /v1/webhooks/resend`
- `POST /v1/webhooks/mailgun`

---

## Build & Deploy

```bash
# Build packages
for dir in packages/*/; do cd "$dir" && npx tsc -p tsconfig.json && cd -; done

# Test (173 tests)
npm run test

# Deploy API
cd apps/api && CLOUDFLARE_ACCOUNT_ID=8cef251b5fdcf6c6f63db98b7aa49f9a npx wrangler deploy

# Deploy dashboard
cd apps/dashboard && npx vite build && npx wrangler pages deploy dist --project-name=pietru-dashboard --commit-dirty=true

# Deploy marketing
cd apps/marketing && npx vite build && npx wrangler pages deploy dist --project-name=pietru-marketing --commit-dirty=true

# Build docs
cd apps/docs && npx girk && npx wrangler pages deploy public --project-name=pietru-docs --commit-dirty=true

# D1 Migrations
CLOUDFLARE_ACCOUNT_ID=8cef251b5fdcf6c6f63db98b7aa49f9a npx wrangler d1 migrations apply pietru-production --remote
```

## DNS Records (pietru.dev)

| Type | Name | Value |
|------|------|-------|
| MX | pietru.dev | `route1/2/3.mx.cloudflare.net` |
| MX | test.pietru.dev | `route1/2/3.mx.cloudflare.net` |
| MX | bounce.pietru.dev | `feedback-smtp.eu-west-1.amazonses.com` (priority 10) |
| TXT | pietru.dev | SPF |
| TXT | bounce.pietru.dev | `v=spf1 include:amazonses.com ~all` |
| CNAME | `*_._domainkey.pietru.dev` | DKIM tokens → `*.dkim.amazonses.com` |
