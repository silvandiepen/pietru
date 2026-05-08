const EMAIL_REGEX = /^(?<name>.*<)?\s*(?<email>[^\s<>@]+@[^\s<>@]+)\s*>?$/;
const RANDOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => RANDOM_ALPHABET[byte % RANDOM_ALPHABET.length]).join('');
}

export function generateId(prefix: string): string {
  return `${prefix}_${randomString(24)}`;
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseEmail(value: string): { name: string | null; email: string | null } {
  const match = value.match(EMAIL_REGEX);
  if (!match?.groups?.email) {
    return { name: null, email: null };
  }

  const name = match.groups.name?.replace(/<$/, '').trim() ?? '';
  return {
    name: name.length > 0 ? name.replace(/^"|"$/g, '') : null,
    email: match.groups.email.toLowerCase(),
  };
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function bytesToHexString(bytes: Uint8Array): string {
  return bytesToHex(bytes);
}
