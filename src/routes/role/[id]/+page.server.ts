import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import { userSchema } from "../schema.js";
const key = "role"
export const load: PageServerLoad = async (x: any) => {
  let data = x.data || {};
  let id = x.params.id;
  await auth.clientinit(x.url.origin, x.fetch, x.cookies);
  let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: id }, jwt: auth.access_token });
  data.form = await superValidate(item, zod(userSchema));
  return data;
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod(userSchema));

    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    try {
      await auth.client.UpdateOne({ collectionname: "users", item: form.data, jwt: auth.access_token });
    } catch (err: any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + `/${key}`);
  },
};
