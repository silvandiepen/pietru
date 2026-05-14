import type { PietruThemeConfig, PietruRenderResult } from '../types.js'

export interface MinimalContent {
  body: string
}

export function render(
  content: MinimalContent,
  theme: Required<PietruThemeConfig>,
  variables: Record<string, string>,
): PietruRenderResult {
  const logoHtml = theme.logoUrl
    ? `<tr><td style="padding:24px 0;text-align:center"><img src="${esc(theme.logoUrl)}" alt="${esc(theme.logoAlt)}" width="${parseInt(theme.logoWidth) || 200}" style="max-width:${theme.logoWidth};height:auto;border:0;display:inline-block" /></td></tr>`
    : ''

  const bodyHtml = `<tr><td style="padding:0 0 16px 0;font-family:${theme.fontFamily};font-size:16px;line-height:24px;color:${theme.textColor}">${v(content.body, variables)}</td></tr>`

  const html = shell(logoHtml, bodyHtml, theme)
  const text = buildText(content, theme, variables)
  return { html, text }
}

function buildText(
  content: MinimalContent,
  theme: Required<PietruThemeConfig>,
  variables: Record<string, string>,
): string {
  const parts: string[] = []
  parts.push(stripHtml(v(content.body, variables)))
  parts.push(footerText(theme))
  return parts.join('\n\n')
}

function shell(
  logo: string,
  body: string,
  theme: Required<PietruThemeConfig>,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title></title></head>
<body style="margin:0;padding:0;background-color:${theme.backgroundColor};font-family:${theme.fontFamily}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${theme.backgroundColor}">
<tr><td align="center" style="padding:0">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin:0 auto">
${logo}
${body}
</table>
</td></tr>
</table>
${footerHtml(theme)}
</body>
</html>`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function v(s: string, variables: Record<string, string>): string {
  return s.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '')
}

function footerHtml(theme: Required<PietruThemeConfig>): string {
  const socialHtml = Object.entries(theme.socialLinks).map(
    ([name, url]) => `<a href="${esc(url)}" style="color:${theme.linkColor};text-decoration:none;margin:0 8px">${esc(name)}</a>`,
  ).join('')
  const addr = [theme.addressLine1, theme.addressLine2, theme.city, theme.country].filter(Boolean).join(', ')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${theme.footerBgColor}">
<tr><td align="center" style="padding:24px 0">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin:0 auto">
${theme.companyName ? `<tr><td style="padding:0 0 8px 0;font-family:${theme.fontFamily};font-size:14px;font-weight:600;color:${theme.textColor};text-align:center">${esc(theme.companyName)}</td></tr>` : ''}
${theme.footerText ? `<tr><td style="padding:0 0 8px 0;font-size:12px;line-height:18px;color:${theme.textColor};text-align:center">${esc(theme.footerText)}</td></tr>` : ''}
${socialHtml ? `<tr><td style="padding:8px 0;text-align:center;font-size:12px">${socialHtml}</td></tr>` : ''}
${addr ? `<tr><td style="padding:4px 0;font-size:12px;line-height:18px;color:${theme.textColor};text-align:center">${esc(addr)}</td></tr>` : ''}
<tr><td style="padding:12px 0 0 0;text-align:center"><a href="{{unsubUrl}}" style="color:${theme.linkColor};font-size:12px;text-decoration:underline">Unsubscribe</a></td></tr>
</table>
</td></tr>
</table>`
}

function footerText(theme: Required<PietruThemeConfig>): string {
  const parts: string[] = []
  if (theme.companyName) parts.push(theme.companyName)
  const addr = [theme.addressLine1, theme.addressLine2, theme.city, theme.country].filter(Boolean).join(', ')
  if (addr) parts.push(addr)
  if (theme.footerText) parts.push(theme.footerText)
  parts.push('Unsubscribe: {{unsubUrl}}')
  return parts.join('\n')
}
