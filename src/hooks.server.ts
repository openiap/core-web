import { web_client_id, web_domain, web_protocol } from '$env/static/private';
import { auth } from '$lib/stores/auth.svelte';
import type { Handle, ServerInit } from '@sveltejs/kit';

export const init: ServerInit = async () => {
    let protocol = process.env.web_protocol;
    if (protocol == null || protocol == "") protocol = web_protocol;
    let domain = process.env.web_domain;
    if (domain == null || domain == "") domain = web_domain;

    const baseurl = protocol + '://' + domain;
    let wsurl = baseurl.replace("https://", "wss://").replace("http://", "ws://") + "/ws/v2";
    if(process.env.web_wsapiurl != null && process.env.web_wsapiurl != "") {
        wsurl = process.env.web_wsapiurl;
    }
    try {
        await auth.serverinit(wsurl, protocol, domain);
    } catch (error) {
        console.log("**** serverinit error", error);
    }
}
export const handle: Handle = async ({ event, resolve }) => {
    let protocol = process.env.web_protocol;
    if (protocol == null || protocol == "") protocol = web_protocol;
    let domain = process.env.web_domain;
    if (domain == null || domain == "") domain = web_domain;
    let client_id = process.env.web_client_id;
    if (client_id == null || client_id == "") client_id = web_client_id;
    const { url, cookies } = event;
    let access_token = "";
    const baseurl = protocol + '://' + domain;
    let wsurl = baseurl.replace("https://", "wss://").replace("http://", "ws://") + "/ws/v2";
    if(process.env.web_wsapiurl != null && process.env.web_wsapiurl != "") {
        wsurl = process.env.web_wsapiurl;
    }
    try {
        access_token = await auth.serverloaduser(client_id, url.origin, cookies);
    } catch (error) {
    }
    event.locals = event.locals || {};
    // @ts-ignore
    event.locals.wsurl = wsurl;
    // @ts-ignore
    event.locals.protocol = protocol;
    // @ts-ignore
    event.locals.domain = domain;
    // @ts-ignore
    event.locals.client_id = client_id;
    // @ts-ignore
    event.locals.access_token = access_token;
    // @ts-ignore
    event.locals.profile = auth.profile;
    
    return await resolve(event);
};