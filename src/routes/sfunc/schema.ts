import { z } from 'zod';

export const newFormSchema = z.object({
  _workspaceid: z.string(),
  name: z.string().min(1, "Name is required"),
  _type: z.string().default("package"),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  min_instances: z.number().min(0).max(2).default(0),
  max_instances: z.number().min(1).max(3).default(1),
  always_parse_http: z.boolean().optional().nullable().transform((val) => val ?? true),
  volume: z.string().optional().nullable().transform((val) => val ?? ""),
  distro: z.string().optional().nullable().transform((val) => val ?? ""),
  repo: z.string().optional().nullable().transform((val) => val ?? ""),
  name: z.string().optional().nullable().transform((val) => val ?? ""),
  minimum_response_time: z.number().min(0).default(0),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
