import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
	const { wsurl, protocol, domain, client_id, access_token, profile } = locals as any;
	return { wsurl, protocol, domain, client_id, access_token, profile };
};
