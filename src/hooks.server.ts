import type { Handle } from '@sveltejs/kit';
import { web_domain, web_client_id } from '$env/static/private';
import { auth } from '$lib/stores/auth.svelte';
export const handle: Handle = async ({ event, resolve }) => {
    let domain = process.env.web_domain;
    if(domain == null || domain == "") domain = web_domain;
    let client_id = process.env.web_client_id;
    if(client_id == null || client_id == "") client_id = web_client_id;
    const { url, cookies } = event;
    await auth.clientinit(domain, client_id, url.origin, fetch, cookies );
    event.locals = event.locals || {};
    console. debug("hooks.server.ts:", domain, "conn", auth.isConnected, "auth", auth.isAuthenticated, auth.profile?.name);
    // @ts-ignore
    event.locals.domain = domain;
    // @ts-ignore
    event.locals.client_id = client_id;
    return await resolve(event);
};