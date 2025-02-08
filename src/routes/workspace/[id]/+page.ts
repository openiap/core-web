import { goto } from "$app/navigation";
import { base } from "$app/paths";
import type { Billing } from "$lib/billing.svelte.js";
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
  let currentbilling: Billing | null = null;
  let entities: any[] = [];
  let total_count = 0;
  let resourcecount = 0;
  let currentworkspace: Workspace = null as any;
  let form = await superValidate({ _id: params.id }, zod(workspaceSchema));
  try {
    entities = await auth.client.Query<any>({ collectionname: "users", query: { _type: "customer" }, jwt: access_token });
    total_count = await auth.client.Count({ collectionname: "users", query: { _type: "customer" }, jwt: access_token });
    if (params.id == null || params.id == "") { goto(base + `/workspace`); return { form, currentbilling, entities, total_count, currentworkspace, resourcecount }; }
    usersettings.currentworkspace = params.id;

    resourcecount = await auth.client.Count({ collectionname: "config", query: { _type: "resourceusage", workspaceid: params.id }, jwt: access_token });

    let workspace = await auth.client.FindOne<Workspace>({ collectionname: "users", query: { _id: usersettings.currentworkspace, _type: "workspace" }, jwt: access_token });
    if (workspace._billingid != null && workspace._billingid != "") {
      currentbilling = entities.find((x) => x._id == workspace._billingid);
      if (currentbilling == null) {
        currentbilling = await auth.client.FindOne<Billing>({ collectionname: "users", query: { _type: "customer", _id: workspace._billingid }, jwt: access_token });
        if (currentbilling != null) {
          entities.push(currentbilling);
        }
      }
    }
  } catch (error) {
  }

  try {
    if (params.id == null || params.id == "") { goto(base + `/workspace`); return { form, currentbilling, entities, total_count, currentworkspace, resourcecount }; }
    let item = await auth.client.FindOne<any>({ collectionname: "users", query: { _id: params.id }, jwt: access_token });
    if (item == null) { goto(base + `/workspace`); return { form, currentbilling, entities, total_count, currentworkspace, resourcecount }; }
    currentworkspace = item;
    if (usersettings.currentworkspace != item._id) {
      usersettings.currentworkspace = item._id;
      await usersettings.dopersist();
    }

    return { form: await superValidate(item, zod(workspaceSchema)), currentbilling, entities, total_count, currentworkspace, resourcecount }
  } catch (error: any) {
    setMessage(form, error.message, { status: 403 });
  }
  return { form, currentbilling, entities, total_count, currentworkspace,resourcecount };
};
