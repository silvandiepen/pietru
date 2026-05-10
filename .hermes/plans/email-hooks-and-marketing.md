# Email Hooks + Marketing Site Plan

## Part 1: Email Hooks System

### Concept
When an inbound email matches certain criteria (e.g. `+tag` in the address, or specific email types), Pietru fires a webhook to a user-defined endpoint. This enables:
- **Tag-based routing**: `myproject/sil+support@pietru.dev` → POST to Zendesk API
- **Auto-forwarding to APIs**: Parse incoming emails and push structured data to webhooks
- **Automation triggers**: Send Slack notifications, create tickets, update databases on email receipt

### DB Schema (Migration 0006)
```sql
CREATE TABLE email_hooks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  -- Filter: which emails trigger this hook
  filter_type TEXT NOT NULL DEFAULT 'tag',  -- 'tag', 'from_domain', 'subject_regex', 'any'
  filter_value TEXT,                         -- tag name, domain, regex pattern, null for 'any'
  -- Action: what to do when triggered
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT,                       -- HMAC signing secret
  webhook_headers_json TEXT,                 -- custom headers {"Authorization": "Bearer ..."}
  -- Metadata
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### API Routes (email-hooks.ts)
- `GET /projects/:id/email-hooks` — list hooks for a project
- `POST /projects/:id/email-hooks` — create a hook
- `PATCH /projects/:id/email-hooks/:hookId` — update a hook
- `DELETE /projects/:id/email-hooks/:hookId` — delete a hook

### Inbound Email Integration (inbound.ts)
After storing the message + event, check for matching hooks:
1. Look up active hooks for the matched project
2. For each hook, check if the email matches the filter (tag, from_domain, etc.)
3. If match, fire HTTP POST to webhook_url with:
   ```json
   {
     "event": "email.received",
     "timestamp": "...",
     "message_id": "msg_...",
     "project_id": "proj_...",
     "hook_id": "hook_...",
     "data": {
       "to": "myproject/sil+support@pietru.dev",
       "from": "user@example.com",
       "subject": "...",
       "tag": "support",
       "user_slug": "sil"
     }
   }
   ```
4. Sign with HMAC-SHA256 if webhook_secret is set
5. Add custom headers from webhook_headers_json
6. Fire-and-forget (don't block email processing)

### Tests
- Unit test: parseInboundAddress with tags
- Unit test: hook matching logic (tag, from_domain, any)
- Integration test: create hook → receive email → verify webhook fired
- API route tests: CRUD operations

## Part 2: Marketing Site Redesign

### Approach
Match the hakobs.com/lezin.hakobs.com style:
- @sil/ui components (PillHeader, PlatformFooter, Button, Card, Icon)
- Colored sections with `color-mix()` gradients (like lezin FeaturesView)
- Clear, benefit-focused copy (NOT technical)
- i18n for all strings

### Pages
1. **Homepage** — Hero + Problem/Solution + How It Works + Features grid + Social proof + CTA
2. **Features** — Deep-dive sections with colored backgrounds

### Homepage Structure
1. **Hero**: "Stop wrestling with email infrastructure" — clear value prop
2. **Problem section**: The pain of scattered email logic
3. **How it works**: 3-step (Create project → Connect provider → Send/receive)
4. **Features grid**: 6 cards with icons
5. **Use cases**: E-commerce receipts, Auth emails, Notifications, Support
6. **CTA**: Sign up / Open dashboard
