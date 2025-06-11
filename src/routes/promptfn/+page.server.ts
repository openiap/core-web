import { wsurl, docker_registry, jwt, OPENAI_API_KEY } from '$env/static/private';

import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({ locals, url, route, params }) => {
    return { wsurl, docker_registry, jwt, OPENAI_API_KEY };
};
