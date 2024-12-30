import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
import { collectionname } from "./+page.svelte";
export const load: PageServerLoad = async ({ params }) => {
  let id = params.id;
  let item = await auth.client.FindOne<any>({ collectionname, query: { _id: id }, jwt: auth.access_token });
  return { item };
};
