import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import { newFormSchema } from "../schema.js";
import { randomname } from "./helper.js";

const key = "agent"
export const load: PageServerLoad = async ({ fetch, url, cookies, locals }) => {
  await auth.clientinit((locals as any).domain, url.origin, fetch, cookies);

  let item = await auth.client.FindOne<any>({ collectionname: "config", query: { name: "Agent Instance", _type: "resource" }, jwt: auth.access_token });

  // const name = randomname();


  const defaultValues = {
    name: "",
    slug: "",
    image: "",
    plan: "",
    environment: [],
    autostart: false,
    webserver: false,
    sleep: false,
    timezone: "",
    runas: "",
  }
  return {
    form: await superValidate(zod(newFormSchema)),
    agentInstance: item
  };
};

export const actions: Actions = {
  default: async (event: any) => {
    const form = await superValidate(event, zod(newFormSchema));

    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    try {
      await auth.client.InsertOne({ collectionname: "agents", item: { ...form.data, _type: "agent" }, jwt: auth.access_token });
    } catch (err: any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + `/${key}`);
  },
};
