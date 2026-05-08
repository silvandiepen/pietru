import { vi } from 'vitest';
import type { Env, AppVariables } from '../env';

/**
 * Creates a mock D1 database with chainable prepare().bind().first()/all()/run().
 * The `bind()` mock always returns the LATEST `first`, `all`, `run` — so tests
 * can safely reassign `mockDb.first` after creation.
 */
export function createMockDb(overrides: Record<string, unknown> = {}) {
  const state = {
    first: vi.fn().mockResolvedValue(null),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
  };

  const bind = vi.fn().mockImplementation(() => ({
    first: state.first,
    all: state.all,
    run: state.run,
  }));

  const prepare = vi.fn().mockReturnValue({ bind });

  return {
    prepare,
    bind,
    get first() { return state.first; },
    set first(fn: ReturnType<typeof vi.fn>) { state.first = fn; },
    get all() { return state.all; },
    set all(fn: ReturnType<typeof vi.fn>) { state.all = fn; },
    get run() { return state.run; },
    set run(fn: ReturnType<typeof vi.fn>) { state.run = fn; },
    ...overrides,
  };
}

/**
 * Creates a mock KV namespace.
 */
export function createMockKv() {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ keys: [], list_complete: true }),
  };
}

/**
 * Creates a mock R2 bucket.
 */
export function createMockR2() {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    head: vi.fn().mockResolvedValue(null),
  };
}

/**
 * Creates a full mock Env with D1, KV, R2, and secrets.
 */
export function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: createMockDb() as unknown as D1Database,
    KV: createMockKv() as unknown as KVNamespace,
    STORAGE: createMockR2() as unknown as R2Bucket,
    JWT_SECRET: 'test-jwt-secret-for-testing',
    ENCRYPTION_KEY: 'test-encryption-key-32bytes!!',
    ...overrides,
  };
}

/**
 * Creates a minimal Hono-like context object for testing route handlers.
 */
export function createMockContext(opts: {
  env?: Env;
  req?: {
    json: () => Promise<unknown>;
    header: (name: string) => string | undefined;
    param: (name: string) => string;
    query: (name: string) => string | undefined;
  };
  json?: (data: unknown, status?: number) => Response;
  variables?: Partial<AppVariables>;
} = {}) {
  const variables: Record<string, unknown> = { ...opts.variables };

  const jsonFn = opts.json ?? ((data: unknown, status?: number) => {
    const body = JSON.stringify(data);
    return new Response(body, {
      status: status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  return {
    env: opts.env ?? createMockEnv(),
    req: opts.req ?? {
      json: () => Promise.resolve({}),
      header: () => undefined,
      param: () => '',
      query: () => undefined,
    },
    json: jsonFn,
    get: <K extends keyof AppVariables>(key: K): AppVariables[K] => variables[key] as AppVariables[K],
    set: <K extends keyof AppVariables>(key: K, value: AppVariables[K]): void => {
      variables[key] = value;
    },
    _variables: variables,
  };
}
