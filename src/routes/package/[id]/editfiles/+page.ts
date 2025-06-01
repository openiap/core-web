import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";
export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  try {
    let packageData = await auth.client.FindOne<any>({ collectionname: "agents", query: { _id: params.id, _type: "package" }, jwt: access_token });
    // let fileData = await auth.client.FindOne<any>({ collectionname: "files", query: { _id: packageData.fileid }, jwt: access_token });
    return { packageid: params.id, packageData };
  } catch (error) {
    return { item: null };
  }
};
