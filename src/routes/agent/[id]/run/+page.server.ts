import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({ params, parent }) => {
  let id = params.id;
  const { access_token } = await parent();
  let item = await auth.client.FindOne<any>({ collectionname: "agents", query: { _id: id }, jwt: access_token });
  let packages = await auth.client.Query({ collectionname: "agents", query: { _type: "package", language: { "$in": item.languages } }, jwt: access_token });

  return { item, packages };
};
