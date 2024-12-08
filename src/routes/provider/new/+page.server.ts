import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { z } from 'zod';
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
const key = "provider"
export const _userSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(2),
  forceddomains: z.array(z.string().email()).optional(),
});
export type UserSchema = typeof _userSchema;

export const load: PageServerLoad = async () => {
  const defaultValues = {
    name: "John Doe",
    id: "123",
    federationids: [],
  }
  return {
    form: await superValidate(zod(_userSchema)),
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
      // let item = { ...form.data, _type: "user" };
      const res = await auth.client.InsertOne({ collectionname: "config", item: { ...form.data, _type: "provider_test" }, jwt: auth.access_token });
      console.log("InsertOne", res);
    } catch (err: any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + `/${key}`);
  },
};
