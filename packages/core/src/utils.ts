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

/**
 * Parse an inbound email address like `project-slug/user-slug+tag@domain`
 * into { projectSlug, userSlug, tag }.
 * Also handles `project-slug/user-slug@domain` (no tag).
 */
export function parseInboundAddress(address: string, domain: string): {
  projectSlug: string;
  userSlug: string;
  tag: string | null;
} | null {
  const normalized = address.toLowerCase().trim();
  const suffix = `@${domain}`;
  if (!normalized.endsWith(suffix)) {
    return null;
  }
  const local = normalized.slice(0, -suffix.length);
  if (!local) {
    return null;
  }

  // Format: project-slug/user-slug+tag  or  project-slug/user-slug
  const slashIdx = local.indexOf('/');
  if (slashIdx === -1) {
    return null;
  }

  const projectSlug = local.slice(0, slashIdx);
  const rest = local.slice(slashIdx + 1);

  const plusIdx = rest.indexOf('+');
  const userSlug = plusIdx === -1 ? rest : rest.slice(0, plusIdx);
  const tag = plusIdx === -1 ? null : rest.slice(plusIdx + 1);

  if (!projectSlug || !userSlug) {
    return null;
  }

  return { projectSlug, userSlug, tag };
}
