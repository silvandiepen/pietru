import type { Environment } from '@pietru/core';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  SYSTEM_EMAIL_API_KEY: string;
  SYSTEM_EMAIL_FROM: string;
  DASHBOARD_URL: string;
}

export interface AppVariables {
  userId?: string;
  sessionId?: string;
  accountId?: string;
  projectId?: string;
  environment?: Environment;
}
