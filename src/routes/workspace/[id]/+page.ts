import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import { setMessage, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { editFormSchema } from "../schema.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  let form = await superValidate({ _id: params.id }, zod(editFormSchema));
  try {
    if (params.id == null || params.id == "") { goto(base + `/workspace`); return { form }; }
    let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: params.id }, jwt: access_token });
    if (item == null) { goto(base + `/workspace`); return { form }; }
    console.log("load", params.id);
    return { form: await superValidate(item, zod(editFormSchema)) }
  } catch (error:any) {
    setMessage(form, error.message, { status: 403 });
  }
  return { form };
};
