import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(2),
  email: z.string().optional().default(""),
  password: z.string().min(6),
  disabled: z.boolean(),
  dblocked: z.boolean(),
  validated: z.boolean(),
  emailvalidated: z.boolean(),
  formvalidated: z.boolean(),
  federationids: z.array(z.string().email()).optional().default([]),
  _type: z.string().default("user"),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(2),
  // email: z.string().optional().default(""),
  // password: z.string().optional(),
  // disabled: z.boolean(),
  dblocked: z.boolean(),
  validated: z.boolean(),
  emailvalidated: z.boolean(),
  formvalidated: z.boolean(),
  federationids: z.array(z.string().email()).optional().default([]),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
