import { z } from 'zod';

export const editFormSchema = z.object({
}).passthrough();
export type EditFormSchema = z.infer<typeof editFormSchema>;
