import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";
import { base } from "$app/paths";
import { pushState } from "$app/navigation";
import { error } from '@sveltejs/kit';
import { browser } from "$app/environment";
export const load: PageLoad = async ( x: any ) => {
    const { data, fetch, url } = x;
	await auth.clientinit(url.origin, fetch, x.cookies);
	if(browser) {
		let code = url.searchParams.get("code");
		if(code != null && code != "") {
			const user = await auth.userManager.signinRedirectCallback();
			pushState(base + "/", {});
		}
	}
	console.debug(auth.profile?.name, "connected:", auth.isConnected, "authenticated:", auth.isAuthenticated, "loaded:", auth.isLoaded, "layout.ts");
    return data;

};
