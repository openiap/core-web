import { auth } from "$lib/stores/auth.svelte.js";
import type { LayoutLoad } from "./$types.js";

export const load: LayoutLoad = async ({ data, fetch, url, route, params, parent }) => {
    const { access_token } = await parent();
    const { sha } = params;
    try {
        let item = await auth.client.FindOne<any>({ collectionname: "git", query: { _id: params.id, _type: "hash" }, jwt: access_token });
        return { item, sha };
    } catch (error) {
        return { item: null };
    }
};
