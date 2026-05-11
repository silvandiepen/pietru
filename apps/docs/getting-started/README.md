# Getting Started

Get up and running with Pietru in a few minutes.

## Create an Account

1. Go to [app.pietru.dev](https://app.pietru.dev)
2. Sign up with your email address
3. Verify your email

## Create Your First Project

After signing in, create a project to start capturing emails.

1. Click **New Project** on the dashboard
2. Give your project a name and slug
3. Configure your email provider settings

## Install the SDK

Pietru provides SDKs for popular frameworks. Choose your language:

```bash
# npm
npm install @pietru/sdk

# yarn
yarn add @pietru/sdk
```

## Configure the SDK

Add your Pietru credentials to your application:

```typescript
import { Pietru } from '@pietru/sdk'

const pietru = new Pietru({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
})
```

## Send Your First Email

Once configured, emails sent through your provider will automatically appear in the Pietru dashboard.
