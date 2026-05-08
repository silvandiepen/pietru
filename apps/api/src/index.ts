import { cors } from 'hono/cors';
import { Hono } from 'hono';
import type { Env, AppVariables } from './env';
import { apiKeyRoutes } from './routes/api-keys';
import { authRoutes } from './routes/auth';
import { messageRoutes } from './routes/messages';
import { projectRoutes } from './routes/projects';
import { providerConfigRoutes } from './routes/provider-configs';
import { webhookRoutes } from './routes/webhooks';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use(
  '*',
  cors({
    origin: [
      /^https:\/\/[a-z0-9-]+\.pietru-dashboard\.pages\.dev$/,
      /^https:\/\/[a-z0-9-]+\.pietru-marketing\.pages\.dev$/,
      'http://localhost:5173',
      'http://localhost:5174',
    ],
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
app.route('/', apiKeyRoutes);
app.route('/', providerConfigRoutes);
app.route('/', messageRoutes);
app.route('/', webhookRoutes);

export default app;
