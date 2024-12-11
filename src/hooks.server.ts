import type { Handle } from '@sveltejs/kit';
import { domain } from '$env/static/private';

export const handle: Handle = async ({ event, resolve }) => {

    const { url, cookies } = event;
    event.locals = event.locals || {};

    // @ts-ignore
    event.locals.domain = domain;
    return await resolve(event);
};