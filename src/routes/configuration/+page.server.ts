import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import { editFormSchema } from "./schema.js";
import { cleanMatchingKeys, defaultSettings } from "./helper.js";
// const key = "user"

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
  let data: any = {};
  let currentSettings = await auth.client.FindOne<any>({ collectionname: "config", query: { "_type": "config" }, jwt: auth.access_token });
  let combinedSettings = { ...defaultSettings, ...currentSettings }
  data.form = await superValidate(combinedSettings, zod(editFormSchema));
  return data;
};

export const actions: Actions = {
  default: async (event: any) => {
    console.error("actions: ");
    const form = await superValidate(event, zod(editFormSchema));
    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    try {
      const cleanData = cleanMatchingKeys(form.data);
      await auth.client.UpdateOne({ collectionname: "config", item: cleanData, jwt: auth.access_token });
    } catch (err: any) {
      console.error("configuration: ", err);
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    // throw redirect(303, base + `/${key}`);
  },
};


