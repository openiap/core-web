import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2).default("nabeel"),

  projectid: z.string().nullable(),

  maxretries: z.number().int().default(3),
  retrydelay: z.number().int().default(0),
  initialdelay: z.number().int().default(0),

  workflowid: z.string().nullable(),
  robotqueue: z.string().nullable(),
  amqpqueue: z.string().nullable(),
  packageid: z.string().nullable(),

  success_wiqid: z.string().default(""),
  failed_wiqid: z.string().default(""),

  success_wiq: z.string().default(""),
  failed_wiq: z.string().default(""),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),

  projectid: z.string().nullable(),

  maxretries: z.number().int(),
  retrydelay: z.number().int(),
  initialdelay: z.number().int(),

  workflowid: z.string().nullable(),
  robotqueue: z.string().nullable(),
  amqpqueue: z.string().min(2),
  packageid: z.string().nullable(),

  success_wiqid: z.string().nullable(),
  failed_wiqid: z.string().nullable(),

  success_wiq: z.string().nullable(),
  failed_wiq: z.string().nullable(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
