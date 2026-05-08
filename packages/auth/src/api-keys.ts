type Environment = 'development' | 'preview' | 'production';

const API_KEY_PREFIXES = {
  production: 'mg_pk_live_',
  development: 'mg_pk_test_',
} as const;

const RANDOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => RANDOM_ALPHABET[byte % RANDOM_ALPHABET.length]).join('');
}

export async function hashApiKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return bytesToHex(new Uint8Array(digest));
}

export async function generateApiKey(environment: Environment): Promise<{ key: string; prefix: string; hash: string }> {
  const prefix = environment === 'production' ? API_KEY_PREFIXES.production : API_KEY_PREFIXES.development;
  const key = `${prefix}${randomString(32)}`;
  return {
    key,
    prefix,
    hash: await hashApiKey(key),
  };
}

export async function generateAccountApiKey(): Promise<{ key: string; prefix: string; hash: string }> {
  const prefix = 'mg_ak_';
  const key = `${prefix}${randomString(32)}`;
  return {
    key,
    prefix,
    hash: await hashApiKey(key),
  };
}
