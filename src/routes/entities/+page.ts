import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { data } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ parent }) => {
    const { access_token } = await parent();
    await usersettings.dbload(access_token);
    let collectionname = usersettings.entities_collectionname;
    if (collectionname == null || collectionname == "") {
        collectionname = "entities";
    }
    if(browser) {
        goto(base + "/entities/" + collectionname); 
    } else {
        throw redirect(307, base + "/entities/" + collectionname);
    }
    return collectionname;
};
