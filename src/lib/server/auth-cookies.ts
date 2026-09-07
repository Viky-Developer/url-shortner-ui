import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { AuthTokens, UserResponse } from '$lib/types/auth';
import type { Cookies } from '@sveltejs/kit';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const USER_METADATA_COOKIE = 'user_metadata';

function positiveInteger(name: string, defaultValue: number): number {
	const value = env[name]?.trim();
	if (!value) return defaultValue;
	if (!/^\d+$/.test(value)) {
		throw new Error(`${name} must be configured as a positive integer.`);
	}

	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed) || parsed <= 0) {
		throw new Error(`${name} must be configured as a positive integer.`);
	}

	return parsed;
}

export const ACCESS_TOKEN_LIFETIME_SECONDS = positiveInteger('ACCESS_TOKEN_EXPIRY', 15) * 60;
export const REFRESH_TOKEN_LIFETIME_SECONDS =
	positiveInteger('REFRESH_TOKEN_EXPIRY', 7) * 24 * 60 * 60;

const baseCookieOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	// Production cookies remain secure unless an HTTP-only environment (such as
	// the local Playwright preview server) explicitly opts out.
	secure: env.AUTH_COOKIE_SECURE === 'false' ? false : !dev
};

/**
 * The expired access JWT is retained for at most the refresh lifetime because
 * the backend uses its signed session ID when processing a refresh. Its JWT
 * expiry is still enforced using ACCESS_TOKEN_EXPIRY by the request middleware.
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

export function setUserMetadataCookie(cookies: Cookies, user: UserResponse): void {
	cookies.set(
		USER_METADATA_COOKIE,
		JSON.stringify({
			passwordAgeDays: user.passwordAgeDays ?? null,
			changeSuggested: user.changeSuggested === true,
			status: user.status ?? null
		}),
		{
			...baseCookieOptions,
			maxAge: REFRESH_TOKEN_LIFETIME_SECONDS
		}
	);
}

export function getUserMetadataCookie(
	cookies: Cookies
): Pick<UserResponse, 'passwordAgeDays' | 'changeSuggested' | 'status'> {
	try {
		const value: unknown = JSON.parse(cookies.get(USER_METADATA_COOKIE) ?? 'null');
		if (!value || typeof value !== 'object') return {};
		const metadata = value as Record<string, unknown>;
		return {
			...(typeof metadata.passwordAgeDays === 'number'
				? { passwordAgeDays: metadata.passwordAgeDays }
				: {}),
			changeSuggested: metadata.changeSuggested === true,
			...(typeof metadata.status === 'string' ? { status: metadata.status } : {})
		};
	} catch {
		return {};
	}
}

export function setAccountStatusCookie(cookies: Cookies, status: string): void {
	const metadata = getUserMetadataCookie(cookies);
	cookies.set(USER_METADATA_COOKIE, JSON.stringify({ ...metadata, status }), {
		...baseCookieOptions,
		maxAge: REFRESH_TOKEN_LIFETIME_SECONDS
	});
}

export function clearAuthCookies(cookies: Cookies): void {
	cookies.delete(ACCESS_TOKEN_COOKIE, baseCookieOptions);
	cookies.delete(REFRESH_TOKEN_COOKIE, baseCookieOptions);
	cookies.delete(USER_METADATA_COOKIE, baseCookieOptions);
}
