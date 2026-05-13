import { sendSystemEmail } from '@pietru/core';
import { mailingListSubscriptionSchema } from '@pietru/validation';
import { Hono } from 'hono';
import type { AppVariables, Env } from '../env';

type App = { Bindings: Env; Variables: AppVariables };

const ADMIN_RECIPIENT = 'hello@hakobs.com';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const mailingListRoutes = new Hono<App>();

mailingListRoutes.post('/mailing-list/subscriptions', async (c) => {
  const body = mailingListSubscriptionSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json(
      {
        error: {
          code: 'validation_error',
          message: body.error.issues[0]?.message ?? 'Invalid payload',
        },
      },
      400,
    );
  }

  const { email, name, list } = body.data;
  const now = new Date().toISOString();
  const userAgent = c.req.header('User-Agent') ?? 'Unknown';

  try {
    await sendSystemEmail(
      {
        apiKey: c.env.SYSTEM_EMAIL_API_KEY,
        from: c.env.SYSTEM_EMAIL_FROM,
      },
      {
        to: ADMIN_RECIPIENT,
        subject: `New Pietru mailing list signup: ${email}`,
        html: `
          <h1>New mailing list signup</h1>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Name:</strong> ${escapeHtml(name ?? 'Not provided')}</p>
          <p><strong>List:</strong> ${escapeHtml(list)}</p>
          <p><strong>Submitted:</strong> ${escapeHtml(now)}</p>
          <p><strong>User agent:</strong> ${escapeHtml(userAgent)}</p>
        `,
        text: [
          'New mailing list signup',
          '',
          `Email: ${email}`,
          `Name: ${name ?? 'Not provided'}`,
          `List: ${list}`,
          `Submitted: ${now}`,
          `User agent: ${userAgent}`,
        ].join('\n'),
      },
    );
  } catch (error) {
    console.error('Failed to process mailing list signup:', error);
    return c.json(
      {
        error: {
          code: 'subscription_failed',
          message: 'Could not join the mailing list right now. Please try again.',
        },
      },
      502,
    );
  }

  return c.json({ data: { ok: true } }, 201);
});
