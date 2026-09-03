import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { env } from '$env/dynamic/private';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '$lib/server/auth-cookies';
import { POST } from './+server';

function createCookies(refreshToken?: string): Cookies {
	return {
		get: vi.fn((name: string) => (name === REFRESH_TOKEN_COOKIE ? refreshToken : undefined)),
		getAll: vi.fn(() => []),
		set: vi.fn(),
		delete: vi.fn(),
		serialize: vi.fn(() => '')
	} as unknown as Cookies;
}

describe('POST /logout', () => {
	it('revokes the refresh token, clears cookies, and redirects to login', async () => {
		const cookies = createCookies('refresh-token');
		const fetcher = vi.fn(async () => new Response(null, { status: 204 }));

		await expect(
			POST({ cookies, fetch: fetcher } as unknown as RequestEvent)
		).rejects.toMatchObject({ status: 303, location: '/login' });

		expect(fetcher).toHaveBeenCalledWith(
			`${env.APP_ENV}/auth/logout`,
			expect.objectContaining({ body: JSON.stringify({ refreshToken: 'refresh-token' }) })
		);
		expect(cookies.delete).toHaveBeenCalledWith(
			ACCESS_TOKEN_COOKIE,
			expect.objectContaining({ path: '/' })
		);
		expect(cookies.delete).toHaveBeenCalledWith(
			REFRESH_TOKEN_COOKIE,
			expect.objectContaining({ path: '/' })
		);
	});

	it('still clears local cookies when backend logout fails', async () => {
		const cookies = createCookies('refresh-token');
		const fetcher = vi.fn(async () => new Response(null, { status: 503 }));

		await expect(
			POST({ cookies, fetch: fetcher } as unknown as RequestEvent)
		).rejects.toMatchObject({ status: 303, location: '/login' });

		expect(cookies.delete).toHaveBeenCalledTimes(2);
	});
});
