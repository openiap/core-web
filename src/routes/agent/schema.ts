import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  image: z.string().min(2),
  environment: z.any(),
  autostart: z.boolean().default(false),
  webserver: z.boolean().default(false),
  sleep: z.boolean().default(false),
  timezone: z.string().default(""),
  runas: z.string().default(""),
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
  autostart: z.boolean().default(false),
  webserver: z.boolean().default(false),
  sleep: z.boolean().default(false),
  timezone: z.string().default(""),
  runas: z.string().default(""),
  languages: z.array(z.string()),
  port: z.number(),
  stripeprice: z.string().optional(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
