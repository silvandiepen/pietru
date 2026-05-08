import { z } from 'zod';

export const sendMessageSchema = z
  .object({
    to: z.string().email(),
    from: z.string().min(1),
    subject: z.string().min(1),
    html: z.string().optional(),
    text: z.string().optional(),
    tags: z.record(z.string(), z.string()).optional(),
    cc: z.array(z.string().email()).optional(),
    bcc: z.array(z.string().email()).optional(),
    replyTo: z.string().email().optional(),
  })
  .refine((value) => Boolean(value.html || value.text), {
    message: 'Either html or text must be provided',
    path: ['html'],
  });
