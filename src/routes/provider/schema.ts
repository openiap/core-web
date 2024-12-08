import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});
export type EditFormSchema = typeof editFormSchema;
