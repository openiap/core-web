import { data } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({ parent, params }) => {
  try {
    const { access_token } = await parent();
    let id = params.id;
    let item = await auth.client.FindOne<any>({ collectionname: "agents", query: { _id: id, _type: "agent" }, jwt: access_token });
    let agentInstance = await auth.client.FindOne<any>({ collectionname: "config", query: { name: "Agent Instance", _type: "resource" }, jwt: access_token });

    if (item._stripeprice == null && item.stripeprice != null && item.stripeprice != "") {
      item._stripeprice = item.stripeprice;
    }
    if (item._stripeprice == "" || item._stripeprice == null) {
      if (item._resourceusageid != null && item._resourceusageid != "") {
        const usage = await auth.client.FindOne<any>({ collectionname: "config", query: { _id: item._resourceusageid, _type: "resourceusage" }, jwt: access_token });
        if (usage != null && item._stripeprice != usage.product.stripeprice) {
          item._stripeprice = usage.product.stripeprice;
        }
      }
    }
    if (item._stripeprice != null && item._stripeprice != "") {
      let exists = agentInstance.products.find((x: any) => x.id == item._stripeprice);
      if (exists == null) {
        exists = agentInstance.products.find((x: any) => x.name == item._productname);
        if (exists != null) {
          item._stripeprice = exists.stripeprice;
        }
      }
      if (exists == null) {
        agentInstance.products.push({ stripeprice: item._stripeprice, name: item._productname });
      }
    }
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
