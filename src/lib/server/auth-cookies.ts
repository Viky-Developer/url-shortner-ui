import { dev } from '$app/environment';
import type { AuthTokens } from '$lib/types/auth';
import type { Cookies } from '@sveltejs/kit';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const ACCESS_TOKEN_LIFETIME_SECONDS = 15 * 60;
export const REFRESH_TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

const baseCookieOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: !dev
};

/**
 * The expired access JWT is retained for at most the refresh lifetime because
 * the backend uses its signed session ID when processing a refresh. Its JWT
 * expiry is still enforced after 15 minutes by the request middleware.
 */
export function setAuthCookies(cookies: Cookies, tokens: AuthTokens): void {
	cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
		...baseCookieOptions,
		maxAge: REFRESH_TOKEN_LIFETIME_SECONDS
	});
	cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
		...baseCookieOptions,
		maxAge: REFRESH_TOKEN_LIFETIME_SECONDS
	});
}

export function clearAuthCookies(cookies: Cookies): void {
	cookies.delete(ACCESS_TOKEN_COOKIE, baseCookieOptions);
	cookies.delete(REFRESH_TOKEN_COOKIE, baseCookieOptions);
}
