/**
 * Lightweight MIME body extractor for Cloudflare Workers.
 * Parses a raw email (RFC 822) and returns the text and/or HTML body.
 *
 * Handles:
 * - Simple single-part messages (text/plain, text/html)
 * - multipart/alternative (picks HTML first, falls back to text)
 * - multipart/mixed with nested multipart/alternative
 * - Base64 and quoted-printable content transfer encodings
 * - OTP/code extraction from email bodies
 */

function decodeBase64(str: string): string {
  try {
    return atob(str.replace(/\s/g, ''));
  } catch {
    return str;
  }
}

function decodeQuotedPrintable(str: string): string {
  return str
    .replace(/=\r?\n/g, '') // soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function decodeContent(encoded: string, encoding?: string): string {
  const enc = (encoding ?? '').toLowerCase().trim();
  if (enc === 'base64') return decodeBase64(encoded);
  if (enc === 'quoted-printable') return decodeQuotedPrintable(encoded);
  return encoded; // 7bit, 8bit, binary — return as-is
}

interface Boundary {
  boundary: string;
  start: number;
  end: number;
}

function findBoundaries(raw: string, boundary: string): Boundary[] {
  const delimiter = `--${boundary}`;
  const closeDelimiter = `--${boundary}--`;
  const results: Boundary[] = [];
  let pos = 0;

  while (true) {
    const startIdx = raw.indexOf(delimiter, pos);
    if (startIdx === -1) break;

    const lineEnd = raw.indexOf('\n', startIdx);
    if (lineEnd === -1) break;

    const line = raw.slice(startIdx, lineEnd).trim();
    if (line === closeDelimiter) break;

    const nextIdx = raw.indexOf(delimiter, lineEnd);
    if (nextIdx === -1) break;

    results.push({
      boundary,
      start: lineEnd + 1,
      end: nextIdx,
    });

    pos = nextIdx;
  }

  return results;
}

function parseHeaders(block: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const lines = block.split(/\r?\n/);
  let currentKey = '';

  for (const line of lines) {
    if (line === '') break;

    if (/^[ \t]/.test(line) && currentKey) {
      headers[currentKey] += ' ' + line.trim();
    } else {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        currentKey = line.slice(0, colonIdx).trim().toLowerCase();
        headers[currentKey] = line.slice(colonIdx + 1).trim();
      }
    }
  }

  return headers;
}

function getBodyBlock(fullBlock: string): string {
  const headerEnd = fullBlock.search(/\r?\n\r?\n/);
  if (headerEnd === -1) return '';
  return fullBlock.slice(headerEnd).replace(/^\r?\n/, '');
}

function parsePart(content: string): { html: string | null; text: string | null } {
  const normalized = content.replace(/\r\n/g, '\n');
  const firstBlank = normalized.indexOf('\n\n');
  const headers = firstBlank !== -1
    ? parseHeaders(normalized.slice(0, firstBlank))
    : parseHeaders(normalized);

  const contentType = headers['content-type'] ?? 'text/plain';
  const encoding = headers['content-transfer-encoding'];
  const body = firstBlank !== -1 ? normalized.slice(firstBlank + 2) : '';
  const decoded = decodeContent(body, encoding);
  const lowerCt = contentType.toLowerCase();

  if (lowerCt.startsWith('multipart/')) {
    const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/);
    if (boundaryMatch) {
      const parts = findBoundaries(normalized, boundaryMatch[1]);
      let html: string | null = null;
      let text: string | null = null;
      for (const part of parts) {
        const sub = parsePart(normalized.slice(part.start, part.end));
        if (sub.html && !html) html = sub.html;
        if (sub.text && !text) text = sub.text;
      }
      return { html, text };
    }
    return { html: null, text: null };
  }

  if (lowerCt.includes('text/html')) return { html: decoded, text: null };
  return { html: null, text: decoded };
}

export function extractEmailBody(raw: string): { html: string | null; text: string | null } {
  return parsePart(raw);
}

/**
 * Extract OTP/verification codes from email body text or HTML.
 * Looks for common patterns:
 * - "Your code is: 123456"
 * - "verification code: 123456"
 * - "OTP: 123456"
 * - Standalone 4-8 digit numbers in common contexts
 * - "123456 is your code"
 */
export function extractOtp(html: string | null, text: string | null): string | null {
  // Prefer text, fall back to stripped HTML
  const content = text ?? (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null);
  if (!content) return null;

  const patterns = [
    // "Your code is: 123456" / "code is 123456" / "verification code: 123456"
    /(?:code|pin|otp|passcode|token|verification)[\s:is]*(\d{4,8})/i,
    // "123456 is your code" / "123456 is your verification"
    /(\d{4,8})\s+is\s+your\s+(?:code|verification|pin|otp|passcode)/i,
    // Standalone code in quotes, brackets, or bold
    /(?:["'\[`]|\b)(\d{4,8})(?:["'\]`]|\b)(?:\s*(?:is|are|\.|,|!|\s))/,
    // Amazon AWS style: "Your verification code is 123456"
    /(?:verification|security)\s+(?:code|number)[\s:is]*(\d{4,8})/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}
