import type { LayoutServerLoad } from "./$types.js";
import { usersettings, type userSettings } from "$lib/stores/usersettings.svelte.js";
import { data } from "$lib/entities/data.svelte.js";
export const load: LayoutServerLoad = async ({ fetch, cookies, url, locals, route }) => {
	// url.pathname; // force loading layout on every page change. ref: https://github.com/sveltejs/kit/issues/7564#issuecomment-1313390730
	const { domain, client_id } = locals as any;
	let _usersettings: userSettings = await usersettings.dbload();

	const page = (route.id != null && route.id.indexOf("/") > -1 ? route.id.split("/")[1] : "");
	if(page != "") {
		usersettings.currentpage = page;
		_usersettings.currentpage = page;
	}
	return { domain, client_id, usersettings: _usersettings };
};
