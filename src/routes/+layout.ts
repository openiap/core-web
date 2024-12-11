import { auth } from "$lib/stores/auth.svelte.js";
import type { LayoutLoad } from "./$types.js";
import { browser } from "$app/environment";
export const load: LayoutLoad = async ({ data, fetch, url }) => {
	let redirect = false;
	if(browser) {
		await auth.clientinit((data as any).domain, url.origin, fetch, null);
		let code = url.searchParams.get("code");
		if(code != null && code != "") {
			try {
				const user = await auth.userManager.signinRedirectCallback();
				redirect = true;
			} catch (error) {
				redirect = true;
				console.error("error", error);				
			}
		}
	}
    return {...data, redirect};
};
