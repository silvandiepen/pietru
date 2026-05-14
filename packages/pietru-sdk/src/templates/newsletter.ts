import type { PietruThemeConfig, PietruRenderResult } from '../types.js'

export interface NewsletterContent {
  preheader?: string
  heroTitle?: string
  heroImageUrl?: string
  body: string
  cta?: { text: string; url: string }
  secondaryBody?: string
}

export function render(
  content: NewsletterContent,
  theme: Required<PietruThemeConfig>,
  variables: Record<string, string>,
): PietruRenderResult {
  const preheaderHtml = content.preheader
    ? `<div style="display:none;font-size:1px;color:${theme.backgroundColor};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(applyVariables(content.preheader, variables))}</div>`
    : ''

  const logoHtml = theme.logoUrl
    ? `<tr><td style="padding:24px 0;text-align:center"><img src="${escapeAttr(theme.logoUrl)}" alt="${escapeAttr(theme.logoAlt)}" width="${parseInt(theme.logoWidth) || 200}" style="max-width:${theme.logoWidth};height:auto;border:0;display:inline-block" /></td></tr>`
    : ''

  const heroHtml = content.heroImageUrl
    ? `<tr><td style="padding:0 0 20px 0;text-align:center"><img src="${escapeAttr(content.heroImageUrl)}" alt="${escapeAttr(content.heroTitle || '')}" style="width:100%;max-width:600px;height:auto;display:block;border-radius:4px" /></td></tr>`
    : ''

  const heroTitleHtml = content.heroTitle
    ? `<tr><td style="padding:0 0 16px 0"><h1 style="margin:0;font-family:${theme.headingFont};font-size:28px;line-height:36px;color:${theme.primaryColor};text-align:center">${escapeHtml(applyVariables(content.heroTitle, variables))}</h1></td></tr>`
    : ''

  const bodyHtml = `<tr><td style="padding:0 0 16px 0;font-family:${theme.fontFamily};font-size:16px;line-height:24px;color:${theme.textColor}">${applyVariables(content.body, variables)}</td></tr>`

  const ctaHtml = content.cta
    ? `<tr><td style="padding:12px 0 24px 0;text-align:center"><a href="${escapeAttr(applyVariables(content.cta.url, variables))}" style="display:inline-block;padding:14px 32px;background-color:${theme.primaryColor};color:#ffffff;font-family:${theme.fontFamily};font-size:16px;font-weight:600;text-decoration:none;border-radius:6px">${escapeHtml(applyVariables(content.cta.text, variables))}</a></td></tr>`
    : ''

  const secondaryBodyHtml = content.secondaryBody
    ? `<tr><td style="padding:16px 0 0 0;font-family:${theme.fontFamily};font-size:14px;line-height:22px;color:${theme.textColor}">${applyVariables(content.secondaryBody, variables)}</td></tr>`
    : ''

  const textContent = buildTextContent(content, theme, variables)

  const html = wrapInShell(preheaderHtml, logoHtml, heroTitleHtml, heroHtml, bodyHtml, ctaHtml, secondaryBodyHtml, theme)
  return { html, text: textContent }
}

function buildTextContent(
  content: NewsletterContent,
  theme: Required<PietruThemeConfig>,
  variables: Record<string, string>,
): string {
  const parts: string[] = []
  if (content.preheader) parts.push(applyVariables(content.preheader, variables))
  if (content.heroTitle) parts.push(applyVariables(content.heroTitle, variables))
  parts.push(stripHtml(applyVariables(content.body, variables)))
  if (content.cta) parts.push(`${applyVariables(content.cta.text, variables)}: ${applyVariables(content.cta.url, variables)}`)
  if (content.secondaryBody) parts.push(stripHtml(applyVariables(content.secondaryBody, variables)))
  parts.push(buildFooterText(theme))
  return parts.join('\n\n')
}

function wrapInShell(
  preheader: string,
  logo: string,
  heroTitle: string,
  hero: string,
  body: string,
  cta: string,
  secondaryBody: string,
  theme: Required<PietruThemeConfig>,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title></title></head>
<body style="margin:0;padding:0;background-color:${theme.backgroundColor};font-family:${theme.fontFamily}">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${theme.backgroundColor}">
<tr><td align="center" style="padding:0">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin:0 auto">
${logo}
${heroTitle}
${hero}
${body}
${cta}
${secondaryBody}
</table>
</td></tr>
</table>
${buildFooterHtml(theme)}
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function applyVariables(s: string, variables: Record<string, string>): string {
  return s.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '')
}

function buildFooterHtml(theme: Required<PietruThemeConfig>): string {
  const socialHtml = Object.entries(theme.socialLinks).map(
    ([name, url]) => `<a href="${escapeAttr(url)}" style="color:${theme.linkColor};text-decoration:none;margin:0 8px">${escapeHtml(name)}</a>`,
  ).join('')
  const addressParts = [theme.addressLine1, theme.addressLine2, theme.city, theme.country].filter(Boolean)
  const addressHtml = addressParts.length > 0
    ? `<tr><td style="padding:4px 0;font-size:12px;line-height:18px;color:${theme.textColor}">${escapeHtml(addressParts.join(', '))}</td></tr>`
    : ''

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${theme.footerBgColor}">
<tr><td align="center" style="padding:24px 0">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin:0 auto">
${theme.companyName ? `<tr><td style="padding:0 0 8px 0;font-family:${theme.fontFamily};font-size:14px;font-weight:600;color:${theme.textColor};text-align:center">${escapeHtml(theme.companyName)}</td></tr>` : ''}
${theme.footerText ? `<tr><td style="padding:0 0 8px 0;font-size:12px;line-height:18px;color:${theme.textColor};text-align:center">${escapeHtml(theme.footerText)}</td></tr>` : ''}
${socialHtml ? `<tr><td style="padding:8px 0;text-align:center;font-size:12px">${socialHtml}</td></tr>` : ''}
${addressHtml}
<tr><td style="padding:12px 0 0 0;text-align:center"><a href="{{unsubUrl}}" style="color:${theme.linkColor};font-size:12px;text-decoration:underline">Unsubscribe</a></td></tr>
</table>
</td></tr>
</table>`
}

function buildFooterText(theme: Required<PietruThemeConfig>): string {
  const parts: string[] = []
  if (theme.companyName) parts.push(theme.companyName)
  const addressParts = [theme.addressLine1, theme.addressLine2, theme.city, theme.country].filter(Boolean)
  if (addressParts.length > 0) parts.push(addressParts.join(', '))
  if (theme.footerText) parts.push(theme.footerText)
  parts.push('Unsubscribe: {{unsubUrl}}')
  return parts.join('\n')
}
