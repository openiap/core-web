import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import { fail, redirect } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { newFormSchema } from "../schema.js";
import type { Actions, PageServerLoad } from "./$types.js";

const key = "formresource";

export const load: PageServerLoad = async ({ fetch, url, cookies, locals }) => {
  const defaultValues = {
    name: "entities",
    collection: "entities",
    aggregates: []
  }
  return {
    form: await superValidate(defaultValues, zod(newFormSchema)),
  };
};

export const actions: Actions = {
  default: async (event: any) => {
    const form = await superValidate(event, zod(newFormSchema));
    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    try {
      await auth.client.InsertOne({ collectionname: "forms", item: { ...form.data, _type: "resource" }, jwt: auth.access_token });
    } catch (err: any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + `/${key}`);
  },
};
