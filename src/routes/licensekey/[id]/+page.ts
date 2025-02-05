import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";
export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  try {
    let item = await auth.client.FindOne<any>({ collectionname: "config", query: { _id: params.id, _type: "license" }, jwt: access_token });
    if(item._stripeprice == null) { item._stripeprice = ""; }
    let resource = await auth.client.FindOne<any>({ collectionname: "config", query: { name: "OpenCore License", _type: "resource" }, jwt: access_token });
    return { item, resource };
  } catch (error) {
    return { item: null };
  }
};
