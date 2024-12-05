import type { PageServerLoad } from "./$types.js";
import { auth } from "$lib/stores/auth.svelte.js";

export const load: PageServerLoad = async ( { fetch, url, cookies } ) => {
	await auth.clientinit(url.origin, fetch, cookies );
    // console.debug("connected:", auth.isConnected, "authenticated:", auth.isAuthenticated, "loaded:", auth.isLoaded, "page.server.ts");
    return { name: (auth.profile && auth.profile.name != "" ? auth.profile.name : "Svelte") };
}