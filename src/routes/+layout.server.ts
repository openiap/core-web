import { auth } from "$lib/stores/auth.svelte.js";
import type { LayoutServerLoad } from "./$types.js";
import { base } from "$app/paths";
import { pushState } from "$app/navigation";
import { error } from '@sveltejs/kit';
import { domain } from "$env/static/private";
export const load: LayoutServerLoad = async ({ fetch, cookies, url, locals }) => {
	console.log("layout.server.ts.load", (locals as any).domain);
	await auth.clientinit((locals as any).domain, url.origin, fetch, cookies);
	// console.debug("connected:", auth.isConnected, "authenticated:", auth.isAuthenticated, "loaded:", auth.isLoaded, "layout.server.ts");
	return { domain: (locals as any).domain };
};
