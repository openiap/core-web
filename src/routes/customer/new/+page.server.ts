import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import { newFormSchema } from "../schema.js";
const key = "customer"
export const load: PageServerLoad = async () => {
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
