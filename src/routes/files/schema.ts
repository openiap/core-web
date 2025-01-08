import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  collection: z.string().min(2),
  aggregates: z.array(z.any()).default([]),
  _type: z.string().default('resource')
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  collection: z.string().min(2),
  aggregates: z.array(z.any()).default([]),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
