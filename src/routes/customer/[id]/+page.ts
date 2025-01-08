import { auth } from "$lib/stores/auth.svelte.js";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { editFormSchema } from "../schema.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ params, parent }) => {
  const { access_token } = await parent();
  let data: any = {};
  let id = params.id;
  try {
    let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: id, _type: "customer" }, jwt: access_token });
    data.form = await superValidate(item, zod(editFormSchema));
    return data;
  } catch (error) {
    return { form: await superValidate(zod(editFormSchema)) };
  }
};
