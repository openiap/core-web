import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  image: z.string().min(2),
  environment: z.any(),
  autostart: z.boolean(),
  webserver: z.boolean(),
  sleep: z.boolean(),
  timezone: z.string(),
  runas: z.string(),
  languages: z.array(z.string()),
  port: z.number(),
  stripeprice: z.string().optional(),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  image: z.string().min(2),
  environment: z.any(),
  autostart: z.boolean(),
  webserver: z.boolean(),
  sleep: z.boolean(),
  timezone: z.boolean(),
  runas: z.boolean(),
  languages: z.array(z.string()),
  port: z.number(),
  stripeprice: z.string().optional(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
