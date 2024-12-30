import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import { fail, redirect } from "@sveltejs/kit";
import { message, setError, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { newMemberSchema } from "../../schema.js";
import type { Actions, PageServerLoad } from "./$types.js";

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
    try {
      if (!form.valid) {
        return fail(400, {
          form,
        });
      }
      try {
        await auth.client.CustomCommand({ command: "inviteuser", data: JSON.stringify(form.data), jwt: auth.access_token });
      } catch (err: any) {
        setError(form, 'email', err.message);
        return {
          form,
        };
      }
    } catch (error: any) {
      return message(form, error.message);
    }
    throw redirect(303, base + `/${key}/${form.data.workspaceid}/member`);
  },
};
