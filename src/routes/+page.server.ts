import type { PageServerLoad } from "./$types.js";
import { auth } from "$lib/stores/auth.svelte.js";

export const load: PageServerLoad = async ( { fetch, url, cookies, locals } ) => {
	await auth.clientinit((locals as any).domain, url.origin, fetch, cookies );
    return { name: (auth.profile && auth.profile.name != "" ? auth.profile.name : "Svelte") };
}