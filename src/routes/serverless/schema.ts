import { z } from 'zod';

export const newFormSchema = z.object({
  _workspaceid: z.string(),
  name: z.string().min(1, "Name is required"),
  _type: z.string().default("app"),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchemaUser = z.object({
  min_instances: z.number().min(0).max(2).default(0),
  max_instances: z.number().min(0).max(3).default(1),
  volumes: z.any(),
  distro: z.string().optional().nullable().transform((val) => val ?? ""),
  repo: z.string().optional().nullable().transform((val) => val ?? ""),
  name: z.string().optional().nullable().transform((val) => val ?? ""),
  port: z.number().optional().nullable().transform((val) => val ?? 0),
  env: z.any(),
  minimum_response_time: z.number().min(0).default(0),
  idle_timeout: z.number().min(0).default(0),
  runas: z.string().optional().nullable().transform((val) => val ?? ""),
  tag: z.string().optional().nullable().transform((val) => val ?? ""),
  packageid: z.string().optional().nullable().transform((val) => val ?? ""),
  anonymous: z.boolean().default(false),
  tls: z.boolean().optional().nullable().transform((val) => val ?? false),
  alpn: z.string().optional().nullable().transform((val) => val ?? "Select ALPN"),
}).passthrough();

export type EditFormSchemaUser = typeof editFormSchemaUser;

export const editFormSchemaAdmin = z.object({
  min_instances: z.number().default(0),
  max_instances: z.number().default(1),
  volumes: z.any(),
  distro: z.string().optional().nullable().transform((val) => val ?? ""),
  repo: z.string().optional().nullable().transform((val) => val ?? ""),
  name: z.string().optional().nullable().transform((val) => val ?? ""),
  port: z.number().optional().nullable().transform((val) => val ?? 0),
  env: z.any(),
  minimum_response_time: z.number().min(0).default(0),
  idle_timeout: z.number().min(0).default(0),
  runas: z.string().optional().nullable().transform((val) => val ?? ""),
  tag: z.string().optional().nullable().transform((val) => val ?? ""),
  packageid: z.string().optional().nullable().transform((val) => val ?? ""),
  anonymous: z.boolean().default(false),
  tls: z.boolean().optional().nullable().transform((val) => val ?? false),
  alpn: z.string().optional().nullable().transform((val) => val ?? "Select ALPN"),
}).passthrough();

export type EditFormSchemaAdmin = typeof editFormSchemaAdmin;
