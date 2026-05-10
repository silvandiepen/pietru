import { renderTemplate } from './template';

const RESEND_API_BASE_URL = 'https://api.resend.com';

export interface SystemEmailConfig {
  apiKey: string;
  from: string;
}

export interface SystemEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendSystemEmail(
  config: SystemEmailConfig,
  options: SystemEmailOptions,
): Promise<{ id: string }> {
  const response = await fetch(`${RESEND_API_BASE_URL}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'pietru-api/1.0',
    },
    body: JSON.stringify({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!response.ok || !payload?.id) {
    throw new Error(payload?.message ?? 'Failed to send system email');
  }

  return { id: payload.id };
}

// ── Templates ──────────────────────────────────────────────────────────

const VERIFY_EMAIL_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1a1a2e;padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Pietru</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">Verify your email</h2>
          <p style="margin:0 0 24px;color:#555555;font-size:16px;line-height:1.5;">
            Welcome to Pietru! Please verify your email address to get started.
          </p>
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:#1a1a2e;border-radius:8px;">
              <a href="{{{verifyUrl}}}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;">
                Verify email
              </a>
            </td>
          </tr></table>
          <p style="margin:24px 0 0;color:#999999;font-size:13px;line-height:1.5;">
            If you didn't create an account, you can safely ignore this email.<br>
            This link expires in 24 hours.
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #eeeeee;">
          <p style="margin:0;color:#bbbbbb;font-size:12px;text-align:center;">
            Pietru — Transactional email infrastructure
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const VERIFY_EMAIL_TEXT = `Verify your email\n\nWelcome to Pietru! Please verify your email address:\n\n{{{verifyUrl}}}\n\nThis link expires in 24 hours.\nIf you didn't create an account, you can safely ignore this email.`;

const RESET_PASSWORD_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1a1a2e;padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Pietru</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">Reset your password</h2>
          <p style="margin:0 0 24px;color:#555555;font-size:16px;line-height:1.5;">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:#1a1a2e;border-radius:8px;">
              <a href="{{{resetUrl}}}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;">
                Reset password
              </a>
            </td>
          </tr></table>
          <p style="margin:24px 0 0;color:#999999;font-size:13px;line-height:1.5;">
            If you didn't request a password reset, you can safely ignore this email.<br>
            This link expires in 1 hour.
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #eeeeee;">
          <p style="margin:0;color:#bbbbbb;font-size:12px;text-align:center;">
            Pietru — Transactional email infrastructure
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const RESET_PASSWORD_TEXT = `Reset your password\n\nWe received a request to reset your password. Click the link below:\n\n{{{resetUrl}}}\n\nThis link expires in 1 hour.\nIf you didn't request a password reset, you can safely ignore this email.`;

// ── Helpers ────────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  config: SystemEmailConfig,
  { to, token, dashboardUrl }: { to: string; token: string; dashboardUrl: string },
): Promise<{ id: string }> {
  const verifyUrl = `${dashboardUrl}/verify-email?token=${encodeURIComponent(token)}`;

  return sendSystemEmail(config, {
    to,
    subject: 'Verify your email — Pietru',
    html: renderTemplate(VERIFY_EMAIL_HTML, { verifyUrl }),
    text: renderTemplate(VERIFY_EMAIL_TEXT, { verifyUrl }),
  });
}

export async function sendPasswordResetEmail(
  config: SystemEmailConfig,
  { to, token, dashboardUrl }: { to: string; token: string; dashboardUrl: string },
): Promise<{ id: string }> {
  const resetUrl = `${dashboardUrl}/reset-password?token=${encodeURIComponent(token)}`;

  return sendSystemEmail(config, {
    to,
    subject: 'Reset your password — Pietru',
    html: renderTemplate(RESET_PASSWORD_HTML, { resetUrl }),
    text: renderTemplate(RESET_PASSWORD_TEXT, { resetUrl }),
  });
}
