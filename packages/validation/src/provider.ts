import { z } from 'zod';

/** Resend-specific config fields */
const resendConfigSchema = z.object({
  apiKey: z.string().min(1),
  webhookSecret: z.string().min(1).optional(),
});

/** SES-specific config fields */
const sesConfigSchema = z.object({
  region: z.string().min(1),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  configurationSetName: z.string().nullable().optional(),
  defaultMailFromDomain: z.string().nullable().optional(),
});

/** Pietru SMTP — no user credentials needed, uses system SES */
const pietruConfigSchema = z.object({}).optional().default({});

/** Mailgun-specific config fields */
const mailgunConfigSchema = z.object({
  apiKey: z.string().min(1),
  domain: z.string().min(1),
  webhookSecret: z.string().min(1).optional(),
});

export const createProviderConfigSchema = z.object({
  providerType: z.string().min(1),
  config: z.union([resendConfigSchema, sesConfigSchema, pietruConfigSchema, mailgunConfigSchema]),
  mode: z.enum(['send', 'capture', 'send_and_capture']),
  environment: z.enum(['development', 'preview', 'production']),
  defaultFrom: z.string().optional(),
  allowedDomains: z.array(z.string()).optional(),
});
