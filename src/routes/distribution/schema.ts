import { z } from 'zod';

export const newFormSchema = z.object({
  workspaceid: z.string(),
  name: z.string().min(1, "Name is required"),
  _type: z.string().default("package"),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  min_instances: z.number().optional().nullable().transform((val) => val ?? 0),
  max_instances: z.number().optional().nullable().transform((val) => val ?? 0),
  always_parse_http: z.boolean().optional().nullable().transform((val) => val ?? true),
  volume: z.string().optional().nullable().transform((val) => val ?? ""),
  distros: z.string().optional().nullable().transform((val) => val ?? ""),
  repo: z.string().optional().nullable().transform((val) => val ?? ""),
  name: z.string().optional().nullable().transform((val) => val ?? ""),

}).passthrough();
export type EditFormSchema = typeof editFormSchema;
