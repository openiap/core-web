import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import { setMessage, superValidate } from "sveltekit-superforms";
import { zod4 as zod } from "sveltekit-superforms/adapters";
import type { ValidationAdapter } from "sveltekit-superforms/adapters";
import { memberSchema } from "../../../schema.js";
import type { MemberSchema } from "../../../schema.js";
import type { PageLoad } from "./$types.js";

const key = "workspace"

const memberSchemaAdapter = zod(memberSchema) as ValidationAdapter<MemberSchema, MemberSchema>;

export const load = (async ({ parent, params }) => {
  const { access_token } = await parent();
  let workspaceid = params.id;
  let token = params.token;
  let form = await superValidate<MemberSchema>({ workspaceid, token }, memberSchemaAdapter);
  if (workspaceid == null || workspaceid == "") { goto(base + `/${key}`); return { form }; }
  if (token == null || token == "") { goto(base + `/${key}`); return { form }; }
  try {
    let item = JSON.parse(await auth.client.CustomCommand({ command: "getinvite", data: JSON.stringify({ workspaceid, token }), jwt: access_token }))
    if (item == null) { goto(base + `/${key}`); return { form }; }
    return {
      form: await superValidate<MemberSchema>(item, memberSchemaAdapter),
    };
  } catch (error: any) {
    setMessage(form, error.message, { status: 403 });
  }
  return { form };
}) satisfies PageLoad;
