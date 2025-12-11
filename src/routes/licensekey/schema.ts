import { z } from 'zod';

export const newLicenseSchema = z.object({
  name: z.string().min(2).default(""),
  _billingid: z.string().optional()
});
export type NewLicenseSchema = z.infer<typeof newLicenseSchema>;

export const LicenseSchema = z.object({
  name: z.string().min(2),
  _billingid: z.string().optional(),
  _resourceusageid: z.string().optional(),
  _productname: z.string().optional(),
  connections: z.number().optional(),
  workspaces: z.number().optional(),
  gitrepos: z.number().optional(),
  licenseversion: z.number().optional(),
  _stripeprice: z.string().optional(),
}).passthrough();
export type LicenseFormSchema = z.infer<typeof LicenseSchema>;
