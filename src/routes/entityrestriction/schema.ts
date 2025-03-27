import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2),
  collection: z.string(),
  copyperm: z.boolean(),
  paths: z.any().optional().nullable().transform((val) => val ?? []),
  _type: z.string().default("restriction"),
  _acl: z.any().default([{
    _id: "5a17f157c4815318c8536c21",
    name: "users",
    rights: 65535
  }]),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  collection: z.string().optional().transform((val) => val ?? ""),
  copyperm: z.boolean().optional().nullable().transform((val) => val ?? false),
  paths: z.any().optional().nullable().transform((val) => val ?? []),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
