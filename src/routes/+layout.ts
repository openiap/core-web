import { auth } from "$lib/stores/auth.svelte.js";
import type { PageLoad } from "./$types.js";
import { base } from "$app/paths";
import { pushState } from "$app/navigation";
import { error } from '@sveltejs/kit';
export const load: PageLoad = async ( x: any ) => {
    const { data, params, route, url } = x;
	auth.config = data.config;
	auth.origin = data.origin;
	auth.baseurl = data.baseurl;
	auth.wsurl = data.wsurl;
	auth.clientinit();

	let code = url.searchParams.get("code");
    console.debug("Layout", x);

	try {
		if(code != null && code != "") {
			const user = await auth.userManager.signinRedirectCallback();
			pushState(base + "/", {});
		}
	} catch (err:any) {
		// error(500, err.message);
	}
	await auth.loadUserAndClient();

    return data;

};
