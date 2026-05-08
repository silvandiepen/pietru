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

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use(
  '*',
  cors({
    origin: async (origin) => {
      if (!origin) return '*';
      const allowed = [
        'https://app-pietru.hakobs.com',
        'https://pietru.hakobs.com',
        'http://localhost:5173',
        'http://localhost:5174',
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
app.route('/auth', authRoutes);
app.route('/', projectRoutes);
app.route('/', accountApiKeysRoutes);
app.route('/', apiKeyRoutes);
app.route('/', providerConfigRoutes);
app.route('/', messageRoutes);
app.route('/', templateRoutes);
app.route('/', webhookRoutes);
app.route('/', apiProjectsRoutes);

export default app;
