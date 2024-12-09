import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import { editFormSchema } from "../schema.js";

const key = "formresource";

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
  let data: any = {};
  let id = params.id;
  await auth.clientinit((locals as any).domain, url.origin, fetch, cookies);
  let item = await auth.client.FindOne<any>({ collectionname: "forms", query: { _id: id }, jwt: auth.access_token });
  data.form = await superValidate(item, zod(editFormSchema));
  return data;
};

export const actions: Actions = {
  default: async (event: any) => {
    const form = await superValidate(event, zod(editFormSchema));
    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    try {
      await auth.client.UpdateOne({ collectionname: "forms", item: form.data, jwt: auth.access_token });
    } catch (err: any) {
      console.error(err);
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + `/${key}`);
  },
};


