import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(1).default(""),
  username: z.string().min(1).default(""),
  password: z.string().default(""),
  _type: z.string().default("credential"),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(2),
  password: z.string().optional(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
