import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  language: z.string().min(2),
  upload: z.string().min(2),
  daemon: z.boolean(),
  chromium: z.boolean(),
  package_file: z.boolean(),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  language: z.string().min(2),
  upload: z.string().min(2),
  daemon: z.boolean(),
  chromium: z.boolean(),
  package_file: z.boolean(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
