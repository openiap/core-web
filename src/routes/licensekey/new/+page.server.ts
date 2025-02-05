import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({parent}) => {
  const { access_token } = await parent();
  try {
    let resource = await auth.client.FindOne<any>({ collectionname: "config", query: { name: "OpenCore License", _type: "resource" }, jwt: access_token });
    return {
      resource
    };
  } catch (error) {
    return { resource: null };    
  }
};