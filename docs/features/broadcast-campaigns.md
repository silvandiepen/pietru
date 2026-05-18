# Broadcast / Campaign Sending — Implementation Spec

> **Status:** DRAFT — awaiting builder implementation  
> **Priority:** HIGH  
> **Depends on:** Queue & Retry system (async sending)  
> **Blocks:** Campaign composer, Scheduled sends (campaign scheduling)

---

## Overview

Pietru can manage mailing list subscribers (CRUD, double opt-in) but cannot **send** to them. This spec adds campaigns: compose an email, target a mailing list, and broadcast to all confirmed subscribers.

Each campaign creates individual `messages` records — one per subscriber — so delivery tracking, open/click/bounce stats, and event timelines work identically to transactional messages.

---

## Database Schema

### New migration: `0011_campaigns.sql`

```sql
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mailing_list_id TEXT NOT NULL REFERENCES mailing_lists(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT,
  text TEXT,
  template_id TEXT REFERENCES email_templates(id),
  from_address TEXT NOT NULL,
  reply_to TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  scheduled_at TEXT,
  sent_at TEXT,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  bounced_count INTEGER NOT NULL DEFAULT 0,
  unsubscribed_count INTEGER NOT NULL DEFAULT 0,
  complained_count INTEGER NOT NULL DEFAULT 0,
  unsubscribe_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_campaigns_project ON campaigns(project_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled ON campaigns(status, scheduled_at) WHERE status = 'scheduled';

-- Add campaign_id to messages so individual sends can be traced back
ALTER TABLE messages ADD COLUMN campaign_id TEXT REFERENCES campaigns(id);
CREATE INDEX idx_messages_campaign ON messages(campaign_id);
```

### Why a flat `campaigns` table (not `campaign_messages`)

Campaign stats (`sent_count`, `opened_count`, etc.) are aggregated from the `messages` table at read time via `SELECT status, COUNT(*) FROM messages WHERE campaign_id = ? GROUP BY status`. The counter columns on `campaigns` are denormalized caches for fast dashboard rendering — updated after each batch of sends completes.

We do **not** create a separate `campaign_messages` join table. Each campaign send creates a standard `messages` row with `campaign_id` set. This reuses the entire existing message tracking pipeline: events, webhooks, stats, dashboard.

---

## API Endpoints

### CRUD

All endpoints require session auth (dashboard) or project API key.

```
GET    /v1/campaigns                        — list campaigns for project (?project=, ?status=)
POST   /v1/campaigns                        — create draft campaign
GET    /v1/campaigns/:id                    — get campaign with live stats
PATCH  /v1/campaigns/:id                    — update draft (subject, html, text, from, etc.)
DELETE /v1/campaigns/:id                    — delete draft (only drafts can be deleted)
POST   /v1/campaigns/:id/duplicate          — clone campaign as new draft
```

### Sending

```
POST   /v1/campaigns/:id/send               — send immediately (draft → sending → sent)
POST   /v1/campaigns/:id/schedule           — schedule for future (draft → scheduled)
POST   /v1/campaigns/:id/cancel             — cancel scheduled (scheduled → cancelled)
```

### Analytics

```
GET    /v1/campaigns/:id/stats              — aggregated stats (sent, delivered, opened, clicked, bounced, unsubscribed)
GET    /v1/campaigns/:id/recipients         — per-recipient status list (cursor-paginated)
```

### Zod validation — `packages/validation/src/campaign.ts`

```typescript
import { z } from 'zod';

export const createCampaignSchema = z.object({
  projectId: z.string(),
  mailingListId: z.string(),
  name: z.string().min(1).max(200),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  templateId: z.string().optional(),
  fromAddress: z.string().email(),
  replyTo: z.string().email().optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  templateId: z.string().nullable().optional(),
  fromAddress: z.string().email().optional(),
  replyTo: z.string().email().nullable().optional(),
});

export const scheduleCampaignSchema = z.object({
  scheduledAt: z.string().datetime(),
});
```

---

## Broadcast Flow

### Step 1: Create campaign (draft)

```
POST /v1/campaigns
{
  "projectId": "proj_abc",
  "mailingListId": "ml_xyz",
  "name": "May 2026 Newsletter",
  "subject": "What's new in May",
  "html": "<h1>Hello {{name}}</h1>...",
  "fromAddress": "news@example.com"
}
→ 201 { data: { id: "camp_123", status: "draft", ... } }
```

Campaign is created as `draft`. User can edit, preview, test send.

### Step 2: Send (or schedule)

```
POST /v1/campaigns/camp_123/send
→ 200 { data: { id: "camp_123", status: "sending", totalRecipients: 847 } }
```

**Send sequence:**

1. **Validate** — campaign is `draft`, mailing list exists, has confirmed subscribers, from domain is verified (reuse domain verification check from `messages.ts`)
2. **Count recipients** — `SELECT COUNT(*) FROM mailing_list_subscribers WHERE mailing_list_id = ? AND status = 'confirmed'`
3. **Update campaign** — set `status = 'sending'`, `total_recipients = <count>`
4. **Queue sends** — for each confirmed subscriber:
   - Render template with subscriber data (`{{name}}`, `{{email}}`, `{{meta.*}}`)
   - Generate unsubscribe URL: `https://api.pietru.dev/v1/campaigns/unsubscribe?token=<subscriber.confirmation_token>&list=<mailing_list_id>`
   - Inject unsubscribe footer into HTML (see "Unsubscribe Footer" section below)
   - Create a `messages` row with `campaign_id = camp_123`, `status = 'queued'`
   - The message sits in queue and gets picked up by the async Queue & Retry system (T2)
5. **Return immediately** — the API responds once all `messages` rows are created. Actual sending happens async via the queue.

**Important:** Steps 1-4 must be **batched**. Do not insert one message at a time — use D1 batch operations (max 100 per batch) to avoid timeout on large lists.

### Step 3: Queue processes sends

The existing Queue & Retry system (T2) picks up `queued` messages with `campaign_id` set and processes them normally through the provider. No special campaign logic needed in the queue — a message is a message.

### Step 4: Webhook events update campaign stats

When provider webhooks deliver events (delivered, opened, clicked, bounced, complained), the existing `webhooks.ts` handler creates `message_events`. 

**New behavior:** After creating a message event, if the message has a `campaign_id`, increment the corresponding counter on the campaign:

```sql
-- On 'delivered' event: no counter needed (sent_count covers it)
-- On 'opened' event:
UPDATE campaigns SET opened_count = opened_count + 1 WHERE id = ?
-- On 'clicked' event:
UPDATE campaigns SET clicked_count = clicked_count + 1 WHERE id = ?
-- On 'bounced' event:
UPDATE campaigns SET bounced_count = bounced_count + 1 WHERE id = ?
-- On 'complained' event:
UPDATE campaigns SET complained_count = complained_count + 1 WHERE id = ?
```

`sent_count` is incremented when the message status moves from `queued` to `sent`. `failed_count` when it moves to `failed`.

### Step 5: Campaign completion

After all messages for a campaign have reached a terminal state (`sent`, `failed`, `delivered`, `bounced`), update campaign:

```sql
UPDATE campaigns 
SET status = 'sent', sent_at = datetime('now')
WHERE id = ? 
  AND status = 'sending' 
  AND total_recipients <= (SELECT COUNT(*) FROM messages WHERE campaign_id = ? AND status IN ('sent', 'failed', 'delivered', 'bounced'))
```

This check can run as a post-send hook in the queue processor.

---

## Unsubscribe Handling

**Legally required** — GDPR and CAN-SPAM require one-click unsubscribe. Pietru must support:

### One-click unsubscribe (List-Unsubscribe header)

Every campaign message includes:
1. `List-Unsubscribe` email header with the unsubscribe URL
2. `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header (RFC 8058)
3. Visible unsubscribe footer in HTML body

### Unsubscribe URL format

```
https://api.pietru.dev/v1/campaigns/unsubscribe?token=<subscriber_token>&list=<mailing_list_id>
```

### Unsubscribe endpoint

```
GET /v1/campaigns/unsubscribe?token=...&list=...
```

Public endpoint (no auth required). Behavior:
1. Look up subscriber by `confirmation_token` + `mailing_list_id`
2. Set subscriber `status = 'unsubscribed'`, `unsubscribed_at = now()`
3. Increment `campaigns.unsubscribed_count`
4. Return a styled HTML "You've been unsubscribed" page (or redirect to `confirmation_success_url` if set on the list)

### Unsubscribe footer template

Appended to every campaign HTML body before the closing `</body>` tag:

```html
<div style="padding: 20px 0; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; margin-top: 30px;">
  <p>You received this email because you subscribed to our mailing list.</p>
  <p><a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a></p>
</div>
```

The SDK theme system (`packages/pietru-sdk/src/theme.ts`) should expose footer customization (text, colors) via the theme config.

---

## Template Rendering for Campaigns

Campaigns support Mustache variable substitution using subscriber data:

- `{{name}}` — subscriber name
- `{{email}}` — subscriber email
- `{{meta.key}}` — any key from subscriber `meta` JSON

If a `templateId` is provided, the campaign's `html`/`text` overrides the template body but the template's `subject` is used as fallback.

Rendering uses the existing `renderTemplate()` from `@pietru/core`.

---

## Campaign Analytics

### Stats endpoint

```
GET /v1/campaigns/:id/stats
```

Returns:

```json
{
  "data": {
    "totalRecipients": 847,
    "sent": 845,
    "failed": 2,
    "delivered": 820,
    "opened": 312,
    "clicked": 45,
    "bounced": 8,
    "complained": 1,
    "unsubscribed": 3,
    "openRate": 0.38,
    "clickRate": 0.055,
    "bounceRate": 0.009
  }
}
```

Rates are computed from `sent` (not total), excluding failed sends.

### Recipients endpoint

```
GET /v1/campaigns/:id/recipients?status=sent&limit=50&cursor=...
```

Returns per-recipient status by joining `messages` (where `campaign_id = ?`) with subscriber data:

```sql
SELECT m.id, m.to_address, m.status, m.sent_at, m.error,
       s.name, s.email
FROM messages m
LEFT JOIN mailing_list_subscribers s ON s.email = m.to_address AND s.mailing_list_id = ?
WHERE m.campaign_id = ?
ORDER BY m.created_at DESC
LIMIT ?
```

---

## Dashboard Views

### Campaign List (`/campaigns`)

- Table: name, list, status, sent/total, open rate, date
- Filters: status (draft/scheduled/sending/sent/failed/cancelled)
- Actions: create, duplicate, delete (drafts only), cancel (scheduled only)

### Campaign Detail (`/campaigns/:id`)

- Header: name, status badge, sent count
- Stats cards: total, sent, opened, clicked, bounced, unsubscribed
- Tabs:
  - **Recipients** — paginated table of per-recipient send status
  - **Content** — preview of the HTML/text content
  - **Settings** — from address, list, template info

### Campaign Compose (`/campaigns/new` or `/campaigns/:id/edit`)

- Subject input
- Markdown editor with live HTML preview (Nizel-powered, per user's preference)
- From address selector (verified domains)
- Mailing list selector
- Template selector (optional)
- Send test email button
- Schedule vs Send Now toggle

**Philosophy:** Markdown-native, not WYSIWYG. Write in Markdown → render to HTML → send. Consistent with Lezin's approach.

---

## File Structure

```
apps/api/src/routes/
  campaigns.ts              — CRUD + send/schedule/cancel + unsubscribe

packages/validation/src/
  campaign.ts               — Zod schemas for campaign operations

packages/core/src/
  constants.ts              — add CAMPAIGN_STATUSES
  types.ts                  — add Campaign interface

packages/db/migrations/
  0011_campaigns.sql        — campaigns table + messages.campaign_id column

apps/dashboard/src/
  views/
    CampaignsView.vue       — campaign list
    CampaignDetailView.vue  — stats + recipients + content preview
    CampaignComposeView.vue — create/edit campaign
  stores/
    campaigns.ts            — campaign state management
    campaigns.model.ts      — TypeScript interfaces
  router.ts                 — add /campaigns routes
  views/AppLayout.vue       — add "Campaigns" sidebar nav link
```

---

## Security & Safety

1. **Only send to confirmed subscribers** — broadcast only targets `status = 'confirmed'`
2. **Unsubscribe is always available** — footer + List-Unsubscribe header on every campaign email
3. **Domain verification required** — cannot send from unverified domains (reuse existing check)
4. **Campaign deletion is soft** — only `draft` status can be hard-deleted; sent campaigns are kept for audit
5. **Rate limiting applies** — campaign sends respect per-project rate limits (T5)
6. **Suppression list respected** — skip subscribers on the suppression list (T6)
7. **No PII in campaign counters** — counters are numeric only; recipient data requires auth

---

## Edge Cases

1. **Empty mailing list** — `POST /send` returns 400 with "No confirmed subscribers" if list has zero confirmed subscribers
2. **Subscriber joins during send** — broadcast snapshot is taken at send time. New subscribers after send starts are NOT included.
3. **Subscriber unsubscribes during send** — already-queued messages still send. The unsubscribe takes effect for future campaigns only.
4. **Campaign with template + inline content** — inline `html`/`text` takes precedence over template body. Template variables still render.
5. **Large lists (>10k)** — batch D1 inserts (100 per batch) to avoid Worker CPU timeout. Consider Cloudflare Queues for very large lists (>50k).
6. **Concurrent sends** — campaign `status = 'sending'` prevents double-send. Return 409 if already sending.
7. **Template with missing variables** — render with empty string for missing subscriber fields, don't error.

---

## Phase 2 (Not in this spec)

- A/B testing (variant content, split lists)
- Campaign scheduling with timezone support (depends on T4 Scheduled Sends)
- Campaign drip sequences (automated series)
- Import subscribers from CSV
- Campaign templates (reusable campaign layouts, separate from email templates)
