# Email Providers

Pietru works with popular transactional email providers.

## Supported Providers

- **Postmark**
- **SendGrid**
- **Mailgun**
- **Resend**

## Setting Up a Provider

### Postmark

1. In Postmark, go to **Settings** → **Webhooks**
2. Add a webhook URL: `https://api.pietru.dev/webhook/postmark`
3. Select events: `Message Sent`, `Message Bounced`, `Message Opened`
4. Use your project's webhook secret to sign requests

### SendGrid

1. In SendGrid, go to **Settings** → **Mail Settings**
2. Enable **Event Webhook**
3. Set the webhook URL to `https://api.pietru.dev/webhook/sendgrid`
4. Select the events you want to track

### Mailgun

1. In Mailgun, go to **Settings** → **Webhooks**
2. Add a new webhook endpoint: `https://api.pietru.dev/webhook/mailgun`
3. Select the event types to capture

### Resend

1. In Resend, go to **Settings** → **Webhooks**
2. Add a webhook: `https://api.pietru.dev/webhook/resend`
3. Select the events to forward
