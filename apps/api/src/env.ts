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
  PIETRU_SES_REGION: string;
  PIETRU_SES_ACCESS_KEY_ID: string;
  PIETRU_SES_SECRET_ACCESS_KEY: string;
}

export interface AppVariables {
  userId?: string;
  sessionId?: string;
  accountId?: string;
  projectId?: string;
  environment?: Environment;
}
