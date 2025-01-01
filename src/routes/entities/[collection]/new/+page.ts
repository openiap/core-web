import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { newFormSchema } from "../schema.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async () => {
  const defaultValues = {
    name: "John Doe",
    username: "Johndoe",
    email: "john@doe.com",
    password: "123456",
    disabled: false,
    dblocked: false,
    validated: false,
    emailvalidated: false,
    formvalidated: false,
    federationids: [],
  }
  return {
    form: await superValidate(defaultValues, zod(newFormSchema)),
  };
};

