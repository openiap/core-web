import { z } from 'zod';

export const newFormSchema = z.object({
  collectionname: z.string().min(2),
  expireafterseconds: z.number().int(),
  timefield: z.string().default("").optional(),
  granularity: z.string().default("").optional(),
  metadata: z.string().default("").optional(),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  collectionname: z.string().min(2),
  expireafterseconds: z.number().int(),
  timefield: z.string().default("").optional(),
  granularity: z.string().default("").optional(),
  metadata: z.string().default("").optional(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;