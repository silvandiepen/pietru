import { z } from 'zod';

export const createProviderConfigSchema = z.object({
  providerType: z.string().min(1),
  config: z.object({
    apiKey: z.string().min(1),
    webhookSecret: z.string().min(1).optional(),
  }),
  mode: z.enum(['send', 'capture', 'send_and_capture']),
  environment: z.enum(['development', 'preview', 'production']),
  defaultFrom: z.string().optional(),
  allowedDomains: z.array(z.string()).optional(),
});
