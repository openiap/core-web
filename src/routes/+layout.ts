import { browser } from "$app/environment";
import { base } from "$app/paths";
import { data as datacomponent } from "$lib/entities/data.svelte.js";
import { auth } from "$lib/stores/auth.svelte.js";
import type { userSettings } from "$lib/stores/usersettings.svelte.js";
import { usersettings } from "$lib/stores/usersettings.svelte.js";
import type { LayoutLoad } from "./$types.js";

export const load: LayoutLoad = async ({ data, fetch, url, route }) => {
	const { protocol, domain, client_id, access_token, profile } = data;
	let redirect = false;
	await auth.clientinit(protocol, domain, client_id, url.origin, access_token, profile, fetch, null);
	if (browser) {
		let code = url.searchParams.get("code");
		if (code != null && code != "") {
			try {
				const user = await auth.userManager.signinRedirectCallback();
				redirect = true;
			} catch (error) {
				redirect = true;
			}
		}
	}

	let _usersettings: userSettings = await usersettings.dbload();
	// const shortpage = (route.id != null && route.id.indexOf("/") > -1 ? route.id.split("/")[1] : "");
	// if (shortpage != "") {
	// 	usersettings.currentpage = shortpage;
	// 	_usersettings.currentpage = shortpage;
	// }

	const page = url.pathname;
	let entities: any[] = [];
	datacomponent.loadsettings(page);
	switch (page) {
		case base + "/user":
			entities = await datacomponent.GetData(page, "users", { _type: "user" });
			break;
		case base + "/role":
			entities = await datacomponent.GetData(page, "users", { _type: "role" });
			break;
		default:
			break;
	}
	return { ...data, redirect, entities, usersettings: _usersettings };
};
