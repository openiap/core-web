import { auth } from "$lib/stores/auth.svelte.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ( { fetch, url, cookies, locals } ) => {
    return { name: (auth.profile && auth.profile.name != "" ? auth.profile.name : "Svelte") };
}