import { data } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ parent }) => {
    const { access_token } = await parent();
    let collectionname = usersettings.entities_collectionname;
    let page = "entities-" + collectionname;
	data.loadsettings(page);
    let searchstring = data.settings.searchstring;
    try {
        const entities = await data.GetData(page, collectionname, {}, access_token);
        const collections = await auth.client.ListCollections({jwt: access_token});
        return { entities, collections, collectionname, searchstring };
    } catch (error) {
        return { entities: [], collections: [], collectionname, searchstring };
    }
};
