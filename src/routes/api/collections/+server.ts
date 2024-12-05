import { error } from '@sveltejs/kit';
import { auth } from "$lib/stores/auth.svelte";

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, cookies, fetch }) {
    try {
        await auth.clientinit(url.origin, fetch, cookies);
        console.log("GET", auth.profile?.name, url.pathname);
        const response = await fetch(auth.baseurl + '/api/v1/collections', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + auth.access_token,
                'content-type': 'application/json'
            }
        });
        console.log("GET", auth.profile?.name, url.pathname, response.status, response.statusText);
        const results = await response.json();
        return new Response(String(JSON.stringify(results)));
    } catch (error: any) {
        console.error("POST", url.pathname, error);
        return new Response(error.message, { status: 500 });
    }
}