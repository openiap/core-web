import { error } from '@sveltejs/kit';
import { auth } from "$lib/stores/auth.svelte";

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
    try {
        console.log("GET", url.pathname);
        let entities = await auth.client.ListCollections();
        return new Response(String(JSON.stringify(entities)));
    } catch (error:any) {
        console.error("POST", url.pathname, error);
        return new Response(error.message, { status: 500 });  
    }
}