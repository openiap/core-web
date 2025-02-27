import type { LayoutLoad } from "./$types.js";
import { base } from "$app/paths";
import type { Workspace } from "../workspace/schema.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import { data as datacomponent } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
export const load: LayoutLoad = async ({ parent, url, route, params }) => {
    const { access_token, entities } = await parent();
    // console.log("entities collection page", params);
    // let tab = params.tab;
    let tab = "";
    if (tab == null || tab == undefined || tab == "") {
        tab = "view";
    }
    // console.log("entities collection page", tab);
    await usersettings.dbload(access_token);
    let collectionname = usersettings.entities_collectionname;
    if (collectionname == null || collectionname == "") {
        collectionname = "entities";
    }
    // @ts-ignore
    if (params.collectionname) {
        // @ts-ignore
        collectionname = params.collectionname;
    }
    let page = "entities-" + collectionname;
    // console.log("entities collectionname", collectionname);
    datacomponent.loadsettings(page);
    let profileroles = auth.profile?.roles || [];
    const isAdmin = profileroles.includes("admins");
    // console.log("data.entities", entities);

    try {
        const collections = await auth.client.ListCollections({ jwt: access_token });
        return { collections, collectionname, tab, isAdmin };
    } catch (error) {
        return { collections: [], collectionname, tab, isAdmin };
    }
};
