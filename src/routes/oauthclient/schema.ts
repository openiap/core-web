import { z } from 'zod';
export const newFormSchema = z.object({
  _type: z.string().default("oauthclient"),
  _encrypt: z.string().default("clientSecret"),

  name: z.string().min(2),
  clientId: z.string().min(2).default("application"),
  clientSecret: z.string().default("secret"),
  grants: z.any().default(["password", "refresh_token", "authorization_code"]),
  redirectUris: z.any().default([]),
  defaultrole: z.string().default("Viewer"),
  rolemappings: z.any().default({ "admins": "Admin", "grafana editors": "Editor", "grafana admins": "Admin" }),

  openflowsignout: z.boolean().optional().nullable().transform((val) => val ?? false),
  signin_url: z.string().optional().nullable().transform((val) => val ?? ""),

  token_endpoint_auth_method: z.any().default("client_secret_post"),
  response_types: z.any().default(["code", "id_token", "code id_token"]),

  grant_types: z.any().default(["implicit", "authorization_code"]),

  post_logout_redirect_uris: z.any().default([]),
});
export type NewFormSchema = typeof newFormSchema;

export const editFormSchema = z.object({
  name: z.string().min(2),
  clientId: z.string().min(2),
  clientSecret: z.string().optional().nullable().transform((val) => val ?? ""),
  grants: z.any(),
  redirectUris: z.any(),
  defaultrole: z.string(),

  rolemappings: z.any(),

  openflowsignout: z.boolean().optional().nullable().transform((val) => val ?? false),
  signin_url: z.string().optional().nullable().transform((val) => val ?? ""),

  token_endpoint_auth_method: z.any(),
  response_types: z.any(),
  post_logout_redirect_uris: z.any(),
}).passthrough();
export type EditFormSchema = typeof editFormSchema;


