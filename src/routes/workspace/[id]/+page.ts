import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { editFormSchema } from "../schema.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  try {
    if (params.id == null || params.id == "") { return goto(base + `/workspace`); }
    let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: params.id }, jwt: access_token });
    if (item == null) { return goto(base + `/workspace`); }
    console.log("load", params.id);
    return { form: await superValidate(item, zod(editFormSchema)) }
  } catch (error) {
    return { form: await superValidate(zod(editFormSchema)) };
  }
};
