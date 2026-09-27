import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyAccessToken } from './access-token';
import { googleAuthorizationUrl, handleOAuthCallback } from './oauth-callback';

vi.mock('./access-token', async (importOriginal) => ({
	...(await importOriginal<typeof import('./access-token')>()),
	verifyAccessToken: vi.fn()
}));

function createCookies(initial: Record<string, string> = {}): Cookies {
	return {
		get: vi.fn((name: string) => initial[name]),
		getAll: vi.fn(() => []),
		set: vi.fn(),
		delete: vi.fn(),
		serialize: vi.fn(() => '')
	} as unknown as Cookies;
}

describe('OAuth callback handling', () => {
	beforeEach(() => {
		vi.mocked(verifyAccessToken).mockResolvedValue({
			userId: 'user-id',
			displayName: 'Test User'
		} as Awaited<ReturnType<typeof verifyAccessToken>>);
	});

	it('creates a session from backend-issued callback tokens', async () => {
		const cookies = createCookies();
		const url = new URL(
			'https://app.example.test/auth/callback?accessToken=access-token&refreshToken=refresh-token&redirectTo=%2Fanalytics'
		);

		await expect(
			handleOAuthCallback({ url, cookies, fetch: vi.fn() as unknown as typeof fetch })
		).rejects.toMatchObject({ status: 303, location: '/analytics' });

		expect(verifyAccessToken).toHaveBeenCalledWith('access-token');
		expect(cookies.set).toHaveBeenCalledWith(
			'access_token',
			'access-token',
			expect.objectContaining({ httpOnly: true, sameSite: 'lax' })
		);
		expect(cookies.set).toHaveBeenCalledWith(
			'refresh_token',
			'refresh-token',
			expect.objectContaining({ httpOnly: true, sameSite: 'lax' })
		);
		expect(cookies.set).toHaveBeenCalledWith(
			'user_metadata',
			expect.any(String),
			expect.objectContaining({ httpOnly: true, sameSite: 'lax' })
		);
		expect(cookies.set).toHaveBeenCalledWith(
			'oauth_login_success',
			'1',
			expect.objectContaining({ httpOnly: true, maxAge: 60, sameSite: 'lax' })
		);
	});

	it('exchanges an authorization code and persists user metadata', async () => {
		const cookies = createCookies({ google_oauth_state: 'state-value' });
		const fetcher = vi.fn(async () =>
			Response.json({
				statusCode: 200,
				data: [
					{
						token: { accessToken: 'access-token', refreshToken: 'refresh-token' },
						user: { id: 'user-id', email: 'user@example.test', status: 'active' }
					}
				]
			})
		) as unknown as typeof fetch;
		const url = new URL(
			'https://app.example.test/auth/google/callback?code=oauth-code&state=state-value'
		);

		await expect(handleOAuthCallback({ url, cookies, fetch: fetcher })).rejects.toMatchObject({
			status: 303,
			location: '/dashboard'
		});

		const exchangeUrl = new URL(String(vi.mocked(fetcher).mock.calls[0]?.[0]));
		expect(exchangeUrl.origin + exchangeUrl.pathname).toBe(`${env.APP_ENV}/auth/google/callback`);
		expect(exchangeUrl.searchParams.get('code')).toBe('oauth-code');
		expect(exchangeUrl.searchParams.get('state')).toBe('state-value');
		expect(fetcher).toHaveBeenCalledWith(
			expect.any(URL),
			expect.objectContaining({
				headers: expect.objectContaining({ cookie: 'google_oauth_state=state-value' })
			})
		);
		expect(cookies.set).toHaveBeenCalledWith(
			'user_metadata',
			expect.stringContaining('active'),
			expect.any(Object)
		);
	});

	it('rejects invalid tokens without setting cookies', async () => {
		vi.mocked(verifyAccessToken).mockResolvedValue(undefined);
		const cookies = createCookies();
		const url = new URL(
			'https://app.example.test/auth/callback?access_token=invalid&refresh_token=refresh-token'
		);

		await expect(
			handleOAuthCallback({ url, cookies, fetch: vi.fn() as unknown as typeof fetch })
		).rejects.toMatchObject({
			status: 303,
			location: expect.stringContaining('/login?oauthError=')
		});
		expect(cookies.set).not.toHaveBeenCalled();
	});

	it('reports provider cancellation and blocks external redirects', async () => {
		const cookies = createCookies();
		const cancelled = new URL('https://app.example.test/auth/callback?error=access_denied');
		await expect(
			handleOAuthCallback({
				url: cancelled,
				cookies,
				fetch: vi.fn() as unknown as typeof fetch
			})
		).rejects.toMatchObject({
			status: 303,
			location: expect.stringContaining('Google+sign-in+was+cancelled')
		});

		const authorizationUrl = googleAuthorizationUrl(
			new URL('https://app.example.test/auth/google?redirectTo=https://evil.example/path')
		);
		expect(authorizationUrl.toString()).toBe(`${env.APP_ENV}/auth/google`);
	});
});
