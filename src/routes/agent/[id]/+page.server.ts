import { data } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
import { collectionname } from "./+page.svelte";
export const load: PageServerLoad = async ({parent, params}) => {
  try {
    const { access_token } = await parent();
    let id = params.id;
    let item = await auth.client.FindOne<any>({ collectionname, query: { _id: id, _type: "agent" }, jwt: access_token });
    let agentInstance = await auth.client.FindOne<any>({ collectionname: "config", query: { name: "Agent Instance", _type: "resource" }, jwt: access_token });
    let instancejson: any = await auth.client.CustomCommand({ command: "getagentpods", id: item._id, name: item.slug, jwt: access_token })
    if (item != null && item.sleep == null) {
      item.sleep = false;
    }
    if (item != null && item.autostart == null) {
      item.autostart = false;
    }
    if (item != null && item.webserver == null) {
      item.webserver = false;
    }
    const instances = data.parseJson(instancejson, null, null);
    return { item, agentInstance, instances };
  } catch (error) {
    console.log(error);
  }
  return { item: null, agentInstance: null, instances: [] };
};
