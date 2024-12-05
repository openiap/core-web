import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async (x:any) => {
    const { data, fetch, cookies, url } = x;
	console.log("role/page.server.ts", url.origin, auth.origin);
	await auth.clientinit(url.origin, fetch, cookies);
	console.debug(auth.profile?.name, "connected:", auth.isConnected, "authenticated:", auth.isAuthenticated, "loaded:", auth.isLoaded, "role/page.server.ts");

    const response = await fetch(base + "/api/query", {
        method: "POST",
        body: JSON.stringify({
            collectionname: "users",
            query: {_type: "role"},
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
    return { ...data, entities };

};
