import { browser } from "$app/environment";
import { auth } from "$lib/stores/auth.svelte.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import type { LayoutLoad } from "./$types.js";

export const load: LayoutLoad = async ({ data, fetch, url, route, params }) => {
	const { protocol, domain, client_id, profile } = data;
	let { wsurl } = data;
	let code = "";
	if(browser) {
		if(url.searchParams) {
			code = url.searchParams.get("code") || "";
		}
		const baseurl = protocol + '://' + domain;
		wsurl = baseurl.replace("https://", "wss://").replace("http://", "ws://") + "/ws/v2";
		let access_token = data.access_token || auth.access_token;
		const { origin } = url;
		try {
			access_token = await auth.clientinit(wsurl, protocol, domain, client_id, origin, access_token, profile, fetch, null);
			await usersettings.dbload(access_token);
		} catch (error) {
		}
	}
	return { ...data, code,  };
};
