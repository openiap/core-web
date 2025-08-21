import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  try {
    let item = await auth.client.FindOne<any>({ collectionname: "sf", query: { _id: params.id, _type: "app" }, jwt: access_token });
    let chartdata
    return { item, chartdata, paramid: params.id };
  } catch (error) {
    return { item: null, chartdata: null, paramid: null };
  }
};
