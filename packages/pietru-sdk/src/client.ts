import type {
  PietruClientConfig,
  PietruSendEmailOptions,
  PietruSendEmailResponse,
  PietruPredefinedTemplate,
  PietruCustomTemplate,
} from './types.js'
import { renderTemplate } from './render.js'

const DEFAULT_BASE_URL = 'https://api.pietru.dev'

function isPredefinedTemplate(template: PietruSendEmailOptions['template']): template is PietruPredefinedTemplate {
  return 'id' in template && 'content' in template
}

function isCustomTemplate(template: PietruSendEmailOptions['template']): template is PietruCustomTemplate {
  return 'html' in template
}

export class PietruClient {
  private readonly apiKey: string
  private readonly projectId: string
  private readonly baseUrl: string

  constructor(config: PietruClientConfig) {
    this.apiKey = config.apiKey
    this.projectId = config.projectId ?? ''
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL
  }

  async sendEmail(options: PietruSendEmailOptions): Promise<PietruSendEmailResponse> {
    let html: string
    let text: string | undefined

    if (isPredefinedTemplate(options.template)) {
      const variables = options.variables ?? {}
      const theme = options.theme ?? {}
      const result = renderTemplate(options.template.id, options.template.content, theme, variables)
      html = result.html
      text = result.text
    } else if (isCustomTemplate(options.template)) {
      html = options.template.html
      text = options.template.text
    } else {
      throw new Error('Invalid template: must be a predefined or custom template')
    }

    const url = `${this.baseUrl}/v1/projects/${this.projectId}/messages`

    const payload: Record<string, unknown> = {
      to: options.to,
      from: options.from,
      html,
      theme: options.theme ?? {},
    }

    if (text) {
      payload.text = text
    }
    if (options.replyTo) {
      payload.replyTo = options.replyTo
    }
    if (options.tags) {
      payload.tags = options.tags
    }
    if (options.metadata) {
      payload.metadata = options.metadata
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Pietru API error (${response.status}): ${body}`)
    }

    const data = await response.json() as PietruSendEmailResponse
    return data
  }
}
