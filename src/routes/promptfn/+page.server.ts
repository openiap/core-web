export const ssr = false;
export const prerender = false;
import { OPENAI_API_KEY } from '$env/static/private';

import type { PageServerLoad } from "./$types.js";
export const load: PageServerLoad = async ({ locals, url, route, params }) => {
    if(process.env.OPENAI_API_KEY != null) {
        return { OPENAI_API_KEY: process.env.OPENAI_API_KEY };
    }
    return { OPENAI_API_KEY };
};
