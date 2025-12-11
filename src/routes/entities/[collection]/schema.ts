import { z } from "zod";

export const newFormSchema = z.object({}).passthrough();
export type NewFormSchema = z.infer<typeof newFormSchema>;

export const editFormSchema = z.object({}).passthrough();
export type EditFormSchema = z.infer<typeof editFormSchema>;
