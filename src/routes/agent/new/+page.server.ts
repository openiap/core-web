import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({parent}) => {
  const { access_token } = await parent();
  let agentInstance = await auth.client.FindOne<any>({ collectionname: "config", query: { name: "Agent Instance", _type: "resource" }, jwt: access_token });
  return {
    agentInstance
  };
};