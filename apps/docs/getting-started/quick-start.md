# Quick Start Guide

A minimal setup to get Pietru running in under 5 minutes.

## Prerequisites

- A Pietru account ([sign up](https://app.pietru.dev))
- An existing email provider (Postmark, SendGrid, Mailgun, or Resend)
- Node.js 20+ (for the SDK)

## Step 1: Get Your API Key

1. Open your project in the Pietru dashboard
2. Go to **Settings** → **API Keys**
3. Create a new API key

## Step 2: Install the SDK

```bash
npm install @pietru/sdk
```

## Step 3: Add to Your Application

```typescript
import { Pietru } from '@pietru/sdk'

const pietru = new Pietru({
  projectId: 'your-project-id',
  apiKey: process.env.PIETRU_API_KEY,
})
```

## Step 4: Verify

Send a test email through your provider. It should appear in the Pietru dashboard under your project's messages.

## Next Steps

- [Configuration](/configuration/) — Fine-tune your Pietru setup
- [API Reference](/api/) — Full API documentation
- [Test Aliases](/configuration/test-aliases/) — Set up test email addresses
