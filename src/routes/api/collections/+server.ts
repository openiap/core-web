import { error } from '@sveltejs/kit';
import { auth } from "$lib/stores/auth.svelte";

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
    console.log("GET", url);

    let entities = await auth.client.ListCollections();

	return new Response(String(JSON.stringify(entities)));
}