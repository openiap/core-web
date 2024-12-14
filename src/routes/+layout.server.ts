import type { LayoutServerLoad } from "./$types.js";
import { usersettings, type userSettings } from "$lib/stores/usersettings.svelte.js";
export const load: LayoutServerLoad = async ({ fetch, cookies, url, locals }) => {
	// url.pathname; // force loading layout on every page change. ref: https://github.com/sveltejs/kit/issues/7564#issuecomment-1313390730
	const { domain, client_id } = locals as any;
	let _usersettings: userSettings = await usersettings.dbload("layout.server.ts"); 
	return { domain, client_id, usersettings: _usersettings };
};
