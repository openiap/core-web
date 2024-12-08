import { z } from 'zod';
export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
}).passthrough();
export type UserSchema = typeof userSchema;

export const newUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});
export type NewUserSchema = typeof newUserSchema;

