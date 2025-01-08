import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";
import { collectionname } from "./+page.svelte";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  try {
    let item = await auth.client.FindOne<any>({ collectionname, query: { _id: params.id, _type: "user" }, jwt: access_token });
    return { item };
  } catch (error) {
    return { item: null };
  }
};
