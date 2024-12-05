import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { z } from 'zod';
import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";


export const _userSchema = z.object({
  _id: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
}).passthrough();
export type UserSchema = typeof _userSchema;

export const load: PageServerLoad = async (x: any) => {
  let data = x.data || {};
  let id = x.params.id;
  await auth.clientinit(x.url.origin, x.fetch, null);
  // let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: id } });

  const response = await x.fetch(base + "/api/query", {
    method: "POST",
    body: JSON.stringify({
        collectionname: "users",
        query: { _id: id },
        orderby: "",
        skip: 0,
        top: 1,
    }),
    headers: {
        "content-type": "application/json",
        "authorization": "Bearer " + auth.access_token,
    },
  });
  const entities = await response.json();
  if(entities.letngth == 0) {
    setError(data.form, 'name', "Not found!");
    return data;
  }
  const item = entities[0];

  data.form = await superValidate(item, zod(_userSchema));
  return data;
};

export const actions: Actions = {
  default: async (event:any) => {
    const form = await superValidate(event, zod(_userSchema));

    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    try {
      let item = { ...form.data, _type: "user" };
      // await auth.client.UpdateOne({ collectionname: "users", item: form.data });
      const response = await event.fetch(base + '/api/entities/users', {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + auth.access_token,
            'content-type': 'application/json'
        },
        body: JSON.stringify(item)
      });
      if(response.status !== 200) {
        console.log('Error saving data ' + response.status + " " + response.statusText);
        throw new Error('Error saving data ' + response.status + " " + response.statusText);
      }
    } catch (err: any) {
      setError(form, 'name', err.message);
      return {
        form,
      };
    }
    throw redirect(303, base + '/user');
  },
};

      
