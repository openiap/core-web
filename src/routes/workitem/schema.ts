import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2).default("test-"),
  wiqid: z.string().min(2),
  payload: z.any(),
  priority: z.number().int().default(2),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  wiqid: z.string().min(2),
  payload: z.any(),
  retries: z.number().int(),
  priority: z.number().int(),
  files: z.any(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
