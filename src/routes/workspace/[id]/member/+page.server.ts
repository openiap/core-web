import { data } from "$lib/entities/data.svelte.js";
import type { PageServerLoad } from "./$types.js";
import { collectionname, page } from "./+page.svelte";

export const load: PageServerLoad = async ({ params }) => {
    let id = params.id;
    data.loadsettings(page);
    let searchstring = data.settings.searchstring;
    const entities = await data.GetData(page, collectionname, {_type: "member", workspaceid: id, status: {"$ne": "rejected"}});
    return { entities, searchstring, settings: data.getpagesettingsreactless(), id };
};
