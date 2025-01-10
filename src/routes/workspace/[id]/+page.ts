import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { data } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import { setMessage, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { Workspace, workspaceSchema } from "../schema.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  await usersettings.dbload(access_token);
  let page = "workspace";
  data.loadsettings(page);
  let currentbilling: any = null;
  let entities: any[] = [];
  let total_count = 0;
  let currentworkspace: Workspace = null as any;
  let form = await superValidate({ _id: params.id }, zod(workspaceSchema));
  try {
    entities = await auth.client.Query<any>({ collectionname: "users", query: { _type: "customer" }, jwt: access_token });
    total_count = await auth.client.Count({ collectionname: "users", query: { _type: "customer" }, jwt: access_token });
    if (params.id == null || params.id == "") { goto(base + `/workspace`); return { form, currentbilling, entities, total_count, currentworkspace }; }
    usersettings.currentworkspace = params.id;

    let workspace = await auth.client.FindOne<any>({ collectionname: "workspaces", query: { _id: usersettings.currentworkspace }, jwt: access_token });
    if (workspace.billingid != null && workspace.billingid != "") {
      currentbilling = entities.find((x) => x._id == workspace.billingid);
      if (currentbilling == null) {
        currentbilling = await auth.client.FindOne<any>({ collectionname: "users", query: { _type: "customer", _id: workspace.billingid }, jwt: access_token });
        if (currentbilling != null) {
          entities.push(currentbilling);
        }
      }
    }
  } catch (error) {
  }

  try {
    if (params.id == null || params.id == "") { goto(base + `/workspace`); return { form, currentbilling, entities, total_count, currentworkspace }; }
    let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: params.id }, jwt: access_token });
    if (item == null) { goto(base + `/workspace`); return { form, currentbilling, entities, total_count, currentworkspace }; }
    currentworkspace = item;
    if (usersettings.currentworkspace != item._id) {
      usersettings.currentworkspace = item._id;
      await usersettings.dopersist();
    }

    return { form: await superValidate(item, zod(workspaceSchema)), currentbilling, entities, total_count, currentworkspace }
  } catch (error: any) {
    setMessage(form, error.message, { status: 403 });
  }
  return { form, currentbilling, entities, total_count, currentworkspace };
};
