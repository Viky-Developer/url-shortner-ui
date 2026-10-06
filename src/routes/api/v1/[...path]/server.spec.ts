import { afterEach, describe, expect, it, vi } from 'vitest';
import { _buildBackendTargetUrl, _handleProxy } from './+server';

vi.mock('$env/dynamic/private', () => ({
	env: { APP_ENV: 'https://backend.test/api/v1' }
}));

describe('API v1 proxy handler', () => {
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	describe('buildBackendTargetUrl', () => {
		it('builds target URL preserving subpath and query parameters', () => {
			const url = new URL(
				'https://frontend.test/api/v1/auth/google/callback?code=abc123&state=xyz'
			);
			expect(_buildBackendTargetUrl(url)).toBe(
				'https://backend.test/api/v1/auth/google/callback?code=abc123&state=xyz'
			);
		});

		it('handles root /api/v1 path', () => {
			const url = new URL('https://app-linkpluse.netlify.app/api/v1');
			expect(_buildBackendTargetUrl(url)).toBe('https://backend.test/api/v1');
		});
	});

	describe('handleProxy', () => {
		it('forwards GET request and strips host header', async () => {
			let capturedUrl = '';
			let capturedInit: RequestInit | undefined;

			globalThis.fetch = vi.fn().mockImplementation(async (targetUrl, init) => {
				capturedUrl = String(targetUrl);
				capturedInit = init;
				return new Response(JSON.stringify({ status: 'ok' }), {
					status: 200,
					headers: {
						'content-type': 'application/json',
						'content-length': '16'
					}
				});
			});

			const request = new Request('https://frontend.test/api/v1/urls', {
				method: 'GET',
				headers: {
					host: 'frontend.test',
					authorization: 'Bearer token-123'
				}
			});

			const event = {
				request,
				url: new URL('https://frontend.test/api/v1/urls'),
				params: { path: 'urls' }
			} as unknown as Parameters<typeof _handleProxy>[0];

			const response = await _handleProxy(event);

			expect(capturedUrl).toBe('https://backend.test/api/v1/urls');
			const forwardedHeaders = new Headers(capturedInit?.headers);
			expect(forwardedHeaders.get('host')).toBeNull();
			expect(forwardedHeaders.get('authorization')).toBe('Bearer token-123');
			expect(capturedInit?.redirect).toBe('manual');

			expect(response.status).toBe(200);
			// content-length should be deleted to prevent mismatch with streamed body
			expect(response.headers.get('content-length')).toBeNull();
			expect(await response.json()).toEqual({ status: 'ok' });
		});

		it('sanitizes Set-Cookie headers and rewrites redirect location', async () => {
			globalThis.fetch = vi.fn().mockImplementation(async () => {
				const responseHeaders = new Headers();
				responseHeaders.set('location', 'https://backend.test/dashboard?logged_in=1');
				responseHeaders.append(
					'set-cookie',
					'access_token=token_abc; Domain=backend.test; Path=/; HttpOnly'
				);
				responseHeaders.append(
					'set-cookie',
					'refresh_token=token_xyz; domain=backend.test; Path=/; HttpOnly'
				);

				return new Response(null, {
					status: 302,
					headers: responseHeaders
				});
			});

			const request = new Request('https://frontend.test/api/v1/auth/google/callback?code=abc', {
				method: 'GET'
			});

			const event = {
				request,
				url: new URL('https://frontend.test/api/v1/auth/google/callback?code=abc'),
				params: { path: 'auth/google/callback' }
			} as unknown as Parameters<typeof _handleProxy>[0];

			const response = await _handleProxy(event);

			expect(response.status).toBe(302);
			expect(response.headers.get('location')).toBe('https://frontend.test/dashboard?logged_in=1');

			const cookies = response.headers.getSetCookie();
			expect(cookies).toHaveLength(2);
			expect(cookies[0]).toBe('access_token=token_abc; Path=/; HttpOnly');
			expect(cookies[1]).toBe('refresh_token=token_xyz; Path=/; HttpOnly');
		});

		it('returns 502 status if backend service fails', async () => {
			globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

			const request = new Request('https://frontend.test/api/v1/urls', {
				method: 'GET'
			});

			const event = {
				request,
				url: new URL('https://frontend.test/api/v1/urls'),
				params: { path: 'urls' }
			} as unknown as Parameters<typeof _handleProxy>[0];

			const response = await _handleProxy(event);
			expect(response.status).toBe(502);
			const body = await response.json();
			expect(body.error).toBe('Backend service unavailable.');
		});
	});
});
