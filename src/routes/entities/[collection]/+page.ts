import { data } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent, params }) => {
    const { access_token } = await parent();
    await usersettings.dbload(access_token);
    let collectionname = params.collection;
    if (collectionname == null || collectionname == "") {
        collectionname = "entities";
    }
    let page = "entities-" + collectionname;
    data.loadsettings(page);
    try {
        const collections = await auth.client.ListCollections({ jwt: access_token });
        return { collections, collectionname };
    } catch (error) {
        return { collections: [], collectionname };
    }
};
