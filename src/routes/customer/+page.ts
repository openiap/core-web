import { auth } from "$lib/stores/auth.svelte.js";
import { base } from "$app/paths";
import type { PageLoad } from "./$types.js";
export const load: PageLoad = async (x: any) => {
    const { data, fetch, cookies, url } = x;

    return data;

};
