import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";
import type { Resource } from "../../../../lib/types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  let resources = await auth.client.Query<Resource>({ collectionname: "config", query: { _type: "resource" }, jwt: access_token });
  return { resources };
};
