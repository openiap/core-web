import { auth } from "$lib/stores/auth.svelte.js";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import type { PageLoad } from "./$types.js";
import { defaultSettings } from "./helper.js";
import { editFormSchema } from "./schema.js";

export const load: PageLoad = async ({ parent }) => {
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
