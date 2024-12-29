import { z } from 'zod';

export const editFormSchema = z.object({
  name: z.string().min(2),
  readcount: z.boolean(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
