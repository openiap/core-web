import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { id, sha, path } = params;
  const { access_token } = await parent();
  console.log("path", path);
  return { id, gittype: "commit", sha, path, access_token };
};
