import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";
export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  let item = {name: "", schema: { components: [] }};
    try {
      if (params.id == null || params.id == "") { goto(base + `/form`); return { item }; }
      item = await auth.client.FindOne<any>({ collectionname: "forms", query: { _id: params.id }, jwt: access_token });
      if(item == null) { goto(base + `/form`); return { item }; }
      return { item } ;
    } catch (error) {
      return { item };      
    }
  };
  