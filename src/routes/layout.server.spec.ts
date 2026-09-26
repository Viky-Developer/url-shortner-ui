import type { Cookies } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { load } from './+layout.server';

describe('root layout server', () => {
	it('consumes the OAuth login success flash cookie once', async () => {
		const cookies = {
			get: vi.fn(() => '1'),
			delete: vi.fn()
		} as unknown as Cookies;

		const result = await load({ locals: { authenticated: true }, cookies } as never);

		expect(result).toMatchObject({ oauthLoginSuccess: true });
		expect(cookies.delete).toHaveBeenCalledWith('oauth_login_success', { path: '/' });
	});
});
