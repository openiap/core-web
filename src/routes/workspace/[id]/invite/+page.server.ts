import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { newMemberSchema } from "../../schema.js";
import type { PageServerLoad } from "./$types.js";

const key = "workspace"

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
  const defaultValues = {
    email: "hello@world.com",
    workspaceid: params.id,
  }
  return {
    form: await superValidate(defaultValues, zod(newMemberSchema)),
  };
};
