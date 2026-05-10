/**
 * Lightweight MIME body extractor for Cloudflare Workers.
 * Parses a raw email (RFC 822) and returns the text and/or HTML body.
 *
 * Handles:
 * - Simple single-part messages (text/plain, text/html)
 * - multipart/alternative (picks HTML first, falls back to text)
 * - multipart/mixed with nested multipart/alternative
 * - Base64 and quoted-printable content transfer encodings
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

    // Skip past the delimiter line
    const lineEnd = raw.indexOf('\n', startIdx);
    if (lineEnd === -1) break;

    // Check for close delimiter
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
    if (line === '') break; // blank line = end of headers

    if (/^[ \t]/.test(line) && currentKey) {
      // Continuation line
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

function getBodyBlock(headers: Record<string, string>, fullBlock: string): string {
  // Find the blank line separating headers from body
  const headerEnd = fullBlock.search(/\r?\n\r?\n/);
  if (headerEnd === -1) return '';
  return fullBlock.slice(headerEnd).replace(/^\r?\n/, '');
}

export function extractEmailBody(raw: string): { html: string | null; text: string | null } {
  // Normalize line endings
  const normalized = raw.replace(/\r\n/g, '\n');

  // Split headers from body at first blank line
  const firstBlank = normalized.indexOf('\n\n');
  const topHeaders = firstBlank !== -1
    ? parseHeaders(normalized.slice(0, firstBlank))
    : parseHeaders(normalized);

  const contentType = (topHeaders['content-type'] ?? 'text/plain').toLowerCase();
  const contentTransferEncoding = topHeaders['content-transfer-encoding'];

  // Single-part message
  if (!contentType.startsWith('multipart/')) {
    const body = firstBlank !== -1 ? normalized.slice(firstBlank + 2) : '';
    const decoded = decodeContent(body, contentTransferEncoding);

    if (contentType.includes('text/html')) return { html: decoded, text: null };
    return { html: null, text: decoded };
  }

  // Multipart message — extract boundary
  const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/);
  if (!boundaryMatch) return { html: null, text: null };

  const boundary = boundaryMatch[1];
  const parts = findBoundaries(normalized, boundary);

  let html: string | null = null;
  let text: string | null = null;

  for (const part of parts) {
    const partContent = normalized.slice(part.start, part.end);
    const partHeaders = parseHeaders(partContent);
    const partContentType = (partHeaders['content-type'] ?? 'text/plain').toLowerCase();
    const partEncoding = partHeaders['content-transfer-encoding'];

    // Handle nested multipart (e.g. multipart/mixed containing multipart/alternative)
    if (partContentType.startsWith('multipart/')) {
      const nestedBoundaryMatch = partContentType.match(/boundary="?([^";\s]+)"?/);
      if (nestedBoundaryMatch) {
        const nestedParts = findBoundaries(partContent, nestedBoundaryMatch[1]);
        for (const nested of nestedParts) {
          const nestedContent = partContent.slice(nested.start, nested.end);
          const nestedHeaders = parseHeaders(nestedContent);
          const nestedContentType = (nestedHeaders['content-type'] ?? 'text/plain').toLowerCase();
          const nestedEncoding = nestedHeaders['content-transfer-encoding'];
          const nestedBody = getBodyBlock(nestedHeaders, nestedContent);
          const decoded = decodeContent(nestedBody, nestedEncoding);

          if (nestedContentType.includes('text/html') && !html) html = decoded;
          else if (nestedContentType.includes('text/plain') && !text) text = decoded;
        }
      }
      continue;
    }

    const body = getBodyBlock(partHeaders, partContent);
    const decoded = decodeContent(body, partEncoding);

    if (partContentType.includes('text/html') && !html) html = decoded;
    else if (partContentType.includes('text/plain') && !text) text = decoded;
  }

  return { html, text };
}
