import { z } from 'zod';

export const newFormSchema = z.object({
 
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
 
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
