import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import { newFormSchema } from "../schema.js";

const key = "workspace"

export const load: PageServerLoad = async ({ fetch, url, cookies, locals }) => {
  const defaultValues = {
    name: "Lemonify"
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
      // await auth.client.InsertOne({ collectionname: "users", item: { ...form.data, _type: "workspace" }, jwt: auth.access_token });
      await auth.client.CustomCommand({ command: "ensureworkspace", data: JSON.stringify(form.data), jwt: auth.access_token });
    } catch (err: any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + `/${key}`);
  },
};
