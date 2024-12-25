import { z } from 'zod';
export const editFormSchema = z.object({
  name: z.string().min(2),
  rparole: z.boolean().optional(),
  hidemembers: z.boolean().optional(),
  members: z.array(z.object({
    name: z.string().min(2),
    _id: z.string().min(2),
  })),
}).passthrough();
export type UserSchema = typeof editFormSchema;

export const newFormSchema = z.object({
  name: z.string().min(2),
  rparole: z.boolean().optional(),
  hidemembers: z.boolean().optional(),
  members: z.array(z.object({
    name: z.string().min(2),
    _id: z.string().min(2),
  })).default([]),
});
export type NewUserSchema = typeof newFormSchema;

export let page = "role";