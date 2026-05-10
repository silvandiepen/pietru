import { decrypt } from '@pietru/auth';
import {
  MESSAGE_EVENT_TYPES,
  MESSAGE_STATUSES,
  SENDING_MODES,
  generateId,
  type MessageStatus,
  safeJsonParse,
} from '@pietru/core';
import { ResendProvider } from '@pietru/providers';
import { replyMessageSchema } from '@pietru/validation';
import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { AppVariables, Env } from '../env';
import { authenticateProjectApiKey, authenticateUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

type ProviderConfigRecord = {
  id: string;
  project_id: string;
  provider_type: string;
  config_encrypted: string;
  mode: 'send' | 'capture' | 'send_and_capture';
  environment: 'development' | 'preview' | 'production';
  default_from: string | null;
  allowed_domains_json: string | null;
};

async function authenticateAccess(c: {
  req: { header(name: string): string | undefined };
  env: Env;
  set: <K extends keyof AppVariables>(key: K, value: AppVariables[K]) => void;
}) {
  const authorization = c.req.header('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authenticateProjectApiKey(c, authorization.slice('Bearer '.length).trim());
  }

  const token = getCookie(c as never, 'session');
  if (!token) {
    return new Response(JSON.stringify({ error: { code: 'unauthorized', message: 'Missing credentials' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return authenticateUserSession(c, token);
}

async function verifyProjectOwnership(db: D1Database, projectId: string, userId: string) {
  return db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, userId).first<{ id: string }>();
}

const replyRoutes = new Hono<App>();

replyRoutes.post('/messages/:id/reply', async (c) => {
  const messageId = c.req.param('id');
  if (!messageId) {
    return c.json({ error: { code: 'validation_error', message: 'Message id is required' } }, 400);
  }

  const authResult = await authenticateAccess(c);
  if (authResult instanceof Response) {
    return authResult;
  }

  const body = replyMessageSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  // Look up the original message
  let originalMessage: Record<string, unknown> | null;
  if ('userId' in authResult) {
    originalMessage = await c.env.DB.prepare(
      'SELECT m.* FROM messages m INNER JOIN projects p ON p.id = m.project_id WHERE m.id = ? AND p.user_id = ?',
    )
      .bind(messageId, authResult.userId)
      .first<Record<string, unknown>>();
  } else {
    originalMessage = await c.env.DB.prepare(
      'SELECT * FROM messages WHERE id = ? AND project_id = ? AND environment = ?',
    )
      .bind(messageId, authResult.projectId, authResult.environment)
      .first<Record<string, unknown>>();
  }

  if (!originalMessage) {
    return c.json({ error: { code: 'not_found', message: 'Message not found' } }, 404);
  }

  const projectId = String(originalMessage.project_id);
  const providerConfigId = originalMessage.provider_config_id as string | null;

  if (!providerConfigId) {
    return c.json({ error: { code: 'provider_not_configured', message: 'Original message has no provider config' } }, 400);
  }

  // Look up provider config
  const providerConfig = await c.env.DB.prepare('SELECT * FROM provider_configs WHERE id = ?')
    .bind(providerConfigId)
    .first<ProviderConfigRecord>();

  if (!providerConfig) {
    return c.json({ error: { code: 'provider_not_configured', message: 'Provider config not found' } }, 400);
  }

  // Resolve reply fields
  const replyTo = body.data.to ?? (originalMessage.from_address ? [String(originalMessage.from_address)] : undefined);
  if (!replyTo) {
    return c.json({ error: { code: 'validation_error', message: 'Cannot determine reply recipient. Provide "to" in request body.' } }, 400);
  }

  const replySubject = body.data.subject ?? (originalMessage.subject ? `Re: ${originalMessage.subject}` : 'Re:');
  const replyHtml = body.data.html ?? null;
  const replyText = body.data.text ?? null;

  if (!replyHtml && !replyText) {
    return c.json({ error: { code: 'validation_error', message: 'Either html or text must be provided' } }, 400);
  }

  const fromAddress = providerConfig.default_from ?? String(originalMessage.from_address ?? '');
  const allowedDomains = safeJsonParse<string[]>(providerConfig.allowed_domains_json, []);

  const now = new Date().toISOString();
  const newMessageId = generateId('msg');

  let status: string = MESSAGE_STATUSES.queued;
  let providerMessageId: string | null = null;
  let errorMessage: string | null = null;
  let sentAt: string | null = null;
  let failedAt: string | null = null;

  try {
    const providerSecrets = JSON.parse(await decrypt(providerConfig.config_encrypted, c.env.ENCRYPTION_KEY)) as {
      apiKey: string;
      webhookSecret?: string;
    };
    const resend = new ResendProvider();
    const sendResult = await resend.sendEmail(
      {
        id: newMessageId,
        to: replyTo,
        from: fromAddress,
        subject: replySubject,
        html: replyHtml,
        text: replyText,
        cc: body.data.cc,
        bcc: body.data.bcc,
        replyTo: body.data.replyTo,
      },
      {
        providerType: providerConfig.provider_type,
        apiKey: providerSecrets.apiKey,
        webhookSecret: providerSecrets.webhookSecret,
        mode: providerConfig.mode,
        environment: providerConfig.environment,
        defaultFrom: providerConfig.default_from,
        allowedDomains,
      },
    );

    providerMessageId = sendResult.id;
    status = MESSAGE_STATUSES.sent;
    sentAt = new Date().toISOString();
  } catch (error) {
    status = MESSAGE_STATUSES.failed;
    failedAt = new Date().toISOString();
    errorMessage = error instanceof Error ? error.message : 'Unknown provider error';
  }

  await c.env.DB.prepare(
    'INSERT INTO messages (id, project_id, provider_config_id, environment, to_address, from_address, reply_to, cc_json, bcc_json, subject, html, text, status, provider, provider_message_id, error, tags_json, raw_storage_key, html_storage_key, text_storage_key, idempotency_key_hash, created_at, queued_at, sent_at, failed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      newMessageId,
      projectId,
      providerConfig.id,
      originalMessage.environment,
      Array.isArray(replyTo) ? replyTo.join(', ') : replyTo,
      fromAddress,
      body.data.replyTo ?? null,
      JSON.stringify(body.data.cc ?? []),
      JSON.stringify(body.data.bcc ?? []),
      replySubject,
      replyHtml,
      replyText,
      status,
      providerConfig.provider_type,
      providerMessageId,
      errorMessage,
      '{}',
      null,
      null,
      null,
      null,
      now,
      status === MESSAGE_STATUSES.queued ? now : null,
      sentAt,
      failedAt,
    )
    .run();

  await c.env.DB.prepare(
    'INSERT INTO message_events (id, message_id, project_id, type, provider, payload_json, payload_storage_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      generateId('mevt'),
      newMessageId,
      projectId,
      status === MESSAGE_STATUSES.failed
        ? MESSAGE_EVENT_TYPES.failed
        : status === MESSAGE_STATUSES.sent
          ? MESSAGE_EVENT_TYPES.sent
          : MESSAGE_EVENT_TYPES.created,
      providerConfig.provider_type,
      JSON.stringify(body.data),
      null,
      now,
    )
    .run();

  const created = await c.env.DB.prepare('SELECT * FROM messages WHERE id = ?').bind(newMessageId).first();
  return c.json({ data: created }, 201);
});

export { replyRoutes };
