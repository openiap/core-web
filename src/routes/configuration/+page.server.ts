import { auth } from "$lib/stores/auth.svelte.js";
import { fail } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types.js";
import { cleanMatchingKeys, defaultSettings } from "./helper.js";
import { editFormSchema } from "./schema.js";

export const load: PageServerLoad = async ({ parent }) => {
  const { access_token } = await parent();
  let data: any = {};
try {
    let currentSettings = await auth.client.FindOne<any>({ collectionname: "config", query: { "_type": "config" }, jwt: access_token });
    let combinedSettings = { ...defaultSettings, ...currentSettings }
    data.form = await superValidate(combinedSettings, zod(editFormSchema));
      
  } catch (error) {
    
  }
  return data;
};

export const actions: Actions = {
  default: async (event: any) => {
    debugger;
    console.log("auth.access_token", auth.access_token);
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
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
  },
};


