# Configuration

Configure Pietru to work with your email providers and development workflow.

## Project Settings

Each project in Pietru has its own configuration:

- **Name** — Human-readable project name
- **Slug** — URL-safe identifier
- **API Key** — Used to authenticate API requests
- **Webhook Secret** — For verifying incoming webhooks

## Environment Modes

Pietru supports three environments:

| Environment | Description |
|------------|-------------|
| **Development** | Local development, captures all emails |
| **Staging** | Pre-production testing |
| **Production** | Live production traffic |

Switch environments in the dashboard header using the environment badge.

## Mailing Lists

Pietru exposes a public mailing-list subscription endpoint for marketing pages and product update forms. See [Mailing Lists](/configuration/mailing-lists/) for setup, request shape, and operational behavior.
