// export const ssr = false;
import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { z } from 'zod';
import { client } from "@openiap/jsapi/dist/client.js";
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
export const _userSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(2),
  email: z.string().email()
});
export type UserSchema = typeof _userSchema;

export const load: PageServerLoad = async () => {
    const defaultValues = {
        name: "John Doe",
        email: "john@doe.com"
    }
 return {
  form: await superValidate(defaultValues, zod(_userSchema)),
 };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod(_userSchema));

    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    try {
      await auth.client.InsertOne({collectionname: "users", item: {...form.data, _type: "role"}});
    } catch (err:any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + '/role');
  },
};


