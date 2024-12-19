import type { PageServerLoad } from "./$types.js";
import { auth } from "$lib/stores/auth.svelte.js";
import { collectionname } from "./+page.svelte";
export const load: PageServerLoad = async ({ params }) => {
  let id = params.id;
  let item = await auth.client.FindOne<any>({ collectionname, query: { _id: id }, jwt: auth.access_token });
  let agentInstance = await auth.client.FindOne<any>({ collectionname: "config", query: { name: "Agent Instance", _type: "resource" }, jwt: auth.access_token });
  if (item != null && item.sleep == null) {
    item.sleep = false;
  }
  if (item != null && item.autostart == null) {
    item.autostart = false;
  }
  if (item != null && item.webserver == null) {
    item.webserver = false;
  }
  return { item, agentInstance };
};
