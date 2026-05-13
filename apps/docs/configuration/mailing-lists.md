# Mailing Lists

Pietru includes a public mailing-list signup flow for product update forms, waitlists, and launch announcements. The marketing site uses this flow in the footer mailing-list section.

## How It Works

1. A visitor submits their email address from the marketing site.
2. The frontend sends the signup to Pietru's API.
3. The API validates the payload.
4. Pietru sends an internal system email to the configured list owner so the signup can be processed.

The current implementation does not store subscribers in D1. It uses Pietru's existing system email delivery pipeline, so signups stay behind the Pietru API and do not rely on `mailto:` links or third-party form posts from the browser.

## Endpoint

```http
POST https://api.pietru.dev/v1/mailing-list/subscriptions
Content-Type: application/json
```

This endpoint is public and does not require a user session or API key.

## Request Body

```json
{
  "email": "reader@example.com",
  "name": "Reader Name",
  "list": "pietru-updates"
}
```

| Field | Type | Required | Description |
|---|---|---:|---|
| `email` | `string` | Yes | Subscriber email address. Must be a valid email. |
| `name` | `string` | No | Optional display name. Trimmed and limited to 120 characters. |
| `list` | `string` | No | Mailing-list identifier. Defaults to `pietru-updates` and is limited to 80 characters. |

## Response

Successful submissions return:

```json
{
  "data": {
    "ok": true
  }
}
```

Validation errors return:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid email"
  }
}
```

Delivery failures return:

```json
{
  "error": {
    "code": "subscription_failed",
    "message": "Could not join the mailing list right now. Please try again."
  }
}
```

## Frontend Integration

Use the same base URL as the dashboard and marketing apps:

```bash
VITE_PIETRU_API_URL=https://api.pietru.dev
```

Example request:

```typescript
await fetch(`${import.meta.env.VITE_PIETRU_API_URL}/v1/mailing-list/subscriptions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'reader@example.com',
    list: 'pietru-updates',
  }),
})
```

The marketing app falls back to `http://localhost:8787` when `VITE_PIETRU_API_URL` is not set, which matches the local API dev server.

## API Configuration

The mailing-list endpoint uses the same system email configuration as verification and password-reset emails:

| Binding | Description |
|---|---|
| `SYSTEM_EMAIL_API_KEY` | API key used by Pietru to send system emails. |
| `SYSTEM_EMAIL_FROM` | Sender address for system emails. |

The internal signup notification is sent to the configured list owner in the API route. The current production recipient is `hello@hakobs.com`.

## CORS

The API allows the marketing app origins used in production, preview, and local development:

- `https://pietru.dev`
- `https://app.pietru.dev`
- `https://api.pietru.dev`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:5174`
- `https://*.pietru-marketing.pages.dev`
- `https://*.pietru-dashboard.pages.dev`

## Notes

- Keep the endpoint public, but validate input server-side.
- Do not expose the system email provider key to the browser.
- Add persistence later if Pietru needs subscriber management, deduplication, unsubscribe links, or export workflows.
