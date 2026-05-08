function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveValue(data: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = data;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function renderTemplate(template: string, data: Record<string, unknown>): string {
  // Triple mustache (no escaping): {{{variable}}}
  let result = template.replace(/\{\{\{(\s*[\w.]+?\s*)\}\}\}/g, (_match, key: string) => {
    const trimmedKey = key.trim();
    const value = resolveValue(data, trimmedKey);
    if (value === undefined) return `{{{${trimmedKey}}}}`;
    return String(value);
  });

  // Double mustache (HTML escaped): {{variable}}
  result = result.replace(/\{\{(\s*[\w.]+?\s*)\}\}/g, (_match, key: string) => {
    const trimmedKey = key.trim();
    const value = resolveValue(data, trimmedKey);
    if (value === undefined) return `{{${trimmedKey}}}`;
    return escapeHtml(value);
  });

  return result;
}
