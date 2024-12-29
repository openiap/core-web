import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import { newMemberSchema } from "../../schema.js";

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

export const actions: Actions = {
  default: async (event: any) => {
    const form = await superValidate(event, zod(newMemberSchema));

    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    try {
      await auth.client.CustomCommand({ command: "inviteuser", data: JSON.stringify(form.data), jwt: auth.access_token });
    } catch (err: any) {
      console.error(err);
      setError(form, 'email', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + `/${key}/${form.data.workspaceid}/member`);
  },
};
