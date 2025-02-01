import type { PageLoad } from "./$types.js";
export const load: PageLoad = async ({ parent, params }) => {
  let collection = params.collection;
  return { collection };
};
