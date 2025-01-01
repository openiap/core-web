import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
    let id = params.id;
    let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: id }, jwt: access_token });
    return { item } ;
  };
  