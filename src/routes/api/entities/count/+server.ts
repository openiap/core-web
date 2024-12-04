import { error } from '@sveltejs/kit';
import { auth } from "$lib/stores/auth.svelte";

/** @type {import('./$types').RequestHandler} */
export async function POST({ url, request }) {
    try {
        console.log("POST", url.pathname);
        let options = await request.json();
        let entities = await auth.client.Count(options);
        return new Response(String(JSON.stringify(entities)));
    } catch (error:any) {
        console.error("POST", url.pathname, error);
        return new Response(error.message, { status: 500 });  
    }
}
