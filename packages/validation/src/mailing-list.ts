import { z } from 'zod';

export const createMailingListSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(80).optional(),
  description: z.string().max(500).optional(),
  meta: z.record(z.unknown()).optional(),
  confirmationEmailFrom: z.string().email().optional(),
  confirmationEmailSubject: z.string().max(200).optional(),
  confirmationSuccessUrl: z.string().url().optional(),
});

export const updateMailingListSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  meta: z.record(z.unknown()).optional(),
  confirmationEmailFrom: z.string().email().optional(),
  confirmationEmailSubject: z.string().max(200).optional(),
  confirmationSuccessUrl: z.string().url().optional(),
});

export const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().max(120).optional(),
  meta: z.record(z.unknown()).optional(),
});
