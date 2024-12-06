import { z } from 'zod';
export const userSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(2),
  email: z.string().email()
});
export type UserSchema = typeof userSchema;


export const newUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});
export type NewUserSchema = typeof newUserSchema;

