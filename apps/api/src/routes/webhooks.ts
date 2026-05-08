import { decrypt } from '@pietru/auth';
import { generateId } from '@pietru/core';
import { ResendProvider } from '@pietru/providers';
import { Hono } from 'hono';
import type { Env, AppVariables } from '../env';

type App = { Bindings: Env; Variables: AppVariables };

const webhookRoutes = new Hono<App>();

webhookRoutes.post('/webhooks/providers/resend', async (c) => {
  const payload = await c.req.text();
  const configs = await c.env.DB.prepare(
    "SELECT id, project_id, provider_type, config_encrypted FROM provider_configs WHERE provider_type = 'resend'",
  ).all<{
    id: string;
    project_id: string;
    provider_type: string;
    config_encrypted: string;
  }>();

  const provider = new ResendProvider();
  for (const config of configs.results) {
    try {
      const decrypted = JSON.parse(await decrypt(config.config_encrypted, c.env.ENCRYPTION_KEY)) as {
        apiKey: string;
        webhookSecret?: string;
      };
      const events = await provider.handleWebhook?.(
        payload,
        c.req.raw.headers,
        { providerType: 'resend', apiKey: decrypted.apiKey, webhookSecret: decrypted.webhookSecret },
      );

      if (!events || events.length === 0) {
        continue;
      }

      for (const event of events) {
        const message = event.providerMessageId
          ? await c.env.DB.prepare(
              'SELECT id, project_id FROM messages WHERE provider_message_id = ? ORDER BY created_at DESC LIMIT 1',
            )
              .bind(event.providerMessageId)
              .first<{ id: string; project_id: string }>()
          : null;

        if (!message) {
          continue;
        }

        const payloadStorageKey =
          JSON.stringify(event.payload).length > 4096
            ? `${message.id}/events/${generateId('evt')}.json`
            : null;

        if (payloadStorageKey) {
          await c.env.STORAGE.put(payloadStorageKey, JSON.stringify(event.payload));
        }

        await c.env.DB.prepare(
          'INSERT INTO message_events (id, message_id, project_id, type, provider, payload_json, payload_storage_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        )
          .bind(
            generateId('mevt'),
            message.id,
            message.project_id,
            event.type,
            event.provider,
            payloadStorageKey ? null : JSON.stringify(event.payload),
            payloadStorageKey,
            event.occurredAt,
          )
          .run();
      }

      return c.json({ data: { ok: true } });
    } catch {
      continue;
    }
  }

  return c.json({ error: { code: 'invalid_signature', message: 'Webhook could not be verified' } }, 401);
});

export { webhookRoutes };
