import { data } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async () => {
    let entities = [];
    let searchstring = data.settings?.searchstring || "";
    try {
        entities = JSON.parse(await auth.client.CustomCommand({
            command: "getclients",
            jwt: auth.access_token,
        }));
    } catch (error) {
    }
    return { entities, searchstring };

};
