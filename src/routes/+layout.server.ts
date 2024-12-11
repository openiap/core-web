import { auth } from "$lib/stores/auth.svelte.js";
import type { LayoutServerLoad } from "./$types.js";
export const load: LayoutServerLoad = async ({ fetch, cookies, url, locals }) => {
	await auth.clientinit((locals as any).domain, url.origin, fetch, cookies);
	return { domain: (locals as any).domain };
};
