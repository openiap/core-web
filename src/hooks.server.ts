import type { Handle } from '@sveltejs/kit';
import { domain, client_id } from '$env/static/private';
import { auth } from '$lib/stores/auth.svelte';
import { usersettings } from "$lib/stores/usersettings.svelte.js";
export const handle: Handle = async ({ event, resolve }) => {
    const { url, cookies } = event;
    await auth.clientinit(domain, client_id, url.origin, fetch, cookies );
    await usersettings.dbload("hooks.server.ts"); 
    event.locals = event.locals || {};
    console. debug("hooks.server.ts:", "conn", auth.isConnected, "auth", auth.isAuthenticated, auth.profile?.name);
    // @ts-ignore
    event.locals.domain = domain;
    // @ts-ignore
    event.locals.client_id = client_id;
    return await resolve(event);
};