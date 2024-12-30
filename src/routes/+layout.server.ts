import { usersettings, type userSettings } from "$lib/stores/usersettings.svelte.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ fetch, cookies, url, locals, route }) => {
	const { domain, client_id } = locals as any;
	let _usersettings: userSettings = await usersettings.dbload();

	const page = (route.id != null && route.id.indexOf("/") > -1 ? route.id.split("/")[1] : "");
	if(page != "") {
		usersettings.currentpage = page;
		_usersettings.currentpage = page;
	}
	return { domain, client_id, usersettings: _usersettings };
};
