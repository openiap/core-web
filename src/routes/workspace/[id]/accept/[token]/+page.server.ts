import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import { redirect } from "@sveltejs/kit";
import { setMessage, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { memberSchema } from "../../../schema.js";
import type { PageServerLoad } from "./$types.js";

const key = "workspace"

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
  let workspaceid = params.id;
  let token = params.token;
  try {
    let item = JSON.parse(await auth.client.CustomCommand({ command: "getinvite", data: JSON.stringify({ workspaceid, token }), jwt: auth.access_token }))
    if(item == null) {
      throw redirect (303, base + `/${key}`);
    }
    return { 
      form: await superValidate(item, zod(memberSchema)),
     };
  } catch (error:any) {
    let form = await superValidate({ workspaceid, token }, zod(memberSchema));
    setMessage(form, error.message, { status: 403});
    return { form };
  }
};
