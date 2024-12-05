import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async (x:any) => {
    const { data, fetch, cookies, url } = x;
	await auth.clientinit(url.origin, fetch, cookies);
	// console.debug("connected:", auth.isConnected, "authenticated:", auth.isAuthenticated, "loaded:", auth.isLoaded, "entities/page.server.ts");
    const entities = await auth.client.Query({
        collectionname: "entities",
        query: {},
        orderby: "",
        skip: 0,
        top: 5,
        jwt: auth.access_token,
    });
    const collections = await auth.client.ListCollections({jwt: auth.access_token});
    
    return { ...data, entities, collections };

};
