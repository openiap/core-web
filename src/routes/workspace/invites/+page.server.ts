import { data } from "$lib/entities/data.svelte.js";
import type { PageServerLoad } from "./$types.js";
import { collectionname, page, query } from "./+page.svelte";

export const load: PageServerLoad = async () => {
    data.loadsettings(page);
    let searchstring = data.settings.searchstring;
    const entities = await data.GetData(page, collectionname, query);
    return { entities, searchstring, settings: data.getpagesettingsreactless() };
};
