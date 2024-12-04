import { auth } from "$lib/stores/auth.svelte.js";
import type { LayoutServerLoad } from "./$types.js";
import { base } from "$app/paths";
import { pushState } from "$app/navigation";
import { error } from '@sveltejs/kit';
export const load: LayoutServerLoad = async (x:any) => {
	console.log("***************");
	console.log("SERVER.LAYOUT.TS LOAD");
    const { data, fetch, cookies, url } = x;
	// console.log("cookies", cookies.getAll());

	console.log("layout url", url.origin, auth.origin);
	// console.debug("server.layout.ts: am i connected now ?", auth.isLoaded, auth.isAuthenticated);
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
	console.debug("server.layout.ts: am i connected now ?", auth.isLoaded, auth.isAuthenticated);
	console.log("***************");
    return data;

};
