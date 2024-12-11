import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({ fetch, url, cookies, locals, params }) => {
    await auth.clientinit((locals as any).domain, url.origin, fetch, cookies );
    const entities = await auth.client.Query({
        collectionname: "agents",
        query: { _type: "agent" },
        orderby: "",
        skip: 0,
        top: 5,
        jwt: auth.access_token,
    })
    return { entities };
};
