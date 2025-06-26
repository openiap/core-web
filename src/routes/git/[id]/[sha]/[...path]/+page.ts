import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { id, path } = params;
  const { access_token } = await parent();
  return { id, gittype: "commit", path, access_token };
};
