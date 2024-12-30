import { data } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
    let collectionname = usersettings.entities_collectionname;
    let page = "entities-" + collectionname;
	data.loadsettings(page);
    let searchstring = data.settings.searchstring;
    const entities = await data.GetData(page, collectionname, {});
    const collections = await auth.client.ListCollections({jwt: auth.access_token});
    return { entities, collections, collectionname, searchstring };

};
