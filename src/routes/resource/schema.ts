import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  forceddomains: z.array(z.string().email()).optional(),
  target: z.string().min(2),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  forceddomains: z.array(z.string().email()).optional(),
  target: z.string().min(2),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
