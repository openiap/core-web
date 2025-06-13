import { OPENAI_API_KEY } from '$env/static/private';

import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({ locals, url, route, params }) => {
    return { OPENAI_API_KEY };
};
