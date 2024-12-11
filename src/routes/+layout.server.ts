import { auth } from "$lib/stores/auth.svelte.js";
import type { LayoutServerLoad } from "./$types.js";
export const load: LayoutServerLoad = async ({ fetch, cookies, url, locals }) => {
	url.pathname; // force loading layout first. ref: https://github.com/sveltejs/kit/issues/7564#issuecomment-1313390730
	const { domain, client_id } = locals as any;
	return { domain, client_id };
};
