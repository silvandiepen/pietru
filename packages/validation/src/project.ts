import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
});
