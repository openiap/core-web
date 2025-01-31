import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  try {
    let item = await auth.client.FindOne<any>({ collectionname: "workitems", query: { _id: params.id, _type: "workitem" }, jwt: access_token });

    let itemSize = [];
    for (let i = 0; i < item.files.length; i++) {
      itemSize.push(false);
    }

    return { item, itemSize };
  } catch (error) {
    return { item: null };
  }
};
