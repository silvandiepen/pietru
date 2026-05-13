import { z } from 'zod';

export const sendMessageSchema = z
  .object({
    to: z.union([z.string().email(), z.array(z.string().email())]),
    from: z.string().min(1),
    subject: z.string().min(1).optional(),
    html: z.string().optional(),
    text: z.string().optional(),
    tags: z.record(z.string(), z.string()).optional(),
    cc: z.array(z.string().email()).optional(),
    bcc: z.array(z.string().email()).optional(),
    replyTo: z.string().email().optional(),
    templateId: z.string().min(1).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((value, ctx) => {
    const hasTemplate = Boolean(value.templateId);
    const hasContent = Boolean(value.html || value.text);

    if (!hasTemplate && !hasContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either html, text, or templateId must be provided',
        path: ['html'],
      });
    }

    if (hasTemplate && value.data === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'data must be provided when templateId is used',
        path: ['data'],
      });
    }

    if (!hasTemplate && value.subject === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'subject must be provided when templateId is not used',
        path: ['subject'],
      });
    }
  });

export const replyMessageSchema = z
  .object({
    to: z.union([z.string().email(), z.array(z.string().email())]).optional(),
    subject: z.string().min(1).optional(),
    html: z.string().optional(),
    text: z.string().optional(),
    cc: z.array(z.string().email()).optional(),
    bcc: z.array(z.string().email()).optional(),
    replyTo: z.string().email().optional(),
  })
  .superRefine((value, ctx) => {
    const hasContent = Boolean(value.html || value.text);

    if (!hasContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either html or text must be provided',
        path: ['html'],
      });
    }
  });

export const mailingListSubscriptionSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(120).optional(),
  list: z.string().trim().min(1).max(80).default('pietru-updates'),
});
