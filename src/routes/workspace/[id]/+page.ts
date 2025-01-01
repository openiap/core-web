import { auth } from "$lib/stores/auth.svelte.js";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { editFormSchema } from "../schema.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  try {
    let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: params.id }, jwt: access_token });
    return { form: await superValidate(item, zod(editFormSchema)) }
  } catch (error) {
    return { form: await superValidate(zod(editFormSchema)) };
  }
};
