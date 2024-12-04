import { auth } from "$lib/stores/auth.svelte.js";
import type { LayoutServerLoad } from "./$types.js";
import { base } from "$app/paths";
import { pushState } from "$app/navigation";
import { error } from '@sveltejs/kit';
export const load: LayoutServerLoad = async (x:any) => {
    const { data, fetch, cookies, url } = x;
	console.log("layout url", url.origin, auth.origin);
	await auth.clientinit(url.origin, fetch, cookies);
	let code = url.searchParams.get("code");
	try {
		if(code != null && code != "") {
			const user = await auth.userManager.signinRedirectCallback();
			pushState(base + "/", {});
		}
	} catch (err:any) {
		// error(500, err.message);
	}
	console.debug("connected:", auth.isConnected, "authenticated:", auth.isAuthenticated, "loaded:", auth.isLoaded, "layout.server.ts");
    return data;

};
