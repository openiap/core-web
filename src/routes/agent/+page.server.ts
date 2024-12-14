import type { PageServerLoad } from "./$types.js";
import { data } from "$lib/entities/data.svelte.js";

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
    const page = "agent";
    const collectionname = "agents";
    data.loadsettings(page, cookies);
    let searchstring = data.settings.searchstring;
    const entities = await data.GetData(page, collectionname, searchstring, {_type: "agent"});
    return { entities, searchstring };
};
