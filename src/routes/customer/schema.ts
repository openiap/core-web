import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  domains: z.array(z.string().email()).optional(),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  domains: z.array(z.string().email()).optional(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
