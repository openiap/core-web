import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ( { fetch, url, cookies, locals } ) => {
    await auth.clientinit((locals as any).domain, url.origin, fetch, cookies );
    let entities = [];
    try {
        entities = JSON.parse(await auth.client.CustomCommand({
            command: "getclients",
            jwt: auth.access_token,
        }));
    } catch (error) {
    }
    return { entities };

};
