import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
import { data} from "$lib/entities/data.svelte.js";
import { settingsState } from "$lib/stores/settings.svelte";

export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
    await auth.clientinit((locals as any).domain, url.origin, fetch, cookies );
    const settings = new settingsState(cookies);

    let collectionname = settings.getvalue("entities", "collectionname", "entities");
    let page = "entities-" + collectionname;
    let searchstring = settings.getvalue(page, "searchstring", "");
	data.loadsettings(page, cookies);
    const entities = await data.GetData(collectionname, searchstring, {});
    const collections = await auth.client.ListCollections({jwt: auth.access_token});
    return { entities, collections, collectionname, searchstring };

};
