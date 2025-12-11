import { z } from 'zod';

export const newCustomerSchema = z.object({
  name: z.string().min(2).default(""),
  _type: z.string().default("customer"),
});
export type NewCustomerSchema = z.infer<typeof newCustomerSchema>;

export const customerSchema = z.object({
  name: z.string().min(2),
}).passthrough();
export type CustomerSchema = z.infer<typeof customerSchema>;
