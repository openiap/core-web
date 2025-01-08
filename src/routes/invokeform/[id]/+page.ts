import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";
export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  let item = {_id: "", name: "", state: "", form: "", queue: "", submission: {}, userData: {}, payload: {submitbutton: ""} };
  let form = { _id: "", schema: { components: [] } };
    try {
      if (params.id == null || params.id == "") { goto(base + `/invokeform`); return { item }; }
      item = await auth.client.FindOne<any>({ collectionname: "workflow_instances", query: { _id: params.id, _type: "instance" }, jwt: access_token });
      if(item == null) { goto(base + `/invokeform`); return { item }; }
      if(item.form != null && item.form != "") {
        form = await auth.client.FindOne<any>({ collectionname: "forms", query: { _id: item.form, _type: "form" }, jwt: access_token });
      }
      return { item, form } ;
    } catch (error) {
      return { item, form };
    }
  };
  