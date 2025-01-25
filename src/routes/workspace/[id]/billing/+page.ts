import { auth } from "$lib/stores/auth.svelte.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import type { Resource } from "$lib/types.svelte.js";
import type { Workspace } from "../../../workspace/schema.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  let resources = await auth.client.Query<Resource>({ collectionname: "config", query: { _type: "resource", target: {"$in": ["workspace", "agent", "member"]} }, jwt: access_token });
  let workspace = await auth.client.FindOne<Workspace>({ collectionname: "users", query: { _id: params.id, _type: "workspace" }, jwt: access_token });
  let billingaccount = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: workspace.billingid, _type: "customer" }, jwt: access_token });
  return { resources, billingaccount, workspace };
};
