import { z } from 'zod';

export const editFormSchema = z.object({
  name: z.string().min(2),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
