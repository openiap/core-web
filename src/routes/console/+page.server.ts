import type { PageServerLoad } from "./$types.js";
import { data } from "$lib/entities/data.svelte.js";
import { page, collectionname, query } from "./+page.svelte";

export const load: PageServerLoad = async (x) => {
    data.loadsettings(page);
    const entities = await data.GetData(page, collectionname, query);
    return { entities };
};
