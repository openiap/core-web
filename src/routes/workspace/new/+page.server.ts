import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { newFormSchema } from "../schema.js";
import type { PageServerLoad } from "./$types.js";

const key = "workspace"

export const load: PageServerLoad = async ({ fetch, url, cookies, locals }) => {
  const defaultValues = {
    name: "Lemonify"
  }
  return {
    form: await superValidate(defaultValues, zod(newFormSchema)),
  };
};
