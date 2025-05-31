import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";
export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  try {
    let item = await auth.client.FindOne<any>({ collectionname: "files", query: { _id: params.fileid }, jwt: access_token });
    return { item, packageid: params.id, fileid: params.fileid };
  } catch (error) {
    return { item: null };
  }
};
