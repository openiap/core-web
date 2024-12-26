import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  billingid: z.string().optional()
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  admins: z.string().min(2),
  users: z.string().min(2),
  billingid: z.string().optional(),
  price: z.string().optional(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
