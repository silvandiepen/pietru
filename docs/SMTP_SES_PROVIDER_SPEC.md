# SMTP and SES Provider Spec

## Goal

Pietru should become independent from Resend by supporting Amazon SES as a first-class provider while keeping the existing Pietru API unchanged for client projects.

The important architectural rule is:

```txt
Client apps -> Pietru API -> Pietru provider abstraction -> SES
```

Client apps should never know whether Pietru sends through Resend, SES, SMTP, Postal, or a future provider.

## Current Context

Pietru is a Cloudflare-native centralized mail gateway. It runs the API as a Hono Worker and uses D1, R2, and KV for data, message storage, and idempotency.

The current provider package already exposes a provider abstraction and a Resend implementation:

```txt
packages/providers/src/
  index.ts
  types.ts
  resend.ts
```

This spec adds SES without changing the public send-email API first.

## Definitions

### SES Provider

The SES provider is the first real Resend replacement. It sends email through Amazon SES using the SES v2 HTTP API from the Cloudflare Worker runtime.

### SMTP Provider

The SMTP provider should not be implemented directly inside Cloudflare Workers because Workers do not support raw TCP SMTP connections. If Pietru needs generic SMTP later, it should be added through one of these patterns:

1. A small external SMTP bridge service that exposes HTTPS to Pietru and SMTP to the provider.
2. A self-hosted Postal instance with an HTTP API.
3. A queue-based worker running outside Cloudflare, for example on Fly.io, Hetzner, Railway, or ECS.

For the first implementation, treat SES as the actual production provider.

## Provider Types

Add these provider types:

```ts
type ProviderType = 'resend' | 'ses';
```

Later:

```ts
type ProviderType = 'resend' | 'ses' | 'smtp' | 'postal' | 'mailgun';
```

## File Structure

Add:

```txt
packages/providers/src/ses.ts
packages/providers/src/ses.types.ts
packages/providers/src/ses.signing.ts
```

Update:

```txt
packages/providers/src/index.ts
packages/providers/src/types.ts
```

Optional later split:

```txt
packages/providers/src/resend/index.ts
packages/providers/src/ses/index.ts
```

## Provider Config

Extend the existing `ProviderConfig` without breaking Resend.

```ts
export interface ProviderConfig {
  providerType: string;
  apiKey: string;
  webhookSecret?: string;
  mode?: 'send' | 'capture' | 'send_and_capture';
  environment?: 'development' | 'preview' | 'production';
  defaultFrom?: string | null;
  allowedDomains?: string[] | null;

  // SES fields
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  configurationSetName?: string | null;
  defaultMailFromDomain?: string | null;
}
```

Recommended interpretation:

- `providerType`: `ses`
- `apiKey`: unused for SES, kept for backwards compatibility
- `accessKeyId`: AWS access key ID
- `secretAccessKey`: AWS secret access key
- `region`: SES region, for example `eu-west-1`
- `configurationSetName`: optional SES configuration set for event tracking
- `defaultMailFromDomain`: optional custom MAIL FROM subdomain

Because Pietru encrypts provider API keys already, SES secrets should be encrypted the same way before storage.

## SES Provider Interface

The first implementation only needs to satisfy the existing `MailProvider` interface.

```ts
export class SesProvider implements MailProvider {
  async sendEmail(message: OutgoingEmail, config: ProviderConfig): Promise<ProviderSendResult>;
  async validateConfig(config: ProviderConfig): Promise<void>;
  async handleWebhook?(payload: unknown, headers: Headers, config: ProviderConfig): Promise<ProviderEvent[]>;
}
```

## Sending Email

Use Amazon SES v2 `SendEmail`.

Endpoint:

```txt
POST https://email.{region}.amazonaws.com/v2/email/outbound-emails
```

Request mapping:

```ts
{
  FromEmailAddress: message.from,
  Destination: {
    ToAddresses: normalizeArray(message.to),
    CcAddresses: message.cc,
    BccAddresses: message.bcc,
  },
  ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
  Content: {
    Simple: {
      Subject: { Data: message.subject, Charset: 'UTF-8' },
      Body: {
        Html: message.html ? { Data: message.html, Charset: 'UTF-8' } : undefined,
        Text: message.text ? { Data: message.text, Charset: 'UTF-8' } : undefined,
      },
    },
  },
  EmailTags: Object.entries(message.tags ?? {}).map(([Name, Value]) => ({ Name, Value })),
  ConfigurationSetName: config.configurationSetName ?? undefined,
}
```

Return:

```ts
{
  id: payload.MessageId,
  status: 'sent',
  raw: payload,
}
```

If SES returns no `MessageId`, throw a provider error.

## AWS Signature V4

Cloudflare Workers can call SES over HTTPS, but requests must be signed with AWS Signature Version 4.

Implement a small internal signer using Web Crypto:

```txt
ses.signing.ts
```

Required signing pieces:

- service: `ses`
- region: config region
- algorithm: `AWS4-HMAC-SHA256`
- signed headers: `content-type;host;x-amz-date`
- payload hash: SHA-256 hex of JSON body

Do not add the full AWS SDK unless absolutely needed. It can increase Worker bundle size and may cause runtime compatibility issues.

## validateConfig

`validateConfig` should verify that the credentials are usable.

Recommended MVP:

Call:

```txt
GET https://email.{region}.amazonaws.com/v2/email/identities
```

Success means the credentials and region work.

Validation errors:

- missing `accessKeyId`
- missing `secretAccessKey`
- missing `region`
- AWS rejected credentials
- region has no SES access

## Domain Verification

MVP can start with manual SES domain setup.

Next step should add managed domain onboarding.

### Managed Domain Flow

User enters:

```txt
example.com
```

Pietru calls SES:

```txt
POST /v2/email/identities
```

Body:

```json
{
  "EmailIdentity": "example.com"
}
```

Pietru stores the returned DKIM tokens and shows DNS records in the dashboard.

### DNS Records Shown to User

For each domain, show:

```txt
TYPE   NAME                              VALUE
CNAME  token1._domainkey.example.com     token1.dkim.amazonses.com
CNAME  token2._domainkey.example.com     token2.dkim.amazonses.com
CNAME  token3._domainkey.example.com     token3.dkim.amazonses.com
TXT    _dmarc.example.com                v=DMARC1; p=none;
```

For custom MAIL FROM:

```txt
TYPE   NAME              VALUE
MX     mail.example.com   10 feedback-smtp.{region}.amazonses.com
TXT    mail.example.com   v=spf1 include:amazonses.com ~all
```

Cloudflare DNS instruction:

```txt
All mail-related records must be DNS only, not proxied.
```

## Domain Verification Status

Add a provider-level method later:

```ts
getDomainStatus(domain: string, config: ProviderConfig): Promise<ProviderDomainStatus>;
```

Suggested type:

```ts
export interface ProviderDomainStatus {
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  dkimStatus?: 'pending' | 'verified' | 'failed';
  mailFromStatus?: 'pending' | 'verified' | 'failed';
  records: ProviderDnsRecord[];
  raw?: unknown;
}

export interface ProviderDnsRecord {
  type: 'TXT' | 'CNAME' | 'MX';
  name: string;
  value: string;
  priority?: number;
  proxied?: false;
}
```

This can be added after the basic SES send provider works.

## Webhooks and Events

SES events normally arrive via SNS, EventBridge, or Kinesis Firehose.

For Pietru MVP, use SNS HTTPS webhook.

Endpoint:

```txt
POST /webhooks/providers/ses/:providerConfigId
```

SES/SNS event handling must:

1. Verify the SNS message signature.
2. Handle `SubscriptionConfirmation`.
3. Parse `Notification` messages.
4. Convert SES events into `ProviderEvent[]`.

Map SES events to Pietru events:

```txt
Send            -> email.sent
Delivery        -> email.delivered
Bounce          -> email.bounced
Complaint       -> email.complained
Reject          -> email.rejected
Open            -> email.opened
Click           -> email.clicked
RenderingFailure -> email.failed
```

For hard bounces and complaints, add the recipient to the suppression list if Pietru has one, or mark the message/event clearly so suppression can be added later.

## Attachments

Do not support attachments in the first SES provider version.

Reason: SES `SendEmail` simple content does not cover the full attachment use case cleanly. Attachments should be implemented later with raw MIME support.

Later method:

```txt
SendRawEmail / raw MIME
```

## Provider Selection

Sending should use the configured project provider.

Recommended rule:

1. If project has production provider and environment is production, send.
2. If environment is development or preview, capture unless provider mode is explicitly `send`.
3. If provider fails, mark message `failed`; do not silently fall back unless a fallback provider is explicitly configured.

## Security

- Never log AWS secret access keys.
- Encrypt SES credentials before D1 storage.
- Only allow `from` domains listed in `allowedDomains`.
- Reject sends from unverified domains.
- Keep idempotency behavior unchanged.
- Rate-limit API keys before sending to provider.

## Implementation Plan

### Phase 1: SES Send Provider

- Add `SesProvider`.
- Add AWS Signature V4 helper.
- Add provider config validation for SES fields.
- Export SES from `packages/providers/src/index.ts`.
- Add unit tests for request mapping and signing.
- Add one integration test with mocked fetch.

### Phase 2: Dashboard Provider Setup

- Add SES as provider option.
- Fields:
  - region
  - access key ID
  - secret access key
  - configuration set name
  - default MAIL FROM domain
- Validate provider config before saving.

### Phase 3: Domain Onboarding

- Add domain identity creation.
- Store DNS records.
- Display DNS records in dashboard.
- Poll SES identity status.

### Phase 4: SES Webhooks

- Add SNS webhook endpoint.
- Verify SNS signatures.
- Convert SES events to Pietru message events.
- Add bounce/complaint suppression.

### Phase 5: Generic SMTP Later

Only after SES is stable, consider a generic SMTP bridge.

Do not try to run SMTP directly inside Cloudflare Workers.

## Acceptance Criteria

SES provider is done when:

- A project can choose `ses` as provider.
- Pietru can validate SES credentials.
- Pietru can send HTML and text email through SES.
- Existing public send API does not change.
- Message logs store SES `MessageId`.
- Invalid SES credentials produce a clear provider error.
- Resend provider still works.
- Tests cover Resend and SES provider selection.

Domain onboarding is done when:

- A user can add a domain.
- Pietru creates/reads the SES identity.
- Dashboard shows DKIM, MAIL FROM, SPF, and DMARC records.
- Cloudflare users are told to keep records DNS-only.
- Pietru blocks sending from domains that are not verified.
