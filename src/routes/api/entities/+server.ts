import { error } from '@sveltejs/kit';
import { auth } from "$lib/stores/auth.svelte";

/** @type {import('./$types').RequestHandler} */
export async function POST({ url, request, fetch, cookies }) {
    console.log("POST", url.pathname);
    await auth.clientinit(url.origin, fetch, cookies);
    console.debug("connected:", auth.isConnected, "authenticated:", auth.isAuthenticated, "loaded:", auth.isLoaded, "api/entities/server.ts");
    let options = await request.json();

    let entities = await auth.client.Query<any>(options);

	return new Response(String(JSON.stringify(entities)));
}
