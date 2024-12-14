import { z } from 'zod';

export const editFormSchema = z.object({
  // name: z.string().min(2),
  // email: z.string().email().optional(),
  // username: z.string().min(2),
  // password: z.string().min(6).optional(),
  // disabled: z.boolean(),
  // dblocked: z.boolean(),
  // validated: z.boolean(),
  // emailvalidated: z.boolean(),
  // formvalidated: z.boolean(),
  // federationids: z.array(z.string().email()).optional(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
