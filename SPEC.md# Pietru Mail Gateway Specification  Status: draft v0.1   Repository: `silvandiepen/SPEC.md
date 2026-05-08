# Pietru Mail Gateway Specification

Status: draft v0.1  
Repository: `silvandiepen/pietru`  
Primary domains: `pietru.dev`, `app.pietru.dev`, `api.pietru.dev`  
Primary goal: a fully API-first, Cloudflare-native, multi-tenant mail gateway for sending, capturing, debugging, routing, and tracking outgoing email across projects.

## 1. Overview

Pietru is a centralized mail gateway service for applications. It gives every app one stable API for sending email while Pietru handles provider routing, logging, capture mode, testing, event tracking, and project-level configuration.

Applications should not need to know whether email is sent through Resend, SMTP, Postmark, Mailgun, or another provider. Applications call Pietru. Pietru decides what to do based on the project, environment, provider configuration, and sending mode.

The product should be small, direct, developer-focused, and reliable. It should feel like a useful internal infrastructure product that can later become a public SaaS.

## 2. Product summary

Pietru centralizes:

- email sending
- provider routing
- message logging
- debugging
- test capture mode
- event tracking
- per-project API keys
- per-environment configuration
- provider webhooks
- email inspection
- test inboxes

The core idea:

> One API for every app that sends email.

## 3. Goals

- Provide one consistent email API for all apps.
- Decouple applications from individual email providers.
- Allow provider changes without application changes.
- Enable testing without sending to real inboxes.
- Provide full visibility into outgoing messages.
- Support multiple projects and environments.
- Support project API keys scoped by environment.
- Support capture-only, send-only, and send-and-capture modes.
- Store useful logs for debugging.
- Track provider events such as sent, delivered, bounced, and failed.
- Run fully on Cloudflare infrastructure where possible.
- Expose all product capabilities through `api.pietru.dev`.

## 4. Non-goals for MVP

The MVP should not include:

- custom inbound user domains
- general mailbox hosting
- IMAP
- POP3
- full newsletter tooling
- drag-and-drop template builder
- marketing automation
- contact lists
- campaigns
- bulk sending
- scheduling
- provider fallback
- advanced analytics
- multi-user teams
- custom provider plugins

These can be added later if the core gateway proves useful.

## 5. Product surfaces

Pietru uses three primary domains:

```txt
pietru.dev      -> marketing site, documentation, public landing pages
app.pietru.dev  -> authenticated dashboard
api.pietru.dev  -> public API used by apps and dashboard
```

All meaningful functionality must be available through api.pietru.dev. The dashboard is a client of the API, not a separate privileged backend.

6. Default stack

Use the normal Sil stack:

Vue 3
TypeScript
Vite
@sil/ui
SCSS
BEM-style component classes
shared design tokens
Cloudflare Workers
Cloudflare D1
Cloudflare R2
Cloudflare KV where useful
Cloudflare Queues where useful
Cloudflare Email Workers where useful later
API-first architecture
monorepo structure
reusable packages for core logic, provider adapters, validation, and UI

No traditional server should be required for the MVP.

7. Cloudflare architecture

Pietru should be fully Cloudflare-native.

Recommended services:

Workers for API endpoints.
D1 for relational data: users, projects, API keys, provider configs, messages, events.
R2 for raw email payloads, large HTML bodies, MIME snapshots, attachments, and long-term archives.
KV for short-lived cache, rate-limit counters, verification tokens, and idempotency lookups if appropriate.
Queues for asynchronous sending, retries, webhook processing, and slow provider calls.
Cron Triggers for cleanup, retries, digest jobs, and retention tasks.
Email Workers for future inbound handling and platform-owned addresses.
Turnstile for signup/login abuse protection where needed.

High-level architecture:

Apps / SDKs / Dashboard
  -> api.pietru.dev Worker
    -> Auth + API key validation
    -> Core mail gateway logic
    -> D1 metadata storage
    -> R2 raw body/storage layer
    -> KV cache/idempotency/rate limits
    -> Queue for send jobs
      -> Provider worker
        -> Resend / SMTP / future providers
    -> Provider webhook endpoints
      -> Queue
      -> D1 message events
8. Core concepts
8.1 User

A user owns projects.

A user can:

register with email and password
confirm their email address
log in
reset a forgotten password
manage their profile
create projects
create and revoke API keys
configure providers
view message logs
inspect captured messages
8.2 Project

A project represents one application or product that sends email.

A project contains:

name
slug
owner user
environments
API keys
provider configurations
message logs
message events
sending mode
allowed sender domains
webhooks
rate limits
8.3 Environment

Every project can have separate environments.

Default environments:

development
preview
production

Each environment can have its own:

API keys
provider config
sending mode
default from address
allowed domains
rate limits
8.4 Provider configuration

A provider configuration defines how email is sent for a project/environment.

Initial provider:

Resend

Future providers:

SMTP
Postmark
Mailgun
custom webhook provider
fallback provider chains
8.5 Message

A message is one attempted email send.

A message can be:

queued
sent
captured
failed

A message should always be visible in the dashboard and API, even if sending fails.

8.6 Message event

A message event is an update from the gateway or provider.

Examples:

queued
captured
sent
delivered
bounced
complained
failed
opened
clicked

Open/click tracking is future scope. Do not build it into MVP unless the provider gives it for free and it does not complicate the product.

9. Authentication

Pietru should have its own authentication system.

9.1 User auth

Users register with:

email
password

Required auth flows:

register
email verification
login
logout
forgot password
reset password
change password
update profile
list active sessions
revoke sessions

Passwords must be securely hashed using a strong password hashing strategy suitable for the Workers runtime.

Email verification and password reset tokens must be:

single-use
stored hashed
time-limited
revocable by issuing a new token
9.2 Sessions

Dashboard sessions should use secure HTTP-only cookies.

Session requirements:

stored in D1 or KV with D1 metadata
tied to user ID
revocable
expiring
protected with secure cookie settings
usable by app.pietru.dev against api.pietru.dev
9.3 Project API keys

Project API keys are used by apps to call the sending API.

Example:

Authorization: Bearer mg_pk_xxxxx

Requirements:

generated once
shown once
stored hashed
scoped to project
scoped to environment
revocable
optionally named
optionally restricted by origin/IP later
never stored in plaintext

Prefix format:

mg_pk_live_xxxxx
mg_pk_test_xxxxx

The prefix should help identify key type without exposing secret material.

10. API design

The API must be the source of truth. The dashboard should only call API endpoints.

Base URL:

https://api.pietru.dev
10.1 Send message
POST /messages
Authorization: Bearer mg_pk_xxx
Idempotency-Key: reset-abc123
Content-Type: application/json

Request:

{
  "to": "user@example.com",
  "from": "App <noreply@app.com>",
  "subject": "Reset password",
  "html": "<p>Your code is 1234</p>",
  "text": "Your code is 1234",
  "tags": {
    "type": "password-reset",
    "userId": "abc123"
  }
}

Response:

{
  "id": "msg_123",
  "status": "sent"
}

The endpoint should support synchronous responses but can internally use a queue. For MVP, it may send directly if provider latency is acceptable. The design should allow queue-based sending later without changing the public API.

10.2 Query messages
GET /messages
Authorization: Bearer user-session-or-project-key

Query params:

project
environment
to
from
status
provider
tag
createdAfter
createdBefore
limit
cursor
10.3 Get message details
GET /messages/:id
Authorization: Bearer user-session-or-project-key

Returns:

message metadata
rendered HTML preview URL or body
text body
tags
provider result
events
error details if failed
10.4 Test inbox messages
GET /test-inboxes/:inbox/messages
Authorization: Bearer user-session-or-project-key

Example:

test-user-1@local.test

Captured emails sent to test addresses should be retrievable without ever sending to real inboxes.

10.5 Project endpoints
GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id
10.6 API key endpoints
GET    /projects/:id/api-keys
POST   /projects/:id/api-keys
DELETE /projects/:id/api-keys/:keyId
10.7 Provider config endpoints
GET   /projects/:id/provider-configs
POST  /projects/:id/provider-configs
PATCH /projects/:id/provider-configs/:configId
POST  /projects/:id/provider-configs/:configId/validate
10.8 Webhook endpoints
POST /webhooks/providers/resend
POST /webhooks/providers/postmark
POST /webhooks/providers/mailgun

Only Resend is required for v1.

11. Sending modes

Each project/environment can run in one of three modes.

Mode	Behavior
send	Sends email through configured provider and stores metadata/logs.
capture	Does not send. Stores the message only.
send_and_capture	Sends through provider and stores full captured body for inspection.

Recommended defaults:

development: capture
preview: capture
production: send or send_and_capture depending on project setting
12. Provider system

Provider adapters must implement a small interface.

export interface MailProvider {
  sendEmail(
    message: OutgoingEmail,
    config: ProviderConfig
  ): Promise<ProviderSendResult>;

  validateConfig(config: ProviderConfig): Promise<void>;

  handleWebhook?(payload: unknown, headers: Headers): Promise<ProviderEvent[]>;
}
12.1 Resend provider v1

The first provider should be Resend.

Requirements:

send HTML and text email
support from/to/reply-to/cc/bcc if present
return provider message ID
handle provider errors
validate API key/config where possible
process Resend webhooks if configured
12.2 SMTP provider v2

SMTP can be added later.

SMTP requirements:

host
port
secure mode
username
password
default from
allowed domains

SMTP config secrets must be encrypted before storage.

12.3 Future providers

Future providers:

Postmark
Mailgun
Amazon SES
custom HTTP provider
fallback provider chain
13. Project configuration

Example project/environment config:

export interface ProjectEnvironmentConfig {
  id: string;
  projectId: string;
  environment: 'development' | 'preview' | 'production';
  provider: 'resend' | 'smtp' | 'postmark' | 'mailgun' | 'custom';
  providerConfigId: string;
  mode: 'send' | 'capture' | 'send_and_capture';
  defaultFrom?: string;
  allowedDomains: string[];
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
}

Provider config example:

export interface ProviderConfig {
  id: string;
  projectId: string;
  environment: string;
  providerType: 'resend';
  configEncrypted: string;
  defaultFrom: string;
  allowedDomains: string[];
  mode: 'send' | 'capture' | 'send_and_capture';
  createdAt: string;
  updatedAt: string;
}
14. Message model
export interface Message {
  id: string;
  projectId: string;
  providerConfigId?: string;
  environment: string;

  to: string;
  from: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];

  subject: string;
  html?: string;
  text?: string;

  status: 'queued' | 'sent' | 'captured' | 'failed';

  provider?: string;
  providerMessageId?: string;

  error?: string;
  tags?: Record<string, string>;

  rawStorageKey?: string;
  htmlStorageKey?: string;
  textStorageKey?: string;

  createdAt: string;
  queuedAt?: string;
  sentAt?: string;
  failedAt?: string;
}

For small messages, HTML/text can be stored directly in D1. For larger messages, store bodies in R2 and keep references in D1. The implementation should support moving large bodies to R2 from the start.

15. Message events
export interface MessageEvent {
  id: string;
  messageId: string;
  projectId: string;

  type:
    | 'queued'
    | 'captured'
    | 'sent'
    | 'delivered'
    | 'bounced'
    | 'complained'
    | 'failed';

  provider?: string;
  payload?: unknown;

  createdAt: string;
}

Provider webhook payloads should be stored in a normalized event model, with the raw provider payload stored either in D1 JSON or R2 if large.

16. Test inbox system

The test inbox system allows development and preview environments to capture emails without sending real messages.

Example fake addresses:

test-user-1@local.test
reset-flow@local.test
checkout@local.test

Captured messages are grouped by inbox name.

Endpoint:

GET /test-inboxes/test-user-1/messages

Rules:

capture mode always stores messages.
send_and_capture stores messages and also sends them.
send stores metadata but may not store full body unless configured.
Test inboxes are project/environment scoped.
17. Platform-owned inbound addresses

Custom user domains are out of scope for v1.

For now, Pietru may support platform-owned inbound addresses under:

@pietru.dev

Possible future internal address format:

project-slug@pietru.dev
project-slug+tag@pietru.dev

This should be treated as future or optional infrastructure, not required for the sending gateway MVP.

If implemented, incoming mail flow:

Email to project-slug@pietru.dev
  -> Cloudflare Email Routing
  -> Email Worker
  -> parse local part and plus tag
  -> store metadata in D1
  -> store raw MIME / attachments in R2
  -> expose through API

Do not support custom user domains in v1. Custom inbound domains would require domain verification, Cloudflare DNS/MX setup, routing configuration, and a paid plan. Keep this out of MVP.

18. Project hooks

Each project can define optional webhooks.

Example:

export interface ProjectHooks {
  onSend?: string;
  onFail?: string;
  onDelivered?: string;
  onBounce?: string;
}

Use cases:

forward events to the app
update internal DBs
send analytics events
trigger workflows
connect to an event bus later

Hooks are not required for MVP, but the data model should allow them later.

19. Security requirements
User passwords must be securely hashed.
Project API keys must be hashed.
Provider API keys must be encrypted.
Password reset tokens must be hashed.
Email verification tokens must be hashed.
Domain restrictions must be enforced before sending.
Rate limits must apply per project/environment/API key.
Idempotency keys must be supported for send requests.
Message access must be scoped to the owning project/user.
Provider webhook signatures must be verified where supported.
Sensitive provider config must never be returned through the API.
Logs must not expose API keys or provider secrets.
20. Rate limiting

Rate limits should exist at multiple levels:

global abuse limits
user account limits
project limits
environment limits
API key limits
provider limits

MVP can start with simple project-level and API-key-level limits.

21. Idempotency

POST /messages must support Idempotency-Key.

Behavior:

Same project + same idempotency key returns the original message result.
Prevents duplicate password reset, verification, and billing emails.
Store idempotency records in KV or D1.
Idempotency records should expire after a defined period, for example 24 hours.
22. Database schema

Initial D1 schema:

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
  slug TEXT NOT NULL,
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
23. Dashboard MVP

The dashboard lives at:

https://app.pietru.dev

Views:

23.1 Auth
Register.
Verify email.
Login.
Forgot password.
Reset password.
Profile.
23.2 Projects
List projects.
Create project.
Edit project name/slug.
View provider status.
View environment configuration.
23.3 API keys
Create key.
Show key once.
List keys.
Revoke key.
Filter by environment.
23.4 Provider settings
Select provider.
Add provider API key.
Set default from address.
Set allowed domains.
Validate config.
Choose sending mode.
23.5 Messages
List messages.
Filter/search messages.
Inspect email content.
See provider status.
See events.
See errors.
Copy message ID.
23.6 Test inboxes
List captured inboxes.
Open inbox.
View captured emails.
Inspect HTML/text.
Copy raw content.
24. UI direction

The UI should be minimal and functional.

Use @sil/ui and the default design system.

The dashboard should not feel like a heavy enterprise admin panel. It should feel like a small developer tool.

Priorities:

clear project switcher
clear environment indicator
obvious send/capture mode
fast message search
readable email inspection
clear error messages
simple setup instructions
25. Suggested monorepo structure
apps/
  marketing/              # pietru.dev
  dashboard/              # app.pietru.dev
  api/                    # api.pietru.dev Worker

packages/
  core/                   # shared business logic
  auth/                   # auth/session/password/token logic
  db/                     # D1 schema, migrations, queries
  providers/              # mail provider adapters
  validation/             # request schemas and validation
  ui/                     # optional wrappers around @sil/ui patterns
  sdk/                    # future JS/TS SDK
  config/                 # shared config/types

workers/
  queue-mail/             # optional async send worker
  email-inbound/          # optional future Email Worker
  cron/                   # cleanup/retry tasks
26. MVP scope

Build first:

monorepo setup
marketing shell
dashboard shell
API Worker
D1 migrations
user registration
email verification
login/logout
forgot/reset password
projects
project API keys
provider config for Resend
POST /messages
capture mode
send mode through Resend
message storage
message list/detail UI
basic test inbox view
basic rate limiting
idempotency support
27. Future features
Templates
Scheduling
Bulk sending
Provider fallback
Provider health checks
Analytics
SMTP provider
Postmark provider
Mailgun provider
Public SaaS pricing
Teams
Custom inbound domains as Pro feature
Hosted @pietru.dev inbound addresses
API SDK
CLI
Webhook replay
Message replay
Delivery insights
28. Acceptance criteria for MVP

The MVP is successful when:

A user can register with email/password.
The user can verify their email.
The user can log in to app.pietru.dev.
The user can create a project.
The user can create a project API key.
The user can configure Resend for a project/environment.
An app can call POST /messages with the project API key.
Pietru can send through Resend in send mode.
Pietru can capture without sending in capture mode.
Pietru can send and store in send_and_capture mode.
The dashboard shows message logs.
The dashboard shows errors and provider result details.
Test inboxes can show captured messages.
All core actions are available through api.pietru.dev.
29. Summary

Pietru is a centralized, multi-project email gateway that standardizes sending, enables testing, and provides full visibility into outgoing mail.

It should start small with Resend, capture mode, message logging, and a clean dashboard. The architecture must remain API-first and Cloudflare-native so it can later grow into a public SaaS without changing the core model.
