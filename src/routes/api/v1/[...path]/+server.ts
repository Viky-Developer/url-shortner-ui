import type { RequestHandler } from './$types';
import { getBackendUrl } from '$lib/server/auth';

export function _buildBackendTargetUrl(url: URL): string {
	const backendBase = getBackendUrl();
	const subPath = url.pathname.replace(/^\/api\/v1/, '');
	return `${backendBase}${subPath}${url.search}`;
}

export const _handleProxy: RequestHandler = async ({ request, url }) => {
	const targetUrl = _buildBackendTargetUrl(url);

	const forwardHeaders = new Headers(request.headers);
	forwardHeaders.delete('host');
	forwardHeaders.delete('connection');

	const hasBody = !['GET', 'HEAD'].includes(request.method);

	const init: RequestInit & { duplex?: 'half' } = {
		method: request.method,
		headers: forwardHeaders,
		redirect: 'manual',
		body: hasBody ? request.body : undefined,
		duplex: 'half'
	};

	try {
		const response = await fetch(targetUrl, init);

		const responseHeaders = new Headers(response.headers);
		responseHeaders.delete('content-encoding');
		responseHeaders.delete('content-length');

		// Sanitize Set-Cookie headers so cookies scope to current frontend domain
		const cookies = responseHeaders.getSetCookie();
		if (cookies.length > 0) {
			responseHeaders.delete('set-cookie');
			for (const cookie of cookies) {
				const sanitizedCookie = cookie.replace(/;\s*domain=[^;]+/gi, '');
				responseHeaders.append('set-cookie', sanitizedCookie);
			}
		}

		// Rewrite backend Location header to frontend origin if needed
		const location = responseHeaders.get('location');
		if (location) {
			try {
				const parsedLoc = new URL(location, targetUrl);
				const backendOrigin = new URL(targetUrl).origin;
				if (parsedLoc.origin === backendOrigin) {
					const rewritten = new URL(
						`${parsedLoc.pathname}${parsedLoc.search}${parsedLoc.hash}`,
						url.origin
					);
					responseHeaders.set('location', rewritten.href);
				}
			} catch {
				// Keep existing location if parsing fails
			}
		}

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders
		});
	} catch (err) {
		return Response.json(
			{
				statusCode: 502,
				error: 'Backend service unavailable.',
				message: err instanceof Error ? err.message : String(err)
			},
			{ status: 502 }
		);
	}
};

export const GET: RequestHandler = _handleProxy;
export const POST: RequestHandler = _handleProxy;
export const PUT: RequestHandler = _handleProxy;
export const DELETE: RequestHandler = _handleProxy;
export const PATCH: RequestHandler = _handleProxy;
export const HEAD: RequestHandler = _handleProxy;
export const fallback: RequestHandler = _handleProxy;
