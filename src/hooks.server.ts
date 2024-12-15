import type { Handle } from '@sveltejs/kit';
import { domain, client_id } from '$env/static/private';
import { auth } from '$lib/stores/auth.svelte';
export const handle: Handle = async ({ event, resolve }) => {
    const { url, cookies } = event;
    await auth.clientinit(domain, client_id, url.origin, fetch, cookies );
    event.locals = event.locals || {};
    console. debug("hooks.server.ts:", "conn", auth.isConnected, "auth", auth.isAuthenticated, auth.profile?.name);
    // @ts-ignore
    event.locals.domain = domain;
    // @ts-ignore
    event.locals.client_id = client_id;
    return await resolve(event);
};