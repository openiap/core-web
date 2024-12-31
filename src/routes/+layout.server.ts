import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
	const { protocol, domain, client_id, access_token, profile } = locals as any;
	return { protocol, domain, client_id, access_token, profile };
};
