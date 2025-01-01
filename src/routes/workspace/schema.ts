import { z } from 'zod';

export const newFormSchema = z.object({
  name: z.string().min(2).default("Lemonify"),
  billingid: z.string().optional()
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  admins: z.string().min(2),
  users: z.string().min(2),
  billingid: z.string().optional(),
  price: z.string().optional(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;

export const newMemberSchema = z.object({
  email: z.string().min(2),
  workspaceid: z.string().min(2),
  userid: z.string().optional(),
  token: z.string().optional(),
  status: z.enum(["pending", "accepted", "rejected"]),
  role: z.enum(["member", "admin"]),
});
export type NewMemberSchema = typeof newFormSchema;

export const memberSchema = z.object({
  email: z.string().min(2),
  workspaceid: z.string().min(2),
  workspacename: z.string().min(2),
  userid: z.string().optional(),
  token: z.string().min(2),
  status: z.enum(["pending", "accepted", "rejected"]),
  role: z.enum(["member", "admin"]),
  invitedby: z.string().min(2),
  invitedbyname: z.string().min(2),
  invitedon: z.string().min(2),
  seen: z.boolean().optional(),
  seenon: z.string().optional(),
});
export type MemberSchema = typeof newFormSchema;
