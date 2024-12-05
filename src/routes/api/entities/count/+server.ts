import { error } from '@sveltejs/kit';
import { auth } from "$lib/stores/auth.svelte";

/** @type {import('./$types').RequestHandler} */
export async function POST({ url, request, cookies }) {
    try {
        await auth.clientinit(url.origin, fetch, cookies);
        let options = await request.json();
        let body = {
            queryas: "",
            query: JSON.stringify(options.query)
        }
        console.log("GET", auth.profile?.name, url.pathname);
        const response = await fetch(auth.baseurl + '/api/v1/count/' + options.collectionname, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + auth.access_token,
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        console.log("GET", auth.profile?.name, url.pathname, response.status, response.statusText);
        const results = await response.json();
        return new Response(String(JSON.stringify(results)));
    } catch (error:any) {
        console.error("POST", url.pathname, error);
        return new Response(error.message, { status: 500 });  
    }
}
