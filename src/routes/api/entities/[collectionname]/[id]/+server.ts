import { error } from '@sveltejs/kit';
import { auth } from "$lib/stores/auth.svelte";

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url, cookies, fetch, params }) {
    try {
        let collectionname = params.collectionname;
        let id = params.id;
        await auth.clientinit(url.origin, fetch, cookies);
        console.log("DELETE", auth.profile?.name, url.pathname);
        const response = await fetch(auth.baseurl + '/api/v1/entities/' + collectionname + "/" + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + auth.access_token,
                'content-type': 'application/json'
            }
        });
        console.log("DELETE", auth.profile?.name, url.pathname, response.status, response.statusText);
        const results = await response.json();
        return new Response(String(JSON.stringify(results)));
    } catch (error: any) {
        console.error("DELETE", url.pathname, error);
        return new Response(error.message, { status: 500 });
    }
}