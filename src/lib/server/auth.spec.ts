import { env } from '$env/dynamic/private';
import { describe, expect, it, vi } from 'vitest';
import { registerUser } from './auth';

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
								accessToken: 'access-token',
								refreshToken: 'refresh-token',
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
