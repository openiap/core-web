import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { z } from 'zod';
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import { newFormSchema } from "../schema.js";

const key = "provider"

export const load: PageServerLoad = async ({ fetch, url, cookies, locals }) => {
  await auth.clientinit((locals as any).domain, url.origin, fetch, cookies);
  const defaultValues = {
    name: "John Doe",
    id: "123",
    federationids: [],
  }
  return {
    form: await superValidate(zod(newFormSchema)),
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
      const res = await auth.client.InsertOne({ collectionname: "config", item: { ...form.data, _type: "provider" }, jwt: auth.access_token });
    } catch (err: any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + `/${key}`);
  },
};
