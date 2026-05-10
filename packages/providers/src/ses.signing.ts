/**
 * AWS Signature Version 4 signing for SES v2 HTTP API.
 *
 * Uses only Web Crypto — no AWS SDK dependency.
 *
 * Reference: https://docs.aws.amazon.com/ses/latest/APIReference-V2/common-signing.html
 */

const ALGORITHM = 'AWS4-HMAC-SHA256';
const SERVICE = 'ses';
const SIGNED_HEADERS = 'content-type;host;x-amz-date';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return toHex(hash);
}

function toBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toBuffer(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, toBuffer(data));
}

async function hmacSha256Text(key: Uint8Array, data: string): Promise<ArrayBuffer> {
  return hmacSha256(key, new TextEncoder().encode(data));
}

async function getSignatureKey(
  secretKey: string,
  dateStamp: string,
  region: string,
): Promise<Uint8Array> {
  const kDate = await hmacSha256Text(new TextEncoder().encode(`AWS4${secretKey}`), dateStamp);
  const kRegion = await hmacSha256Text(new Uint8Array(kDate), region);
  const kService = await hmacSha256Text(new Uint8Array(kRegion), SERVICE);
  const kRequest = await hmacSha256Text(new Uint8Array(kService), 'aws4_request');
  return new Uint8Array(kRequest);
}

export interface AwsSigningResult {
  authorization: string;
  amzDate: string;
}

/**
 * Sign a request for AWS SES v2.
 *
 * @param method  HTTP method (GET or POST)
 * @param url     Full SES endpoint URL
 * @param body    Request body string (empty string for GET)
 * @param region  AWS region (e.g. 'eu-west-1')
 * @param accessKeyId
 * @param secretAccessKey
 */
export async function signAwsRequest(
  method: string,
  url: string,
  body: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
): Promise<AwsSigningResult> {
  const parsed = new URL(url);
  const host = parsed.host;
  const canonicalUri = parsed.pathname;
  const canonicalQuerystring = parsed.searchParams.toString();

  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // YYYYMMDDTHHmmSSZ
  const dateStamp = amzDate.slice(0, 8); // YYYYMMDD

  const payloadHash = await sha256Hex(body);

  const canonicalHeaders = [
    `content-type:application/json`,
    `host:${host}`,
    `x-amz-date:${amzDate}`,
  ].join('\n');

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    SIGNED_HEADERS,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
  const stringToSign = [
    ALGORITHM,
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region);
  const signature = toHex(await hmacSha256Text(signingKey, stringToSign));

  const authorization = [
    `${ALGORITHM} Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${SIGNED_HEADERS}`,
    `Signature=${signature}`,
  ].join(', ');

  return { authorization, amzDate };
}
