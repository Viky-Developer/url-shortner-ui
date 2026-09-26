import { verifyAccessToken } from '$lib/server/access-token';
import { getBackendUrl } from '$lib/server/auth';
import { setAuthCookies, setUserMetadataCookie } from '$lib/server/auth-cookies';
import type { AuthTokens, UserResponse } from '$lib/types/auth';
import { redirect, type Cookies } from '@sveltejs/kit';

const BACKEND_GOOGLE_CALLBACK_PATH = '/auth/google/callback';
const FRONTEND_CALLBACK_PATHS = ['/auth/callback', '/auth/google/callback'];
const DEFAULT_REDIRECT = '/dashboard';
const OAUTH_LOGIN_SUCCESS_COOKIE = 'oauth_login_success';

type OAuthCallbackEvent = {
	url: URL;
	cookies: Cookies;
	fetch: typeof globalThis.fetch;
};

type CompletedOAuth = { token: AuthTokens; user: UserResponse };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function safeRedirectTarget(url: URL): string {
	const requestedTarget = url.searchParams.get('redirectTo');
	if (!requestedTarget) return DEFAULT_REDIRECT;

	try {
		const target = new URL(requestedTarget, url.origin);
		if (
			target.origin !== url.origin ||
			['/login', '/signup', ...FRONTEND_CALLBACK_PATHS].includes(target.pathname)
		) {
			return DEFAULT_REDIRECT;
		}
		return `${target.pathname}${target.search}${target.hash}`;
	} catch {
		return DEFAULT_REDIRECT;
	}
}

function oauthFailure(message: string): never {
	return redirect(303, `/login?${new URLSearchParams({ oauthError: message })}`);
}

function readUser(value: unknown): UserResponse | undefined {
	if (!isRecord(value)) return undefined;
	if (
		!(typeof value.id === 'string' || value.id === null) ||
		!(typeof value.email === 'string' || value.email === null)
	) {
		return undefined;
	}
	return value as unknown as UserResponse;
}

function readAuthResponse(payload: unknown): CompletedOAuth | undefined {
	const candidate = isRecord(payload) && Array.isArray(payload.data) ? payload.data[0] : payload;
	if (!isRecord(candidate) || !isRecord(candidate.token)) return undefined;

	const accessToken = readString(candidate.token.accessToken);
	const refreshToken = readString(candidate.token.refreshToken);
	const user = readUser(candidate.user);
	if (!accessToken || !refreshToken || !user) return undefined;
	return { token: { accessToken, refreshToken }, user };
}

function tokensFromUrl(url: URL): { accessToken: string; refreshToken: string } | undefined {
	const accessToken =
		url.searchParams.get('accessToken')?.trim() || url.searchParams.get('access_token')?.trim();
	const refreshToken =
		url.searchParams.get('refreshToken')?.trim() || url.searchParams.get('refresh_token')?.trim();
	return accessToken && refreshToken ? { accessToken, refreshToken } : undefined;
}

async function exchangeAuthorizationCode(
	fetcher: typeof globalThis.fetch,
	url: URL,
	cookies: Cookies
): Promise<CompletedOAuth | undefined> {
	if (!url.searchParams.get('code')) return undefined;

	const callbackUrl = new URL(`${getBackendUrl()}${BACKEND_GOOGLE_CALLBACK_PATH}`);
	for (const key of ['code', 'state', 'scope', 'authuser', 'prompt']) {
		const value = url.searchParams.get(key);
		if (value) callbackUrl.searchParams.set(key, value);
	}

	let response: Response;
	try {
		const oauthState = cookies.get('google_oauth_state');
		response = await fetcher(callbackUrl, {
			headers: {
				accept: 'application/json',
				...(oauthState ? { cookie: `google_oauth_state=${encodeURIComponent(oauthState)}` } : {})
			}
		});
	} catch {
		oauthFailure('Google sign-in is temporarily unavailable. Please try again.');
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		oauthFailure('Google sign-in returned an invalid response. Please try again.');
	}

	if (!response.ok) oauthFailure('Google sign-in could not be completed. Please try again.');
	return readAuthResponse(payload);
}

export function googleAuthorizationUrl(url: URL): URL {
	const authorizationUrl = new URL(`${getBackendUrl()}/auth/google`);
	const redirectTo = safeRedirectTarget(url);
	if (redirectTo !== DEFAULT_REDIRECT) authorizationUrl.searchParams.set('redirectTo', redirectTo);
	return authorizationUrl;
}

export async function handleOAuthCallback({ url, cookies, fetch: fetcher }: OAuthCallbackEvent) {
	const providerError = url.searchParams.get('error');
	if (providerError) {
		oauthFailure(
			providerError === 'access_denied'
				? 'Google sign-in was cancelled.'
				: 'Google sign-in could not be completed. Please try again.'
		);
	}

	const directTokens = tokensFromUrl(url);
	const auth = directTokens ? undefined : await exchangeAuthorizationCode(fetcher, url, cookies);
	const tokens = directTokens ?? auth?.token;
	if (!tokens) oauthFailure('Google sign-in did not return a session. Please try again.');
	const claims = await verifyAccessToken(tokens.accessToken);
	if (!claims) {
		oauthFailure('Google sign-in returned an invalid session. Please try again.');
	}

	setAuthCookies(cookies, tokens);
	setUserMetadataCookie(
		cookies,
		auth?.user ?? {
			id: claims.userId,
			email: claims.email ?? null,
			displayName: claims.displayName ?? null,
			role: claims.role ?? null
		}
	);
	cookies.set(OAUTH_LOGIN_SUCCESS_COOKIE, '1', {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		maxAge: 60
	});
	return redirect(303, safeRedirectTarget(url));
}
