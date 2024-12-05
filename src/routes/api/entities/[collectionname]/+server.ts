import { error } from '@sveltejs/kit';
import { auth } from "$lib/stores/auth.svelte";

/** @type {import('./$types').RequestHandler} */
export async function POST({ url, request, cookies, fetch, params }) {
    try {
        let collectionname = params.collectionname;
        let body = await request.json();
        await auth.clientinit(url.origin, fetch, cookies);
        console.log("POST", auth.profile?.name, url.pathname, auth.baseurl + '/api/v1/entities/' + collectionname);
        const response = await fetch(auth.baseurl + '/api/v1/entities/' + collectionname, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Authorization': 'Bearer ' + auth.access_token,
                'content-type': 'application/json'
            }
        });
        console.log("POST", auth.profile?.name, url.pathname, response.status, response.statusText);
        const results = await response.json();
        return new Response(String(JSON.stringify(results)));
    } catch (error: any) {
        console.error("POST", url.pathname, error);
        return new Response(error.message, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ url, request, cookies, fetch, params }) {
    try {
        let collectionname = params.collectionname;
        let body = await request.json();
        await auth.clientinit(url.origin, fetch, cookies);
        console.log("PUT", auth.profile?.name, url.pathname);
        const response = await fetch(auth.baseurl + '/api/v1/entities/' + collectionname , {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: {
                'Authorization': 'Bearer ' + auth.access_token,
                'content-type': 'application/json'
            }
        });
        console.log("PUT", auth.profile?.name, url.pathname, response.status, response.statusText);
        const results = await response.json();
        return new Response(String(JSON.stringify(results)));
    } catch (error: any) {
        console.error("PUT", url.pathname, error);
        return new Response(error.message, { status: 500 });
    }
}
