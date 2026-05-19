import { hashPassword, hashToken, verifyPassword, generateToken } from '@pietru/auth';
import { generateId, MESSAGE_EVENT_TYPES, MESSAGE_STATUSES, sendVerificationEmail, sendPasswordResetEmail } from '@pietru/core';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@pietru/validation';
import { deleteCookie, setCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import type { Env, AppVariables } from '../env';
import { requireUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

function success<T>(data: T, status = 200) {
  return { data, status };
}

function error(code: string, message: string, status = 400) {
  return { error: { code, message }, status };
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'None' as const,
    path: '/',
    maxAge: 604800,
  };
}

async function createSessionToken(c: { env: Env }, userId: string) {
  const sessionId = generateId('sess');
  const sessionToken = generateToken();
  const tokenHash = await hashToken(sessionToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 604800 * 1000).toISOString();

  await c.env.DB.prepare(
    'INSERT INTO user_sessions (id, user_id, token_hash, created_at, expires_at, revoked_at) VALUES (?, ?, ?, ?, ?, NULL)',
  )
    .bind(sessionId, userId, tokenHash, now.toISOString(), expiresAt)
    .run();

  const jwt = await sign(
    {
      sub: userId,
      sid: sessionId,
      sth: tokenHash,
      exp: Math.floor(Date.parse(expiresAt) / 1000),
    },
    c.env.JWT_SECRET,
    'HS256',
  );

  return jwt;
}

async function captureTestAliasSystemEmail(
  env: Env,
  options: { to: string; from: string; subject: string; html: string; text: string; token: string },
) {
  const [, domain = ''] = options.to.toLowerCase().split('@');
  if (domain !== 'test.pietru.dev') {
    return;
  }

  const localPart = options.to.split('@')[0]?.toLowerCase().trim();
  if (!localPart) {
    return;
  }

  const alias = await env.DB.prepare(
    'SELECT id, user_id, project_id, local_part FROM test_aliases WHERE local_part = ? AND is_active = 1',
  )
    .bind(localPart)
    .first<{ id: string; user_id: string; project_id: string | null; local_part: string }>();

  if (!alias?.project_id) {
    return;
  }

  const now = new Date().toISOString();
  const messageId = generateId('msg');
  const tags = { test_alias: alias.local_part, user_id: alias.user_id, system_email: 'verification' };

  await env.DB.prepare(
    `INSERT INTO messages (
      id, project_id, provider_config_id, environment, to_address, from_address,
      reply_to, cc_json, bcc_json, subject, html, text, status, provider,
      provider_message_id, error, tags_json, raw_storage_key, html_storage_key,
      text_storage_key, idempotency_key_hash, created_at, queued_at, sent_at, failed_at
    ) VALUES (?, ?, NULL, 'production', ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, 'pietru_system_email_capture',
      NULL, NULL, ?, NULL, NULL, NULL, NULL, ?, NULL, NULL, NULL)`,
  )
    .bind(
      messageId,
      alias.project_id,
      options.to,
      options.from,
      options.subject,
      options.html,
      options.text,
      MESSAGE_STATUSES.received,
      JSON.stringify(tags),
      now,
    )
    .run();

  await env.DB.prepare(
    'INSERT INTO message_events (id, message_id, project_id, type, provider, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      generateId('evt'),
      messageId,
      alias.project_id,
      MESSAGE_EVENT_TYPES.received,
      'pietru_system_email_capture',
      JSON.stringify({ to: options.to, from: options.from, test_alias: alias.local_part, token: options.token }),
      now,
    )
    .run();
}

const authRoutes = new Hono<App>();

authRoutes.post('/register', async (c) => {
  const body = registerSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json(error('validation_error', body.error.issues[0]?.message ?? 'Invalid payload'), 400);
  }

  const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(body.data.email.toLowerCase())
    .first<{ id: string }>();
  if (existingUser) {
    return c.json(error('email_taken', 'Email is already registered'), 409);
  }

  const now = new Date().toISOString();
  const userId = generateId('usr');
  const passwordHash = await hashPassword(body.data.password);
  await c.env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)',
  )
    .bind(userId, body.data.email.toLowerCase(), passwordHash, now, now)
    .run();

  const verifyToken = generateToken();
  await c.env.DB.prepare(
    'INSERT INTO auth_tokens (id, user_id, type, token_hash, created_at, expires_at, used_at) VALUES (?, ?, ?, ?, ?, ?, NULL)',
  )
    .bind(
      generateId('authtok'),
      userId,
      'email_verification',
      await hashToken(verifyToken),
      now,
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    )
    .run();

  const session = await createSessionToken(c, userId);
  setCookie(c, 'session', session, sessionCookieOptions());

  // Send verification email after the response without letting the Worker cancel it.
  // In Cloudflare Workers, fire-and-forget promises that are not passed to waitUntil()
  // may be terminated when the request completes, which made delivery nondeterministic.
  const toEmail = body.data.email.toLowerCase();
  const verifyUrl = `${c.env.DASHBOARD_URL}/verify-email?token=${encodeURIComponent(verifyToken)}`;
  const verificationEmail = Promise.allSettled([
    sendVerificationEmail(
      {
        apiKey: c.env.SYSTEM_EMAIL_API_KEY,
        from: c.env.SYSTEM_EMAIL_FROM,
      },
      {
        to: toEmail,
        token: verifyToken,
        dashboardUrl: c.env.DASHBOARD_URL,
      },
    ),
    captureTestAliasSystemEmail(c.env, {
      to: toEmail,
      from: c.env.SYSTEM_EMAIL_FROM,
      subject: 'Verify your email — Pietru',
      html: `<p>Verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
      text: `Verify your email\n\n${verifyUrl}`,
      token: verifyToken,
    }),
  ]).then((results) => {
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('Failed to send or capture verification email:', result.reason);
      }
    }
  });
  c.executionCtx.waitUntil(verificationEmail);

  return c.json(
    success({
      user: {
        id: userId,
        email: body.data.email.toLowerCase(),
        emailVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    }),
    201,
  );
});

authRoutes.post('/login', async (c) => {
  const body = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json(error('validation_error', body.error.issues[0]?.message ?? 'Invalid payload'), 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, password_hash, email_verified_at, created_at, updated_at FROM users WHERE email = ?',
  )
    .bind(body.data.email.toLowerCase())
    .first<{
      id: string;
      email: string;
      password_hash: string;
      email_verified_at: string | null;
      created_at: string;
      updated_at: string;
    }>();

  if (!user || !(await verifyPassword(body.data.password, user.password_hash))) {
    return c.json(error('invalid_credentials', 'Invalid email or password'), 401);
  }

  const session = await createSessionToken(c, user.id);
  setCookie(c, 'session', session, sessionCookieOptions());

  return c.json(
    success({
      user: {
        id: user.id,
        email: user.email,
        emailVerifiedAt: user.email_verified_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    }),
  );
});

authRoutes.post('/logout', requireUserSession, async (c) => {
  const sessionId = c.get('sessionId');
  if (sessionId) {
    await c.env.DB.prepare('UPDATE user_sessions SET revoked_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), sessionId)
      .run();
  }

  deleteCookie(c, 'session', { path: '/', secure: true, sameSite: 'None' });
  return c.json(success({ ok: true }));
});

authRoutes.post('/verify-email', async (c) => {
  const body = resetPasswordSchema.pick({ token: true }).safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json(error('validation_error', 'Invalid payload'), 400);
  }

  const tokenHash = await hashToken(body.data.token);
  const token = await c.env.DB.prepare(
    'SELECT id, user_id, expires_at, used_at FROM auth_tokens WHERE type = ? AND token_hash = ?',
  )
    .bind('email_verification', tokenHash)
    .first<{ id: string; user_id: string; expires_at: string; used_at: string | null }>();

  if (!token || token.used_at || Date.parse(token.expires_at) <= Date.now()) {
    return c.json(error('invalid_token', 'Invalid or expired token'), 400);
  }

  const now = new Date().toISOString();
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE auth_tokens SET used_at = ? WHERE id = ?').bind(now, token.id),
    c.env.DB.prepare('UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?').bind(now, now, token.user_id),
  ]);

  return c.json(success({ verifiedAt: now }));
});

authRoutes.post('/forgot-password', async (c) => {
  const body = forgotPasswordSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json(error('validation_error', 'Invalid payload'), 400);
  }

  const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(body.data.email.toLowerCase())
    .first<{ id: string }>();

  if (!user) {
    return c.json(success({ ok: true }));
  }

  const token = generateToken();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'INSERT INTO auth_tokens (id, user_id, type, token_hash, created_at, expires_at, used_at) VALUES (?, ?, ?, ?, ?, ?, NULL)',
  )
    .bind(
      generateId('authtok'),
      user.id,
      'password_reset',
      await hashToken(token),
      now,
      new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    )
    .run();

  // Send password reset email without blocking the response, but attach it to the
  // Worker lifetime so Cloudflare does not cancel the send after the request completes.
  const passwordResetEmail = sendPasswordResetEmail(
    {
      apiKey: c.env.SYSTEM_EMAIL_API_KEY,
      from: c.env.SYSTEM_EMAIL_FROM,
    },
    {
      to: body.data.email.toLowerCase(),
      token,
      dashboardUrl: c.env.DASHBOARD_URL,
    },
  ).catch((err) => {
    console.error('Failed to send password reset email:', err);
  });
  c.executionCtx.waitUntil(passwordResetEmail);

  return c.json(success({ ok: true }));
});

authRoutes.post('/reset-password', async (c) => {
  const body = resetPasswordSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json(error('validation_error', body.error.issues[0]?.message ?? 'Invalid payload'), 400);
  }

  const tokenHash = await hashToken(body.data.token);
  const token = await c.env.DB.prepare(
    'SELECT id, user_id, expires_at, used_at FROM auth_tokens WHERE type = ? AND token_hash = ?',
  )
    .bind('password_reset', tokenHash)
    .first<{ id: string; user_id: string; expires_at: string; used_at: string | null }>();

  if (!token || token.used_at || Date.parse(token.expires_at) <= Date.now()) {
    return c.json(error('invalid_token', 'Invalid or expired token'), 400);
  }

  const now = new Date().toISOString();
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE auth_tokens SET used_at = ? WHERE id = ?').bind(now, token.id),
    c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').bind(
      await hashPassword(body.data.password),
      now,
      token.user_id,
    ),
  ]);

  return c.json(success({ ok: true }));
});

authRoutes.post('/change-password', requireUserSession, async (c) => {
  const body = changePasswordSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json(error('validation_error', body.error.issues[0]?.message ?? 'Invalid payload'), 400);
  }

  const user = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(c.get('userId'))
    .first<{ password_hash: string }>();

  if (!user || !(await verifyPassword(body.data.currentPassword, user.password_hash))) {
    return c.json(error('invalid_credentials', 'Current password is incorrect'), 401);
  }

  await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .bind(await hashPassword(body.data.newPassword), new Date().toISOString(), c.get('userId'))
    .run();

  return c.json(success({ ok: true }));
});

authRoutes.get('/me', requireUserSession, async (c) => {
  const user = await c.env.DB.prepare(
    'SELECT id, email, is_admin, email_verified_at, created_at, updated_at FROM users WHERE id = ?',
  )
    .bind(c.get('userId'))
    .first();

  return c.json(success(user));
});

authRoutes.get('/sessions', requireUserSession, async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT id, created_at, expires_at, revoked_at FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC',
  )
    .bind(c.get('userId'))
    .all();

  return c.json(success(result.results));
});

authRoutes.delete('/sessions/:id', requireUserSession, async (c) => {
  const result = await c.env.DB.prepare(
    'UPDATE user_sessions SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL',
  )
    .bind(new Date().toISOString(), c.req.param('id'), c.get('userId'))
    .run();

  if ((result.meta.changes ?? 0) === 0) {
    return c.json(error('not_found', 'Session not found'), 404);
  }

  return c.json(success({ ok: true }));
});

export { authRoutes };
