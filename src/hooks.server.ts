import type { Handle, HandleFetch, RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { isAccessTokenUsable, readAccessTokenUser } from '$lib/server/access-token';
import { getBackendUrl, refreshAccessToken } from '$lib/server/auth';
import {
	ACCESS_TOKEN_COOKIE,
	REFRESH_TOKEN_COOKIE,
	clearAuthCookies,
	setAuthCookies
} from '$lib/server/auth-cookies';

const LOGIN_PATH = '/login';
const PUBLIC_PATHS = new Set([LOGIN_PATH, '/signup']);
const PUBLIC_PREFIXES = ['/demo/'];

export function isPublicPath(pathname: string): boolean {
	return (
		PUBLIC_PATHS.has(pathname) ||
		pathname === '/demo' ||
		PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
	);
}

function isApiRequest(event: RequestEvent): boolean {
	return (
		event.url.pathname.startsWith('/api/') ||
		event.request.headers.get('accept')?.includes('application/json') === true
	);
}

function unauthorizedResponse(event: RequestEvent): Response {
	if (isApiRequest(event)) {
		return Response.json(
			{ statusCode: 401, error: 'Authentication is required.' },
			{ status: 401 }
		);
	}

	const destination = `${event.url.pathname}${event.url.search}`;
	return redirect(303, `${LOGIN_PATH}?redirectTo=${encodeURIComponent(destination)}`);
}

function setAuthenticatedLocals(event: RequestEvent, accessToken: string): void {
	event.locals.authenticated = true;
	event.locals.accessToken = accessToken;
	const user = readAccessTokenUser(accessToken);
	if (user) {
		(
			event.locals as RequestEvent['locals'] & { user?: ReturnType<typeof readAccessTokenUser> }
		).user = user;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.authenticated = false;
	delete event.locals.accessToken;
	delete (
		event.locals as RequestEvent['locals'] & { user?: ReturnType<typeof readAccessTokenUser> }
	).user;

	const accessToken = event.cookies.get(ACCESS_TOKEN_COOKIE);
	const refreshToken = event.cookies.get(REFRESH_TOKEN_COOKIE);

	if (accessToken && isAccessTokenUsable(accessToken)) {
		setAuthenticatedLocals(event, accessToken);
		return resolve(event);
	}

	if (isPublicPath(event.url.pathname) || event.route.id === null) {
		return resolve(event);
	}

	if (!accessToken || !refreshToken) {
		if (accessToken || refreshToken) clearAuthCookies(event.cookies);
		return unauthorizedResponse(event);
	}

	try {
		const tokens = await refreshAccessToken(event.fetch, accessToken, refreshToken);
		setAuthCookies(event.cookies, tokens);
		setAuthenticatedLocals(event, tokens.accessToken);
		return resolve(event);
	} catch {
		clearAuthCookies(event.cookies);
		return unauthorizedResponse(event);
	}
};

function isProtectedBackendRequest(requestUrl: string): boolean {
	try {
		const backendUrl = new URL(`${getBackendUrl()}/`);
		const targetUrl = new URL(requestUrl);
		const apiPath = backendUrl.pathname.replace(/\/$/, '');
		const publicAuthPaths = new Set([
			`${apiPath}/auth/register`,
			`${apiPath}/auth/login`,
			`${apiPath}/auth/forgot-password`
		]);

		return (
			targetUrl.origin === backendUrl.origin &&
			targetUrl.pathname.startsWith(`${apiPath}/`) &&
			!publicAuthPaths.has(targetUrl.pathname)
		);
	} catch {
		return false;
	}
}

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
	if (
		!event.locals.accessToken ||
		request.headers.has('authorization') ||
		!isProtectedBackendRequest(request.url)
	) {
		return fetch(request);
	}

	const headers = new Headers(request.headers);
	headers.set('authorization', `Bearer ${event.locals.accessToken}`);

	return fetch(new Request(request, { headers }));
};
