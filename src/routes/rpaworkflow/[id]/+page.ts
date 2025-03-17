import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";

// Define the type for Parameters
type Parameter = {
  name: string;
  type: string;
  value: any;
};

export const load: PageLoad = async ({ parent, params }) => {
  const { access_token } = await parent();
  let item: {
    _id: string;
    name: string;
    Parameters: Array<Parameter>; // Use the defined type here
  } = { _id: "", name: "", Parameters: [{ name: "", type: "", value: "" }] };
  try {
    if (params.id == null || params.id == "") { goto(base + `/rpaworkflow`); return { item }; }

    item = await auth.client.FindOne<any>({ collectionname: "openrpa", query: { _id: params.id, _type: "workflow" }, jwt: access_token });

    if (item == null) { goto(base + `/rpaworkflow`); return { item }; }
    if(item.Parameters == null) item.Parameters = [];
    item.Parameters.forEach((p) => {p.value = "";});
    return { item };
  } catch (error) {
    return { item };
  }
};
