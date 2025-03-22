import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({ parent }) => {
  return { thread: null, messages: [] };
};
