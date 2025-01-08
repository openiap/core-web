import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";
export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  let item = {_id: "", name: "", queue: "", form: "", submission: {}, userData: {}, payload: {} };
  let form = { schema: { components: [] } };
    try {
      if (params.id == null || params.id == "") { goto(base + `/formworkflow`); return { item }; }
      item = await auth.client.FindOne<any>({ collectionname: "workflow", query: { _id: params.id, _type: "workflow" }, jwt: access_token });
      if(item == null) { goto(base + `/formworkflow`); return { item }; }
      if(item.form != null && item.form != "") {
        form = await auth.client.FindOne<any>({ collectionname: "forms", query: { _id: item.form, _type: "form" }, jwt: access_token });
      }
      return { item, form } ;
    } catch (error) {
      return { item, form };
    }
  };
  