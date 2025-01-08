import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2).default("Test "),
  language: z.string().min(2).default("nodejs"),
  daemon: z.boolean(),
  chromium: z.boolean(),
  fileid: z.string().min(2),
  _type: z.string().default("package"),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  language: z.string().min(2).default("nodejs"),
  daemon: z.boolean(),
  chromium: z.boolean(),
  fileid: z.string().min(2),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
