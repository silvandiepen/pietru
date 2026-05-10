import { generateId, parseInboundAddress } from '@pietru/core';
import { MESSAGE_STATUSES } from '@pietru/core';
import type { Env } from '../env';
import { extractEmailBody, extractOtp } from './email-parser';

const INBOUND_DOMAIN = 'pietru.dev';
const TEST_DOMAIN = 'test.pietru.dev';

export async function handleInboundEmail(
  message: ForwardableEmailMessage,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  const toAddress = message.to;
  const fromAddress = message.from ?? '';
  const messageId = generateId('msg');
  const now = new Date().toISOString();

  console.log(`[email] Received email: ${fromAddress} → ${toAddress}`);

  // Read the raw email stream
  const chunks: Uint8Array[] = [];
  const reader = message.raw.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const rawEmail = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    rawEmail.set(chunk, offset);
    offset += chunk.length;
  }

  // Cache raw email to R2
  const rawStorageKey = `${messageId}/raw.eml`;
  try {
    await env.STORAGE.put(rawStorageKey, rawEmail, {
      httpMetadata: { contentType: 'message/rfc822' },
    });
    console.log(`[email] Cached raw email in R2: ${rawStorageKey} (${totalLength} bytes)`);
  } catch (err) {
    console.error(`[email] Failed to cache raw email to R2:`, err);
  }

  // Parse HTML/text body from raw MIME
  const rawText = new TextDecoder('utf-8', { fatal: false }).decode(rawEmail);
  const { html, text } = extractEmailBody(rawText);

  // Extract OTP if present
  const otp = extractOtp(html, text);

  console.log(`[email] Parsed body: ${totalLength} bytes raw, html=${html ? html.length + 'b' : 'null'}, text=${text ? text.length + 'b' : 'null'}, otp=${otp ?? 'none'}`);

  // Extract headers
  const subject = message.headers.get('subject') ?? '(no subject)';
  const ccHeader = message.headers.get('cc');
  const replyToHeader = message.headers.get('reply-to');

  // Extract local part and domain from the to address
  const atIdx = toAddress.lastIndexOf('@');
  const localPart = atIdx !== -1 ? toAddress.slice(0, atIdx).toLowerCase().trim() : '';
  const toDomain = atIdx !== -1 ? toAddress.slice(atIdx + 1).toLowerCase().trim() : '';

  let projectId: string | null = null;
  let tags: Record<string, string | null> | null = null;
  let parsed: ReturnType<typeof parseInboundAddress> = null;

  // ── Reserved address routing ──────────────────────────────────
  if (localPart) {
    try {
      const reserved = await env.DB.prepare(
        'SELECT id, admin_project_id, local_part FROM reserved_addresses WHERE local_part = ? AND is_active = 1',
      )
        .bind(localPart)
        .first<{ id: string; admin_project_id: string; local_part: string }>();

      if (reserved) {
        projectId = reserved.admin_project_id;
        tags = { reserved_address: reserved.local_part };
        console.log(`[email] Matched reserved address: ${localPart} → admin project ${reserved.admin_project_id}`);
      }
    } catch (err) {
      console.error(`[email] Error looking up reserved address:`, err);
    }
  }

  // ── Test alias routing (test.pietru.dev) ─────────────────────────
  if (toDomain === TEST_DOMAIN && localPart) {
    try {
      const alias = await env.DB.prepare(
        'SELECT id, user_id, project_id, local_part FROM test_aliases WHERE local_part = ? AND is_active = 1',
      )
        .bind(localPart)
        .first<{ id: string; user_id: string; project_id: string | null; local_part: string }>();

      if (alias) {
        projectId = alias.project_id;
        tags = { test_alias: alias.local_part, user_id: alias.user_id };
        console.log(`[email] Matched test alias: ${localPart}@${TEST_DOMAIN} → user=${alias.user_id} project=${alias.project_id ?? 'none'}`);
      } else {
        console.log(`[email] No test alias found for: ${localPart}@${TEST_DOMAIN}`);
      }
    } catch (err) {
      console.error(`[email] Error looking up test alias:`, err);
    }
  }

  // ── Project/user slug routing ─────────────────────────────────
  if (!projectId && toDomain === INBOUND_DOMAIN) {
    parsed = parseInboundAddress(toAddress, INBOUND_DOMAIN);

    if (parsed) {
      const { projectSlug, userSlug, tag } = parsed;
      console.log(`[email] Parsed address: project=${projectSlug} user=${userSlug} tag=${tag}`);

      try {
        const project = await env.DB.prepare(
          'SELECT p.id, p.user_id FROM projects p WHERE p.slug = ?',
        )
          .bind(projectSlug)
          .first<{ id: string; user_id: string }>();

        if (project) {
          const inboundAddress = await env.DB.prepare(
            'SELECT id FROM inbound_addresses WHERE project_id = ? AND user_slug = ? AND is_active = 1',
          )
            .bind(project.id, userSlug)
            .first<{ id: string }>();

          if (inboundAddress) {
            projectId = project.id;
            tags = { tag, userSlug };
            console.log(`[email] Matched project: ${project.id}`);
          } else {
            console.log(`[email] No active inbound address for user=${userSlug} in project=${project.id}`);
          }
        } else {
          console.log(`[email] No project found with slug=${projectSlug}`);
        }
      } catch (err) {
        console.error(`[email] Error looking up project:`, err);
      }
    } else {
      console.log(`[email] Address not in project/user format: ${toAddress}`);
    }
  }

  // Store the message in D1 with body content
  try {
    const result = await env.DB.prepare(
      `INSERT INTO messages (
        id, project_id, provider_config_id, environment, to_address, from_address,
        reply_to, cc_json, bcc_json, subject, html, text, status, provider,
        provider_message_id, error, tags_json, raw_storage_key, html_storage_key,
        text_storage_key, idempotency_key_hash, created_at, queued_at, sent_at, failed_at
      ) VALUES (?, ?, NULL, 'production', ?, ?, ?, ?, NULL, ?, ?, ?, ?, 'cloudflare_email_routing',
      NULL, NULL, ?, ?, NULL, NULL, NULL, NULL, ?, NULL, NULL, NULL)`,
    ).bind(
      messageId,
      projectId,
      toAddress,
      fromAddress,
      replyToHeader ?? null,
      ccHeader ? JSON.stringify([ccHeader]) : null,
      subject,
      html,
      text,
      MESSAGE_STATUSES.received,
      tags ? JSON.stringify(tags) : null,
      rawStorageKey,
      now,
    ).run();

    console.log(`[email] Message stored in D1: ${messageId} (success=${result.success})`);
  } catch (err) {
    console.error(`[email] FAILED to insert message into D1:`, err);
  }

  // Create received event
  try {
    await env.DB.prepare(
      'INSERT INTO message_events (id, message_id, project_id, type, provider, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      generateId('evt'),
      messageId,
      projectId ?? 'none',
      'received',
      'cloudflare_email_routing',
      JSON.stringify({ to: toAddress, from: fromAddress, parsed: !!parsed, otp }),
      now,
    ).run();
  } catch (err) {
    console.error(`[email] FAILED to insert event into D1:`, err);
  }

  // Fire email hooks if we have a project
  if (projectId) {
    ctx.waitUntil(
      (async () => {
        try {
          const hooksResult = await env.DB.prepare(
            'SELECT id, filter_type, filter_value, webhook_url, webhook_secret, webhook_headers_json FROM email_hooks WHERE project_id = ? AND is_active = 1',
          )
            .bind(projectId)
            .all<{
              id: string;
              filter_type: string;
              filter_value: string | null;
              webhook_url: string;
              webhook_secret: string | null;
              webhook_headers_json: string | null;
            }>();

          const fromDomain = fromAddress.split('@')[1] ?? '';

          for (const hook of hooksResult.results) {
            let matched = false;

            switch (hook.filter_type) {
              case 'tag':
                matched = hook.filter_value != null && hook.filter_value === parsed?.tag;
                break;
              case 'from_domain':
                matched = hook.filter_value != null && hook.filter_value === fromDomain;
                break;
              case 'subject_regex': {
                if (hook.filter_value) {
                  try {
                    matched = new RegExp(hook.filter_value, 'i').test(subject);
                  } catch {
                    matched = false;
                  }
                }
                break;
              }
              case 'any':
                matched = true;
                break;
            }

            if (!matched) continue;

            const payload = {
              event: 'email.received',
              timestamp: new Date().toISOString(),
              message_id: messageId,
              project_id: projectId,
              hook_id: hook.id,
              data: {
                to: toAddress,
                from: fromAddress,
                subject,
                tag: parsed?.tag ?? null,
                user_slug: parsed?.userSlug ?? null,
                otp,
              },
            };

            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };

            if (hook.webhook_secret) {
              const encoder = new TextEncoder();
              const key = await crypto.subtle.importKey(
                'raw',
                encoder.encode(hook.webhook_secret),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign'],
              );
              const signature = await crypto.subtle.sign(
                'HMAC',
                key,
                encoder.encode(JSON.stringify(payload)),
              );
              const hex = Array.from(new Uint8Array(signature))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
              headers['X-Pietru-Signature'] = `sha256=${hex}`;
            }

            if (hook.webhook_headers_json) {
              try {
                const customHeaders = JSON.parse(hook.webhook_headers_json);
                for (const [k, v] of Object.entries(customHeaders)) {
                  if (typeof v === 'string') {
                    headers[k] = v;
                  }
                }
              } catch {
                // Ignore invalid JSON
              }
            }

            try {
              const response = await fetch(hook.webhook_url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
              });
              console.log(`[email-hook] Fired hook ${hook.id} → ${hook.webhook_url} (status=${response.status})`);
            } catch (err) {
              console.error(`[email-hook] Failed to fire hook ${hook.id}:`, err);
            }
          }
        } catch (err) {
          console.error(`[email-hook] Error processing hooks:`, err);
        }
      })(),
    );
  }

  // Email has been processed and stored. No need to reject or forward.
}
