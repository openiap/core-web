import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { newFormSchema } from "../schema.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async () => {
  const defaultValues = {
    name: "entities",
    collection: "entities",
    aggregates: []
  }
  return {
    form: await superValidate(defaultValues, zod(newFormSchema)),
  };
};

