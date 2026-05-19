import { cors } from 'hono/cors';
import { Hono } from 'hono';
import type { Env, AppVariables } from './env';
import { accountApiKeysRoutes } from './routes/account-api-keys';
import { apiKeyRoutes } from './routes/api-keys';
import { apiProjectsRoutes } from './routes/api-projects';
import { authRoutes } from './routes/auth';
import { messageRoutes } from './routes/messages';
import { projectRoutes } from './routes/projects';
import { providerConfigRoutes } from './routes/provider-configs';
import { templateRoutes } from './routes/templates';
import { webhookRoutes } from './routes/webhooks';
import { inboundRoutes } from './routes/inbound-addresses';
import { emailHookRoutes } from './routes/email-hooks';
import { statsRoutes } from './routes/stats';
import { inboxRoutes } from './routes/inbox';
import { replyRoutes } from './routes/reply';
import { domainVerificationRoutes } from './routes/domain-verifications';
import { reservedRoutes } from './routes/reserved-addresses';
import { testAliasRoutes } from './routes/test-aliases';
import { mailingListRoutes } from './routes/mailing-list';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use(
  '*',
  cors({
    origin: async (origin) => {
      if (!origin) return '*';
      const allowed = [
        'https://pietru.dev',
        'https://app.pietru.dev',
        'https://api.pietru.dev',
        'https://dev.pietru.dev',
        'https://app.dev.pietru.dev',
        'https://docs.dev.pietru.dev',
        'https://api.dev.pietru.dev',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ];
      if (allowed.includes(origin)) return origin;
      if (/^https:\/\/[a-z0-9-]+\.pietru-dashboard\.pages\.dev$/.test(origin)) return origin;
      if (/^https:\/\/[a-z0-9-]+\.pietru-marketing\.pages\.dev$/.test(origin)) return origin;
      return undefined;
    },
    credentials: true,
    exposeHeaders: ['Set-Cookie'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.onError((error, c) => {
  return c.json(
    {
      error: {
        code: 'internal_error',
        message: error.message || 'Internal server error',
      },
    },
    500,
  );
});

app.get('/', (c) => c.json({ data: { ok: true } }));
app.route('/v1/auth', authRoutes);
app.route('/v1/projects', projectRoutes);
// Routes with .use('*') removed — requireUserSession applied per-handler to avoid intercepting other /v1/* routes
app.route('/v1', accountApiKeysRoutes);
app.route('/v1', apiKeyRoutes);
app.route('/v1', providerConfigRoutes);
app.route('/v1', messageRoutes);
app.route('/v1', templateRoutes);
app.route('/v1', webhookRoutes);
app.route('/v1', apiProjectsRoutes);
app.route('/v1', inboundRoutes);
app.route('/v1', emailHookRoutes);
app.route('/v1', statsRoutes);
app.route('/v1', inboxRoutes);
app.route('/v1', replyRoutes);
app.route('/v1', reservedRoutes);
app.route('/v1', testAliasRoutes);
app.route('/v1', domainVerificationRoutes);
app.route('/v1', mailingListRoutes);

import { handleInboundEmail } from './inbound';

export default {
  fetch: app.fetch,
  email: handleInboundEmail,
};
