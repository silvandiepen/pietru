const ENCRYPTION_PREFIX = 'enc';
const ENCRYPTION_ITERATIONS = 100000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

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

async function deriveAesKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toBufferSource(salt),
      iterations: ENCRYPTION_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encrypt(text: string, key: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cryptoKey = await deriveAesKey(key, salt);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(text),
  );

  return `${ENCRYPTION_PREFIX}$${ENCRYPTION_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(iv)}$${bytesToHex(new Uint8Array(cipherBuffer))}`;
}

export async function decrypt(ciphertext: string, key: string): Promise<string> {
  const [prefix, iterations, saltHex, ivHex, cipherHex] = ciphertext.split('$');
  if (prefix !== ENCRYPTION_PREFIX || Number(iterations) !== ENCRYPTION_ITERATIONS || !saltHex || !ivHex || !cipherHex) {
    throw new Error('Invalid ciphertext format');
  }

  const cryptoKey = await deriveAesKey(key, hexToBytes(saltHex));
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toBufferSource(hexToBytes(ivHex)) },
    cryptoKey,
    toBufferSource(hexToBytes(cipherHex)),
  );

  return new TextDecoder().decode(plainBuffer);
}
