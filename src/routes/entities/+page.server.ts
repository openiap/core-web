import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
import { data } from "$lib/entities/data.svelte.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
    let collectionname = usersettings.entities_collectionname;
    let page = "entities-" + collectionname;
	data.loadsettings(page, cookies);
    let searchstring = data.settings.searchstring;
    const entities = await data.GetData(page, collectionname, searchstring, {});
    const collections = await auth.client.ListCollections({jwt: auth.access_token});
    return { entities, collections, collectionname, searchstring };

};
