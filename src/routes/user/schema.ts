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
  email: z.string().optional().nullable().transform((val) => val ?? ""),
  newpassword: z.string().optional().transform((val) => val ?? ""),
  disabled: z.boolean().optional().nullable().transform((val) => val ?? false),
  dblocked: z.boolean().optional().nullable().transform((val) => val ?? false),
  validated: z.boolean().optional().nullable().transform((val) => val ?? false),
  emailvalidated: z.boolean().optional().nullable().transform((val) => val ?? false),
  formvalidated: z.boolean().optional().nullable().transform((val) => val ?? false),
  federationids: z.any().optional().nullable().transform((val) => val ?? []),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
