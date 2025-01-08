import { data } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ parent }) => {
    const { access_token } = await parent();
    await usersettings.dbload(access_token);
    let collectionname = usersettings.entities_collectionname;
    if (collectionname == null || collectionname == "") {
        collectionname = "entities";
    }
    let page = "entities-" + collectionname;
    data.loadsettings(page);
    let searchstring = data.settings.searchstring;
    try {
        const entities = await data.GetData(page, collectionname, {}, access_token);
        const collections = await auth.client.ListCollections({ jwt: access_token });
        const total_count = await data.GetCount(page, collectionname, {}, access_token);
        return { entities, collections, collectionname, searchstring, total_count };
    } catch (error) {
        return { entities: [], collections: [], collectionname, searchstring, total_count: 99999 };
    }
};
