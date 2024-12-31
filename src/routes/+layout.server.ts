import { usersettings, type userSettings } from "$lib/stores/usersettings.svelte.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ fetch, cookies, url, locals, route }) => {
	const { protocol, domain, client_id, access_token, profile } = locals as any;
	return { protocol, domain, client_id, access_token, profile };
};
