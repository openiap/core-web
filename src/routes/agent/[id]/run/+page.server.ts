import type { PageServerLoad } from "./$types.js";
import { auth } from "$lib/stores/auth.svelte.js";
export const load: PageServerLoad = async ({ params }) => {
  let id = params.id;
  let item = await auth.client.FindOne<any>({ collectionname: "agents", query: { _id: id }, jwt: auth.access_token });
  let packages = await auth.client.Query({ collectionname: "agents", query: { _type: "package", language: { "$in": item.languages } }, jwt: auth.access_token });

  return { item, packages };
};
