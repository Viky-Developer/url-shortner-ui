import { describe, expect, it, vi } from 'vitest';
import { listSessions, revokeAllSessions, revokeOtherSessions, revokeSession } from './sessions';
vi.mock('$env/dynamic/private', () => ({ env: { APP_ENV: 'https://backend.test/api/v1' } }));

describe('session API', () => {
	it('reads the backend envelope and strips unrecognized fields', async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValue(
				Response.json({
					data: [
						{
							id: 2,
							deviceName: 'Chrome',
							loggedInAt: '',
							lastActiveAt: '',
							refreshToken: 'secret'
						}
					]
				})
			);
		expect(await listSessions(fetcher)).toEqual([
			{ id: 2, deviceName: 'Chrome', loggedInAt: '', lastActiveAt: '' }
		]);
		expect(fetcher).toHaveBeenCalledWith(
			'https://backend.test/api/v1/auth/sessions',
			expect.objectContaining({ method: 'GET' })
		);
	});
	it('accepts an empty list', async () => {
		expect(await listSessions(vi.fn().mockResolvedValue(Response.json({ data: [] })))).toEqual([]);
	});
	it.each([{ data: [{}] }, { data: [{ id: 1 }, { id: 1 }] }, { unexpected: [] }])(
		'rejects malformed responses',
		async (payload) => {
			await expect(
				listSessions(vi.fn().mockResolvedValue(Response.json(payload)))
			).rejects.toMatchObject({ status: 502 });
		}
	);
	it('uses DELETE for one session and POST for backend bulk routes', async () => {
		const fetcher = vi
			.fn()
			.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
		await revokeSession(fetcher, 2);
		await revokeOtherSessions(fetcher);
		await revokeAllSessions(fetcher);
		expect(fetcher.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
			['https://backend.test/api/v1/auth/sessions/2', 'DELETE'],
			['https://backend.test/api/v1/auth/sessions/revoke-others', 'POST'],
			['https://backend.test/api/v1/auth/sessions/revoke-all', 'POST']
		]);
	});
	it('surfaces backend authorization failures', async () => {
		await expect(
			listSessions(vi.fn().mockResolvedValue(new Response(null, { status: 401 })))
		).rejects.toMatchObject({ status: 401 });
	});
});
