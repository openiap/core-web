import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  let id = params.id;
  let collectionname = params.collection;
  try {
    let entities = await auth.client.Query<any>({ collectionname: collectionname + "_hist", query: { id }, jwt: access_token });
    return { id, collectionname, entities };
  } catch (error) {
    return { id, collectionname, entities: [] };
  }
};
