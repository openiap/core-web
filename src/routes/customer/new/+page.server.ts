import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import { fail, redirect } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { newFormSchema } from "../schema.js";
import type { Actions, PageServerLoad } from "./$types.js";

const key = "customer"

export const load: PageServerLoad = async ({ fetch, url, cookies, locals }) => {
  const defaultValues = {
    name: "John Doe",
    domains: [],
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
      await auth.client.InsertOne({ collectionname: "users", item: { ...form.data, _type: "customer" }, jwt: auth.access_token });
    } catch (err: any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + `/${key}`);
  },
};
