const PASSWORD_PREFIX = 'pbkdf2';
const PASSWORD_ITERATIONS = 100000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }
  return bytes;
}

function toBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function derivePasswordHash(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: toBufferSource(salt),
      iterations: PASSWORD_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    HASH_BYTES * 8,
  );

  return bytesToHex(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derivePasswordHash(password, salt);
  return `${PASSWORD_PREFIX}$${PASSWORD_ITERATIONS}$${bytesToHex(salt)}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [prefix, iterations, saltHex, hashHex] = stored.split('$');
  if (prefix !== PASSWORD_PREFIX || Number(iterations) !== PASSWORD_ITERATIONS || !saltHex || !hashHex) {
    return false;
  }

  const derived = await derivePasswordHash(password, hexToBytes(saltHex));
  return derived === hashHex;
}
