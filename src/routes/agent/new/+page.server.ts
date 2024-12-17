import type { PageServerLoad } from "./$types.js";
import { auth } from "$lib/stores/auth.svelte.js";
export const load: PageServerLoad = async () => {
  let agentInstance = await auth.client.FindOne<any>({ collectionname: "config", query: { name: "Agent Instance", _type: "resource" }, jwt: auth.access_token });
  return {
    agentInstance
  };
};