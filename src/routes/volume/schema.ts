import { z } from 'zod';

export const newFormSchema = z.object({
    name: z.string().min(2).default(''),
    size_mb: z.number().min(1).max(50).default(10),
    provider: z.string().min(2).default('image'),
    _workspaceid: z.string(),
    _type: z.string().min(2).default('volume'),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
    path: z.string().optional().nullable().transform((val) => val ?? ""),
    access_key: z.string().optional().nullable().transform((val) => val ?? ""),
    secret_key: z.string().optional().nullable().transform((val) => val ?? ""),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
