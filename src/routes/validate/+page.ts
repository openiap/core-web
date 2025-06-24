import { auth } from "$lib/stores/auth.svelte.js";
import { toast } from "svelte-sonner";
import type { Workspace } from "../workspace/schema.js";
import type { PageLoad } from "./$types.js";
export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  let form:any = null;
  let workspace:Workspace = null as any;
  try {
    if(auth.config?.validate_user_form != null && auth.config?.validate_user_form != "") {
      let item = await auth.client.FindOne<any>({ collectionname: "forms", query: { _id: auth.config?.validate_user_form }, jwt: access_token });
      if(item != null) {
        form = item;
      }
      workspace = await auth.client.FindOne<Workspace>({ collectionname: "users", query: { _type: "workspace" }, jwt: access_token });
    } else {
      toast.error("validate_user_form not set");
      console.error("validate_user_form not set");
    }
    return { form, workspace };
  } catch (error) {
    return { form, workspace };
  }
};
