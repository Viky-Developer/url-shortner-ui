import type { Cookies } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import {
	ACCESS_TOKEN_COOKIE,
	REFRESH_TOKEN_COOKIE,
	REFRESH_TOKEN_LIFETIME_SECONDS,
	clearAuthCookies,
	setAuthCookies
} from './auth-cookies';

function createCookies(): Cookies {
	return {
		get: vi.fn(),
		getAll: vi.fn(() => []),
		set: vi.fn(),
		delete: vi.fn(),
		serialize: vi.fn(() => '')
	} as unknown as Cookies;
}

describe('authentication cookies', () => {
	it('stores both tokens securely for the seven-day refresh lifetime', () => {
		const cookies = createCookies();

		setAuthCookies(cookies, {
			accessToken: 'access-token',
			refreshToken: 'refresh-token'
		});

		expect(cookies.set).toHaveBeenCalledTimes(2);
		expect(cookies.set).toHaveBeenCalledWith(
			ACCESS_TOKEN_COOKIE,
			'access-token',
			expect.objectContaining({
				httpOnly: true,
				maxAge: REFRESH_TOKEN_LIFETIME_SECONDS,
				path: '/',
				sameSite: 'lax'
			})
		);
		expect(cookies.set).toHaveBeenCalledWith(
			REFRESH_TOKEN_COOKIE,
			'refresh-token',
			expect.objectContaining({ maxAge: 7 * 24 * 60 * 60 })
		);
	});

	it('clears both cookies when authentication becomes invalid', () => {
		const cookies = createCookies();

		clearAuthCookies(cookies);

		expect(cookies.delete).toHaveBeenCalledWith(
			ACCESS_TOKEN_COOKIE,
			expect.objectContaining({ path: '/' })
		);
		expect(cookies.delete).toHaveBeenCalledWith(
			REFRESH_TOKEN_COOKIE,
			expect.objectContaining({ path: '/' })
		);
	});
});
