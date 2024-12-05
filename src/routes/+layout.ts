import { auth } from "$lib/stores/auth.svelte.js";
import type { LayoutLoad } from "./$types.js";
import { base } from "$app/paths";
import { pushState } from "$app/navigation";
import { error } from '@sveltejs/kit';
import { browser } from "$app/environment";
export const load: LayoutLoad = async ( { data, fetch, url }: { data: any, fetch: any, url: URL } ) => {
	let redirect = false;
	if(browser) {
		await auth.clientinit(url.origin, fetch, null);
		let code = url.searchParams.get("code");
		if(code != null && code != "") {
			try {
				const user = await auth.userManager.signinRedirectCallback();
				// pushState(base + "/", {});
				redirect = true;
			} catch (error) {
				redirect = true;
				console.error("error", error);				
			}
		}
	}
	// console.debug("connected:", auth.isConnected, "authenticated:", auth.isAuthenticated, "loaded:", auth.isLoaded, "layout.ts");
    return {...data, redirect};
};
