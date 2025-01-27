import { z } from 'zod';

export const newCustomerSchema = z.object({
  name: z.string().min(2).default("Contoso Corporation"),
  _type: z.string().default("customer"),
});
export type NewCustomerSchema = typeof newCustomerSchema;

export const customerSchema = z.object({
  name: z.string().min(2),
}).passthrough();
export type CustomerSchema = typeof customerSchema;
