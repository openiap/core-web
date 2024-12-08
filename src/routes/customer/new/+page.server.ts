import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { z } from 'zod';
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
const key = "customer"
export const _userSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(2),
  domains: z.array(z.string().email()).optional(),
});
export type UserSchema = typeof _userSchema;

export const load: PageServerLoad = async () => {
  const defaultValues = {
    name: "John Doe",
    domains: [],
  }
  return {
    form: await superValidate(defaultValues, zod(_userSchema)),
  };
};

export const actions: Actions = {
  default: async (event: any) => {
    const form = await superValidate(event, zod(_userSchema));

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
