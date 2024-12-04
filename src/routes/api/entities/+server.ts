import { error } from '@sveltejs/kit';
import { auth } from "$lib/stores/auth.svelte";

/** @type {import('./$types').RequestHandler} */
export async function POST({ url, request }) {
    console.log("POST", url);

    let options = await request.json();

    let entities = await auth.client.Query<any>(options);

	return new Response(String(JSON.stringify(entities)));
}
