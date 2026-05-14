import { signAwsRequest } from './packages/providers/dist/ses.signing.js';
import { readFileSync } from 'fs';

const accessKey = readFileSync('/tmp/aws_key_id.txt', 'utf8').trim();
const secretKey = readFileSync('/tmp/aws_secret.txt', 'utf8').trim();

// Manually reproduce the signing steps
const crypto = globalThis.crypto;
const url = 'https://email.eu-west-1.amazonaws.com/v2/email/identities';
const parsed = new URL(url);
const host = parsed.host;
const method = 'GET';
const body = '';
const region = 'eu-west-1';
const SERVICE = 'ses';

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(data) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return toHex(hash);
}

const now = new Date();
const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const dateStamp = amzDate.slice(0, 8);
const payloadHash = await sha256Hex(body);

const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}`;
const signedHeaderNames = 'host;x-amz-date';

const canonicalRequest = [
  method,
  parsed.pathname,
  '', // query string
  canonicalHeaders,
  signedHeaderNames,
  payloadHash,
].join('\n');

console.log('=== OUR CANONICAL REQUEST ===');
console.log(canonicalRequest);
console.log('=== END ===');

// Sign it
const credentialScope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
const stringToSign = [
  'AWS4-HMAC-SHA256',
  amzDate,
  credentialScope,
  await sha256Hex(canonicalRequest),
].join('\n');

console.log('\n=== STRING TO SIGN ===');
console.log(stringToSign);
console.log('=== END ===');

// Now test with our actual function
const result = await signAwsRequest('GET', url, '', region, accessKey, secretKey);
console.log('\n=== signAwsRequest result ===');
console.log('Authorization:', result.authorization);
console.log('amzDate:', result.amzDate);

// Make the actual call
const response = await fetch(url, {
  method: 'GET',
  headers: { Authorization: result.authorization, 'X-Amz-Date': result.amzDate },
});

console.log('\nHTTP Status:', response.status);
const text = await response.text();
console.log('Response:', text.substring(0, 500));
