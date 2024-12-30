import { data } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
import { collectionname, page, basequery } from "./+page.svelte";

export const load: PageServerLoad = async () => {
    data.loadsettings(page);
    let searchstring = data.settings.searchstring;
    const userid = auth.profile.sub;
    const email = auth.profile.email;
    let query:any = {...basequery, ...{"$or": [{"userid": userid}, {"email": email}]}};
    const entities = await data.GetData(page, collectionname, query);
    return { entities, searchstring, settings: data.getpagesettingsreactless() };
};
