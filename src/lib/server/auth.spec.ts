import { env } from '$env/dynamic/private';
import { describe, expect, it, vi } from 'vitest';
import { logoutUser, refreshAccessToken, registerUser } from './auth';

describe('registerUser', () => {
	it('posts registration data and returns the typed auth response', async () => {
		const fetchMock = vi.fn(
			async () =>
				new Response(
					JSON.stringify({
						statusCode: 201,
						message: 'user registered',
						data: [
							{
								token: {
									accessToken: 'access-token',
									refreshToken: 'refresh-token'
								},
								user: {
									id: 'user-id',
									email: 'user@example.com',
									displayName: 'Jane'
								}
							}
						]
					}),
					{ status: 201, headers: { 'content-type': 'application/json' } }
				)
		);

		const result = await registerUser(fetchMock as typeof fetch, {
			email: 'user@example.com',
			password: 'Password1',
			displayName: 'Jane'
		});

		expect(result.user.id).toBe('user-id');
		expect(result.token).toEqual({
			accessToken: 'access-token',
			refreshToken: 'refresh-token'
		});
		expect(fetchMock).toHaveBeenCalledWith(
			`${env.APP_ENV}/auth/register`,
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({
					email: 'user@example.com',
					password: 'Password1',
					displayName: 'Jane'
				})
			})
		);
	});

	it('preserves a backend registration error', async () => {
		const fetchMock = vi.fn(
			async () =>
				new Response(JSON.stringify({ message: 'An account already exists for this email.' }), {
					status: 409,
					headers: { 'content-type': 'application/json' }
				})
		);

		await expect(
			registerUser(fetchMock as typeof fetch, {
				email: 'user@example.com',
				password: 'Password1'
			})
		).rejects.toMatchObject({
			status: 409,
			message: 'An account already exists for this email.'
		});
	});

	it('rejects an invalid successful response', async () => {
		const fetchMock = vi.fn(
			async () =>
				new Response(JSON.stringify({ statusCode: 200, message: 'ok', data: [{ user: {} }] }), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				})
		);

		await expect(
			registerUser(fetchMock as typeof fetch, {
				email: 'user@example.com',
				password: 'Password1'
			})
		).rejects.toMatchObject({
			status: 502
		});
	});
});

describe('refreshAccessToken', () => {
	it('sends both tokens and unwraps the refreshed token response', async () => {
		const fetchMock = vi.fn(
			async () =>
				new Response(
					JSON.stringify({
						statusCode: 200,
						message: 'token refreshed',
						data: [
							{
								accessToken: 'new-access-token',
								refreshToken: 'refresh-token'
							}
						]
					}),
					{ status: 200, headers: { 'content-type': 'application/json' } }
				)
		);

		const result = await refreshAccessToken(
			fetchMock as typeof fetch,
			'expired-access-token',
			'refresh-token'
		);

		expect(result).toEqual({
			accessToken: 'new-access-token',
			refreshToken: 'refresh-token'
		});
		expect(fetchMock).toHaveBeenCalledWith(
			`${env.APP_ENV}/auth/refresh`,
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					authorization: 'Bearer expired-access-token'
				}),
				body: JSON.stringify({ refreshToken: 'refresh-token' })
			})
		);
	});

	it('rejects a malformed successful refresh response', async () => {
		const fetchMock = vi.fn(
			async () =>
				new Response(JSON.stringify({ statusCode: 200, data: [{}] }), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				})
		);

		await expect(
			refreshAccessToken(fetchMock as typeof fetch, 'access-token', 'refresh-token')
		).rejects.toMatchObject({ status: 502 });
	});
});

describe('logoutUser', () => {
	it('posts the refresh token to the logout endpoint', async () => {
		const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));

		await logoutUser(fetchMock as typeof fetch, 'refresh-token');

		expect(fetchMock).toHaveBeenCalledWith(
			`${env.APP_ENV}/auth/logout`,
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					accept: 'application/json',
					'content-type': 'application/json'
				}),
				body: JSON.stringify({ refreshToken: 'refresh-token' })
			})
		);
	});

	it('rejects an unsuccessful logout response', async () => {
		const fetchMock = vi.fn(async () => new Response(null, { status: 401 }));

		await expect(
			logoutUser(fetchMock as typeof fetch, 'invalid-refresh-token')
		).rejects.toMatchObject({
			status: 401,
			message: 'Unable to sign out from the server.'
		});
	});
});
