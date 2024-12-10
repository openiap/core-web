import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
    await auth.clientinit((locals as any).domain, url.origin, fetch, cookies );
    const entities = await auth.client.Query({
        collectionname: "users",
        query: {_type: "role"},
        orderby: "",
        skip: 0,
        top: 5,
        jwt: auth.access_token,
    });
    return { entities };
};
