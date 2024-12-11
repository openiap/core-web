import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
import { data } from "$lib/entities/data.svelte.js";
import { settingsState } from "$lib/stores/settings.svelte";

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
    const settings = new settingsState(cookies);
    let collectionname = settings.getvalue("entities", "collectionname", "entities");
    let page = "entities-" + collectionname;
    let searchstring = settings.getvalue(page, "searchstring", "");
	data.loadsettings(page, cookies);
    const entities = await data.GetData(page, collectionname, searchstring, {});
    const collections = await auth.client.ListCollections({jwt: auth.access_token});
    return { entities, collections, collectionname, searchstring };

};
