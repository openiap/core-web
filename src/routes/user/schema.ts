import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  username: z.string().min(2),
  password: z.string().min(6),
  disabled: z.boolean(),
  dblocked: z.boolean(),
  validated: z.boolean(),
  emailvalidated: z.boolean(),
  formvalidated: z.boolean(),
  federationids: z.array(z.string().email()).optional(),
  _type: z.string().default("user"),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  username: z.string().min(2),
  password: z.string().min(6).optional(),
  disabled: z.boolean(),
  dblocked: z.boolean(),
  validated: z.boolean(),
  emailvalidated: z.boolean(),
  formvalidated: z.boolean(),
  federationids: z.array(z.string().email()).optional(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
