import { z } from 'zod';

export const newFormSchema = z.object({
    name: z.string().default(""),
    id: z.string().optional().default(""),
    forceddomains: z.any().optional().default(""),
    saml_signout_url: z.string().optional().default(""),
    issuer: z.string().optional().default(""),
    provider: z.string().default("saml"),
    saml_federation_metadata: z.string().optional().default(""),
    introspection_endpoint: z.string().optional().default(""),
    introspection_client_id: z.string().optional().default(""),
    introspection_client_secret: z.string().optional().default(""),
    consumerKey: z.string().optional().default(""),
    consumerSecret: z.string().optional().default(""),
    order: z.number().optional().default(0),
    _type: z.string().optional().default("provider"),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
    // name: z.string().optional().transform((val) => val ?? "test"),
    // id: z.string().optional().transform((val) => val ?? ""),

    // saml_federation_metadata: z.string().optional().transform((val) => val ?? ""),
    // issuer: z.string().optional().transform((val) => val ?? ""),
    // // saml_signout_url: z.string().optional().nullable().transform((val) => val ?? ""),

    // consumerKey: z.string().optional().transform((val) => val ?? ""),
    // consumerSecret: z.string().optional().transform((val) => val ?? ""),
    // introspection: z.string().optional().transform((val) => val ?? ""),

    forceddomains: z.any().optional(),

    // order: z.number().optional().transform((val) => val ?? 0),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;
