import type { PietruThemeConfig, PietruTemplateId, PietruRenderResult } from '../types.js'
import * as newsletter from './newsletter.js'
import * as welcome from './welcome.js'
import * as verification from './verification.js'
import * as notification from './notification.js'
import * as minimal from './minimal.js'

export interface TemplateModule {
  render(content: Record<string, unknown>, theme: Required<PietruThemeConfig>, variables: Record<string, string>): PietruRenderResult
}

export const templates: Record<PietruTemplateId, TemplateModule> = {
  newsletter: newsletter as unknown as TemplateModule,
  welcome: welcome as unknown as TemplateModule,
  verification: verification as unknown as TemplateModule,
  notification: notification as unknown as TemplateModule,
  minimal: minimal as unknown as TemplateModule,
}

export function getTemplate(id: PietruTemplateId): TemplateModule {
  const tmpl = templates[id]
  if (!tmpl) {
    throw new Error(`Unknown template: ${id}`)
  }
  return tmpl
}
