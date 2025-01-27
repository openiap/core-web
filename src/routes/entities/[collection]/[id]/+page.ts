import { auth } from "$lib/stores/auth.svelte.js";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { editFormSchema } from "../schema.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  let data: any = {};
  let id = params.id;
  let collection = params.collection;
  try {
    let item = await auth.client.FindOne<any>({ collectionname: collection, query: { _id: id }, jwt: access_token });
    data.form = await superValidate(item, zod(editFormSchema));
    return { data, id, collection };
  } catch (error) {
    return { form: await superValidate(zod(editFormSchema)) };
  }
};
