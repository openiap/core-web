import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({ fetch, url, cookies, locals }) => {
    await auth.clientinit((locals as any).domain, url.origin, fetch, cookies);
    const entities = await auth.client.Query({
        collectionname: "forms",
        query: { _type: "resource" },
        orderby: "",
        skip: 0,
        top: 5,
        jwt: auth.access_token,
    })
    return { entities };

};
