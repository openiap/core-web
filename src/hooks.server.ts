import { web_client_id, web_domain } from '$env/static/private';
import { auth } from '$lib/stores/auth.svelte';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    let domain = process.env.web_domain;
    if(domain == null || domain == "") domain = web_domain;
    let client_id = process.env.web_client_id;
    if(client_id == null || client_id == "") client_id = web_client_id;
    const { url, cookies } = event;
    await auth.clientinit(domain, client_id, url.origin, fetch, cookies );
    event.locals = event.locals || {};
    // @ts-ignore
    event.locals.domain = domain;
    // @ts-ignore
    event.locals.client_id = client_id;
    return await resolve(event);
};