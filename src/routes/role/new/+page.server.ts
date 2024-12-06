// export const ssr = false;
import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import { newUserSchema } from "../schema.js";

export const load: PageServerLoad = async () => {
  const defaultValues = {
    name: "John Doe",
    email: "john@doe.com"
  }
  return {
    form: await superValidate(defaultValues, zod(newUserSchema)),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod(newUserSchema));

    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    try {
      await auth.client.InsertOne({ collectionname: "users", item: { ...form.data, _type: "role" }, jwt: auth.access_token });
    } catch (err: any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + '/role');
  },
};
