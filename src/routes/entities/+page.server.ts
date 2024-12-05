import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async (x:any) => {
    const { data, fetch, cookies, url } = x;
	console.log("entities/page.server.ts", url.origin, auth.origin);
	await auth.clientinit(url.origin, fetch, cookies);
	console.debug(auth.profile?.name, "connected:", auth.isConnected, "authenticated:", auth.isAuthenticated, "loaded:", auth.isLoaded, "entities/page.server.ts");

    const response = await fetch(base + "/api/query", {
        method: "POST",
        body: JSON.stringify({
            collectionname: "entities",
            query: {},
            orderby: "",
            skip: 0,
            top: 5,
        }),
        headers: {
            "content-type": "application/json",
            "authorization": "Bearer " + auth.access_token,
        },
    });
    const entities = await response.json();

    const response2 = await fetch(base + "/api/collections", {
        method: "GET",
        headers: {
        "content-type": "application/json",
        },
    });
    const collections = await response2.json();
    
    return { ...data, entities, collections };

};
