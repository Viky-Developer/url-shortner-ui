import { env } from '$env/dynamic/private';
import type { Cookies, Handle, HandleFetch, RequestEvent } from '@sveltejs/kit';
import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
	ACCESS_TOKEN_COOKIE,
	ACCESS_TOKEN_LIFETIME_SECONDS,
	REFRESH_TOKEN_COOKIE
} from '$lib/server/auth-cookies';
import { handle, handleFetch } from './hooks.server';

function testJwtSecret(): string {
	if (!env.JWT_SECRET_KEY) throw new Error('JWT_SECRET_KEY must be configured for tests.');
	return env.JWT_SECRET_KEY;
}

function createToken(iat: number, exp: number, claims: Record<string, unknown> = {}): string {
	const encode = (value: Record<string, unknown>) =>
		Buffer.from(JSON.stringify(value)).toString('base64url');
	const userId = typeof claims.user_id === 'string' ? claims.user_id : 'user-id';
	const header = encode({ alg: 'HS256', typ: 'JWT' });
	const payload = encode({
		sub: userId,
		user_id: userId,
		session_id: 17,
		session_version: iat,
		...claims,
		iat,
		exp
	});
	const unsignedToken = `${header}.${payload}`;
	const signature = createHmac('sha256', testJwtSecret()).update(unsignedToken).digest('base64url');

	return `${unsignedToken}.${signature}`;
}

function createCookies(initial: Record<string, string> = {}) {
	const values = new Map(Object.entries(initial));
	const cookies = {
		get: vi.fn((name: string) => values.get(name)),
		getAll: vi.fn(() => []),
		set: vi.fn((name: string, value: string) => values.set(name, value)),
		delete: vi.fn((name: string) => values.delete(name)),
		serialize: vi.fn(() => '')
	} as unknown as Cookies;

	return { cookies, values };
}

function createEvent(
	pathname: string,
	options: {
		cookies?: Cookies;
		fetcher?: typeof fetch;
		accept?: string;
		routeId?: string | null;
	} = {}
): RequestEvent {
	const url = new URL(pathname, 'https://app.example.test');

	return {
		cookies: options.cookies ?? createCookies().cookies,
		fetch: options.fetcher ?? vi.fn(async () => new Response()),
		locals: {},
		request: new Request(url, {
			headers: { accept: options.accept ?? 'text/html' }
		}),
		route: { id: options.routeId === undefined ? pathname : options.routeId },
		url
	} as unknown as RequestEvent;
}

async function runHandle(event: RequestEvent, resolve = vi.fn(async () => new Response('ok'))) {
	const response = await handle({ event, resolve } as unknown as Parameters<Handle>[0]);
	return { response, resolve };
}

describe('authentication middleware', () => {
	it.each(['/login', '/signup'])('allows public %s requests without tokens', async (pathname) => {
		const { response, resolve } = await runHandle(createEvent(pathname));

		expect(response.status).toBe(200);
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('allows a protected route with a usable access token', async () => {
		const now = Math.floor(Date.now() / 1000);
		const accessToken = createToken(now, now + ACCESS_TOKEN_LIFETIME_SECONDS, {
			user_id: 'user-id',
			display_name: 'Alex Rivera',
			email: 'alex@example.com'
		});
		const { cookies } = createCookies({ [ACCESS_TOKEN_COOKIE]: accessToken });
		const event = createEvent('/', { cookies });

		const { response, resolve } = await runHandle(event);

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(resolve).toHaveBeenCalledOnce();
		expect(event.locals).toMatchObject({
			authenticated: true,
			accessToken,
			user: {
				id: 'user-id',
				displayName: 'Alex Rivera',
				email: 'alex@example.com'
			}
		});
	});

	it('protects the dashboard when authentication is missing', async () => {
		await expect(runHandle(createEvent('/'))).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	it('refreshes an expired access token before resolving a protected route', async () => {
		const now = Math.floor(Date.now() / 1000);
		const expiredAccessToken = createToken(now - ACCESS_TOKEN_LIFETIME_SECONDS - 60, now - 60);
		const newAccessToken = createToken(now, now + ACCESS_TOKEN_LIFETIME_SECONDS, {
			user_id: 'refreshed-user-id',
			display_name: 'Refreshed User'
		});
		const { cookies, values } = createCookies({
			[ACCESS_TOKEN_COOKIE]: expiredAccessToken,
			[REFRESH_TOKEN_COOKIE]: 'refresh-token'
		});
		const fetcher = vi.fn(async () =>
			Response.json({
				statusCode: 200,
				message: 'token refreshed',
				data: [
					{
						accessToken: newAccessToken,
						refreshToken: 'refresh-token'
					}
				]
			})
		) as unknown as typeof fetch;
		const event = createEvent('/analytics', { cookies, fetcher });

		const { response, resolve } = await runHandle(event);

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(resolve).toHaveBeenCalledOnce();
		expect(values.get(ACCESS_TOKEN_COOKIE)).toBe(newAccessToken);
		expect(event.locals).toMatchObject({
			authenticated: true,
			accessToken: newAccessToken,
			user: {
				id: 'refreshed-user-id',
				displayName: 'Refreshed User'
			}
		});
		expect(fetcher).toHaveBeenCalledWith(
			`${env.APP_ENV}/auth/refresh`,
			expect.objectContaining({
				headers: expect.objectContaining({
					authorization: `Bearer ${expiredAccessToken}`
				})
			})
		);
	});

	it('rejects a refreshed access token with an invalid signature', async () => {
		const now = Math.floor(Date.now() / 1000);
		const expiredAccessToken = createToken(now - ACCESS_TOKEN_LIFETIME_SECONDS - 60, now - 60);
		const validNewAccessToken = createToken(now, now + ACCESS_TOKEN_LIFETIME_SECONDS);
		const [header, payload] = validNewAccessToken.split('.');
		const { cookies } = createCookies({
			[ACCESS_TOKEN_COOKIE]: expiredAccessToken,
			[REFRESH_TOKEN_COOKIE]: 'refresh-token'
		});
		const fetcher = vi.fn(async () =>
			Response.json({
				statusCode: 200,
				message: 'token refreshed',
				data: [
					{
						accessToken: `${header}.${payload}.invalid-signature`,
						refreshToken: 'refresh-token'
					}
				]
			})
		) as unknown as typeof fetch;
		const event = createEvent('/analytics', { cookies, fetcher });
		const resolve = vi.fn(async () => new Response('ok'));

		await expect(runHandle(event, resolve)).rejects.toMatchObject({
			status: 303,
			location: '/login?redirectTo=%2Fanalytics'
		});
		expect(resolve).not.toHaveBeenCalled();
		expect(cookies.delete).toHaveBeenCalledTimes(2);
	});

	it('clears an invalid session and redirects browser navigation to login', async () => {
		const { cookies } = createCookies({
			[ACCESS_TOKEN_COOKIE]: 'invalid-access-token',
			[REFRESH_TOKEN_COOKIE]: 'invalid-refresh-token'
		});
		const fetcher = vi.fn(async () =>
			Response.json({ error: 'unauthorized' }, { status: 401 })
		) as unknown as typeof fetch;
		const event = createEvent('/analytics?period=week', { cookies, fetcher });

		await expect(runHandle(event)).rejects.toMatchObject({
			status: 303,
			location: '/login?redirectTo=%2Fanalytics%3Fperiod%3Dweek'
		});
		expect(cookies.delete).toHaveBeenCalledTimes(2);
	});

	it('returns JSON 401 for an unauthenticated protected API request', async () => {
		const event = createEvent('/api/links', {
			accept: 'application/json',
			routeId: '/api/links'
		});

		const { response, resolve } = await runHandle(event);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			statusCode: 401,
			error: 'Authentication is required.'
		});
		expect(resolve).not.toHaveBeenCalled();
	});
});

describe('authenticated server fetch', () => {
	it('adds the access token only to protected backend requests', async () => {
		const event = createEvent('/analytics');
		event.locals = { authenticated: true, accessToken: 'access-token' };
		const request = new Request(`${env.APP_ENV}/urls`);
		const fetcher = vi.fn(async (requestToForward: Request) => new Response(requestToForward.url));

		await handleFetch({ event, request, fetch: fetcher } as unknown as Parameters<HandleFetch>[0]);

		const forwardedRequest = fetcher.mock.calls[0]?.[0];
		expect(forwardedRequest).toBeInstanceOf(Request);
		expect((forwardedRequest as Request).headers.get('authorization')).toBe('Bearer access-token');
	});

	it('does not send the access token to another origin', async () => {
		const event = createEvent('/analytics');
		event.locals = { authenticated: true, accessToken: 'access-token' };
		const request = new Request('https://untrusted.example.test/resource');
		const fetcher = vi.fn(async (requestToForward: Request) => new Response(requestToForward.url));

		await handleFetch({ event, request, fetch: fetcher } as unknown as Parameters<HandleFetch>[0]);

		expect(fetcher).toHaveBeenCalledWith(request);
		expect(request.headers.has('authorization')).toBe(false);
	});

	it('does not send an existing access token to public authentication endpoints', async () => {
		const event = createEvent('/signup');
		event.locals = { authenticated: true, accessToken: 'access-token' };
		const request = new Request(`${env.APP_ENV}/auth/register`);
		const fetcher = vi.fn(async (requestToForward: Request) => new Response(requestToForward.url));

		await handleFetch({ event, request, fetch: fetcher } as unknown as Parameters<HandleFetch>[0]);

		expect(fetcher).toHaveBeenCalledWith(request);
		expect(request.headers.has('authorization')).toBe(false);
	});
});
