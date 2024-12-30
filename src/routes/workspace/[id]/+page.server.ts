import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import { fail, redirect } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { editFormSchema } from "../schema.js";
import type { Actions, PageServerLoad } from "./$types.js";

const key = "workspace"

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
  let data:any = {};
  let id = params.id;
  let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: id }, jwt: auth.access_token });
  data.form = await superValidate(item, zod(editFormSchema));
  return data;
};

export const actions: Actions = {
  default: async (event: any) => {
    const form = await superValidate(event, zod(editFormSchema));
    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    try {
      await auth.client.CustomCommand({ command: "ensureworkspace", data: JSON.stringify(form.data), jwt: auth.access_token });
    } catch (err: any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + `/${key}`);
  },
};


