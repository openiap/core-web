import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async (x: any) => {
    const { data, fetch, cookies, url } = x;
    await auth.clientinit(url.origin, fetch, cookies);
    // console.debug("connected:", auth.isConnected, "authenticated:", auth.isAuthenticated, "loaded:", auth.isLoaded, "user/page.server.ts");
    const entities = await auth.client.Query({
        collectionname: "config",
        query: { _type: "provider" },
        orderby: "",
        skip: 0,
        top: 5,
        jwt: auth.access_token,
    })
    return { ...data, entities };

};
