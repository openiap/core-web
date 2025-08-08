import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  try {
    let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: params.id, _type: "user" }, jwt: access_token });
    let tokens = await auth.client.Query<any>({ collectionname: "usertokens", query: {  _type: "usertoken", revoked: false, _userid: item._id }, jwt: access_token });
    return { item, tokens };
  } catch (error) {
    return { item: null, tokens: null };
  }
};
