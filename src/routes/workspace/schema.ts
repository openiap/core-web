import { z } from 'zod';

export class Workspace {
  _id: string;
  name: string;
  billingid: string;
  admins: string;
  users: string;
  price: string;
  constructor() {
    this._id = "";
    this.name = "";
    this.billingid = "";
    this.admins = "";
    this.users = "";
    this.price = "";
  }
}
export const newWorkspaceSchema = z.object({
  name: z.string().min(2).default("Lemonify"),
  billingid: z.string().optional()
});
export type NewWorkspaceSchema = typeof newWorkspaceSchema;

export const workspaceSchema = z.object({
  name: z.string().min(2),
  admins: z.string().min(2),
  users: z.string().min(2),
  billingid: z.string().optional(),
  price: z.string().optional(),
}).passthrough();
export type WorkspaceSchema = typeof workspaceSchema;

export const newMemberSchema = z.object({
  email: z.string().min(2).default("hello@world.com"),
  role: z.enum(["member", "admin"]).default("member"),
  workspaceid: z.string().optional(),
});
export type NewMemberSchema = typeof newWorkspaceSchema;

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
export type MemberSchema = typeof newWorkspaceSchema;
