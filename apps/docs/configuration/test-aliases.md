# Test Aliases

Test aliases let you capture emails sent to specific test addresses without actually delivering them.

## What Are Test Aliases?

Test aliases are email addresses (like `test+alias@yourdomain.com`) that Pietru intercepts. Instead of sending the email to the real recipient, Pietru captures it and makes it available in the dashboard.

## Creating a Test Alias

1. Open your project in the dashboard
2. Go to **Test Aliases**
3. Click **New Alias**
4. Enter the email pattern (e.g., `test+*@yourdomain.com`)
5. Save

## Use Cases

- **QA Testing** — Verify email content before sending to real users
- **Preview Emails** — Check HTML rendering across different clients
- **Debug Templates** — Test dynamic email templates with real data
