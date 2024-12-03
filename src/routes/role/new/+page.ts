export const ssr = false;
import type { PageLoad } from "./$types.js";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

import { z } from 'zod';
export const _userSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(2),
  email: z.string().email()
});
export type UserSchema = typeof _userSchema;

export const load: PageLoad = async () => {
// export async function load({url, fetch}) {
    console.log("load");

    const defaultValues = {
        name: "John Doe",
        email: "john@doe.com"
    }
 return {
  form: await superValidate(defaultValues, zod(_userSchema)),
 };
};

