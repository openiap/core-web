import type { PageServerLoad } from "./$types.js";
import { data } from "$lib/entities/data.svelte.js";
import { settingsState } from "$lib/stores/settings.svelte";

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
    const page = "workitem";
    const collectionname = "workitems";
    const settings = new settingsState(cookies);
    let searchstring = settings.getvalue(page, "searchstring", "");
    data.loadsettings(page, cookies);
    const entities = await data.GetData(page, collectionname, searchstring, {_type: "workitem"});
    return { entities, searchstring };
};
