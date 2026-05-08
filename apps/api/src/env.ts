import type { Environment } from '@pietru/core';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
}

export interface AppVariables {
  userId?: string;
  sessionId?: string;
  projectId?: string;
  environment?: Environment;
}
