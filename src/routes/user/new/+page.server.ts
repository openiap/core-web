import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { z } from 'zod';
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
export const _userSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(2),
  password: z.string().min(6),
  disabled: z.boolean(),
  dblocked: z.boolean(),
  validated: z.boolean(),
});
export type UserSchema = typeof _userSchema;

export const load: PageServerLoad = async () => {
  const defaultValues = {
    name: "John Doe",
    username: "Johndoe",
    email: "john@doe.com",
    password: "123456",
    disabled: false,
    dblocked: false,
    validated: false,
  }
  return {
    form: await superValidate(defaultValues, zod(_userSchema)),
  };
};

export const actions: Actions = {
  default: async (event:any) => {
    const form = await superValidate(event, zod(_userSchema));

    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    try {
      let item = { ...form.data, _type: "user" };
      await auth.client.InsertOne({ collectionname: "users", item: { ...form.data, _type: "user" }, jwt: auth.access_token });
    } catch (err: any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + '/user');
  },
};
