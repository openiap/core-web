import { z } from 'zod';
export const editFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
}).passthrough();
export type UserSchema = typeof editFormSchema;

export const newFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});
export type NewUserSchema = typeof newFormSchema;

export let page = "role";