import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  image: z.string().min(2),
  plan: z.string().min(2),
  environment: z.array(z.any()).default([]),
  autostart: z.boolean(),
  webserver: z.boolean(),
  sleep: z.boolean(),
  timezone: z.string(),
  runas: z.string(),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  image: z.string().min(2),
  plan: z.string().min(2),
  environment: z.array(z.any()).default([]),
  autostart: z.boolean(),
  webserver: z.boolean(),
  sleep: z.boolean(),
  timezone: z.boolean(),
  runas: z.boolean(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
