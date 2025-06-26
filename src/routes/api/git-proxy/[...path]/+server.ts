import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url, params }) => {
	return handleProxy(request, url, params.path);
};

export const POST: RequestHandler = async ({ request, url, params }) => {
	return handleProxy(request, url, params.path);
};

function getFinalTarget(path: string | string[], url: URL): string {
	const pathname = Array.isArray(path) ? path.join('/') : path;
	const query = url.searchParams.toString();
	return `https://${pathname}${query ? '?' + query : ''}`;
}

async function handleProxy(request: Request, url: URL, path: string | string[]) {
    console.log('Handling proxy request:', request.method, path);
	const fullUrl = getFinalTarget(path, url);

	const headers = new Headers(request.headers);
	headers.delete('host');
	headers.delete('origin');

	const init: RequestInit = {
		method: request.method,
		headers,
		body: request.method === 'POST' ? await request.arrayBuffer() : undefined,
		redirect: 'manual'
	};

	const res = await fetch(fullUrl, init);

	const proxyHeaders = new Headers(res.headers);
	proxyHeaders.set('Access-Control-Allow-Origin', '*');
	proxyHeaders.set('Access-Control-Allow-Headers', '*');

	return new Response(res.body, {
		status: res.status,
		headers: proxyHeaders
	});
}

export const OPTIONS: RequestHandler = () => {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
			'Access-Control-Allow-Headers': '*'
		}
	});
};
