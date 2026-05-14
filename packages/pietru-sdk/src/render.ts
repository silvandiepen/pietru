import type { PietruThemeConfig, PietruTemplateId, PietruRenderResult } from './types.js'
import { defaultTheme } from './theme.js'
import { getTemplate } from './templates/index.js'

export function renderTemplate(
  templateId: PietruTemplateId,
  content: Record<string, unknown>,
  theme: PietruThemeConfig,
  variables: Record<string, string>,
): PietruRenderResult {
  const mergedTheme: Required<PietruThemeConfig> = {
    logoUrl: theme.logoUrl ?? defaultTheme.logoUrl,
    logoWidth: theme.logoWidth ?? defaultTheme.logoWidth,
    logoAlt: theme.logoAlt ?? defaultTheme.logoAlt,
    primaryColor: theme.primaryColor ?? defaultTheme.primaryColor,
    secondaryColor: theme.secondaryColor ?? defaultTheme.secondaryColor,
    backgroundColor: theme.backgroundColor ?? defaultTheme.backgroundColor,
    textColor: theme.textColor ?? defaultTheme.textColor,
    footerBgColor: theme.footerBgColor ?? defaultTheme.footerBgColor,
    linkColor: theme.linkColor ?? theme.primaryColor ?? defaultTheme.linkColor,
    fontFamily: theme.fontFamily ?? defaultTheme.fontFamily,
    headingFont: theme.headingFont ?? theme.fontFamily ?? defaultTheme.headingFont,
    companyName: theme.companyName ?? defaultTheme.companyName,
    footerText: theme.footerText ?? defaultTheme.footerText,
    socialLinks: theme.socialLinks ?? { ...defaultTheme.socialLinks },
    addressLine1: theme.addressLine1 ?? defaultTheme.addressLine1,
    addressLine2: theme.addressLine2 ?? defaultTheme.addressLine2,
    city: theme.city ?? defaultTheme.city,
    country: theme.country ?? defaultTheme.country,
    unsubscribePageTitle: theme.unsubscribePageTitle ?? defaultTheme.unsubscribePageTitle,
    unsubscribePageMessage: theme.unsubscribePageMessage ?? defaultTheme.unsubscribePageMessage,
    unsubscribeButtonColor: theme.unsubscribeButtonColor ?? theme.primaryColor ?? defaultTheme.unsubscribeButtonColor,
  }

  const tmpl = getTemplate(templateId)
  const result = tmpl.render(content, mergedTheme, variables)

  // Replace {{variables}} in the final output
  const replaceVars = (s: string): string =>
    s.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)

  return {
    html: replaceVars(result.html),
    text: replaceVars(result.text),
  }
}
