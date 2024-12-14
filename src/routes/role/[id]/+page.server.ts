import type { PageServerLoad } from "./$types.js";
import { auth } from "$lib/stores/auth.svelte.js";
export const load: PageServerLoad = async ({ params }) => {
    let id = params.id;
    let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: id }, jwt: auth.access_token });
    return { item } ;
  };
  