import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import { setMessage, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { memberSchema } from "../../../schema.js";
import type { PageLoad } from "./$types.js";

const key = "workspace"

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  let workspaceid = params.id;
  let token = params.token;
  try {
    let item = JSON.parse(await auth.client.CustomCommand({ command: "getinvite", data: JSON.stringify({ workspaceid, token }), jwt: access_token }))
    if (item == null) { return goto(base + `/${key}`); }
    return {
      form: await superValidate(item, zod(memberSchema)),
    };
  } catch (error: any) {
    let form = await superValidate({ workspaceid, token }, zod(memberSchema));
    setMessage(form, error.message, { status: 403 });
    return { form };
  }
};
