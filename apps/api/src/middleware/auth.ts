import { hashApiKey } from '@pietru/auth';
import { API_KEY_PREFIXES, ENVIRONMENTS } from '@pietru/core';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import type { AppVariables, Env } from '../env';

type AppMiddleware = {
  Bindings: Env;
  Variables: AppVariables;
};

function errorResponse(code: string, message: string, status = 401) {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function authenticateUserSession(
  c: { env: Env; set: <K extends keyof AppVariables>(key: K, value: AppVariables[K]) => void },
  token: string,
): Promise<Response | { userId: string; sessionId: string }> {
  let payload: { sub?: string; sid?: string; sth?: string; exp?: number };
  try {
    payload = (await verify(token, c.env.JWT_SECRET, 'HS256')) as typeof payload;
  } catch {
    return errorResponse('unauthorized', 'Invalid session');
  }

  if (!payload.sub || !payload.sid || !payload.sth || !payload.exp) {
    return errorResponse('unauthorized', 'Invalid session');
  }

  const session = await c.env.DB.prepare(
    'SELECT id, user_id, token_hash, expires_at, revoked_at FROM user_sessions WHERE id = ? AND user_id = ?',
  )
    .bind(payload.sid, payload.sub)
    .first<{ id: string; user_id: string; token_hash: string; expires_at: string; revoked_at: string | null }>();

  if (!session || session.token_hash !== payload.sth || session.revoked_at || Date.parse(session.expires_at) <= Date.now()) {
    return errorResponse('unauthorized', 'Session expired');
  }

  c.set('userId', session.user_id);
  c.set('sessionId', session.id);
  return { userId: session.user_id, sessionId: session.id };
}

export async function authenticateProjectApiKey(
  c: { env: Env; set: <K extends keyof AppVariables>(key: K, value: AppVariables[K]) => void },
  key: string,
): Promise<Response | { projectId: string; environment: AppVariables['environment'] }> {
  const environment =
    key.startsWith(API_KEY_PREFIXES.production)
      ? ENVIRONMENTS.production
      : key.startsWith(API_KEY_PREFIXES.development)
        ? ENVIRONMENTS.development
        : null;

  if (!environment) {
    return errorResponse('unauthorized', 'Invalid API key prefix');
  }

  const hash = await hashApiKey(key);
  const record = await c.env.DB.prepare(
    'SELECT id, project_id, environment, revoked_at FROM project_api_keys WHERE key_hash = ?',
  )
    .bind(hash)
    .first<{ id: string; project_id: string; environment: string; revoked_at: string | null }>();

  if (!record || record.revoked_at) {
    return errorResponse('unauthorized', 'Invalid API key');
  }

  c.set('projectId', record.project_id);
  c.set('environment', record.environment as AppVariables['environment']);
  return { projectId: record.project_id, environment: record.environment as AppVariables['environment'] };
}

export const requireUserSession = createMiddleware<AppMiddleware>(async (c, next) => {
  const token = getCookie(c, 'session');
  if (!token) {
    return errorResponse('unauthorized', 'Missing session cookie');
  }

  const result = await authenticateUserSession(c, token);
  if (result instanceof Response) {
    return result;
  }

  await next();
});

export const requireProjectApiKey = createMiddleware<AppMiddleware>(async (c, next) => {
  const authorization = c.req.header('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return errorResponse('unauthorized', 'Missing API key');
  }

  const result = await authenticateProjectApiKey(c, authorization.slice('Bearer '.length).trim());
  if (result instanceof Response) {
    return result;
  }

  await next();
});
