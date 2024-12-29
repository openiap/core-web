import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import { memberSchema } from "../../../schema.js";

const key = "workspace"

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
  let workspaceid = params.id;
  let token = params.token;
  let item = JSON.parse(await auth.client.CustomCommand({ command: "getinvite", data: JSON.stringify({ workspaceid, token }), jwt: auth.access_token }))
  if(item == null) {
    throw redirect (303, base + `/${key}`);
  }
  return { 
    form: await superValidate(item, zod(memberSchema)),
   };
};
