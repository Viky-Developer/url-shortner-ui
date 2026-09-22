import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelAccountDeletion, scheduleAccountDeletion } from './account';

vi.mock('$env/dynamic/private', () => ({ env: { APP_ENV: 'https://api.example.test/api/v1' } }));

describe('account API', () => {
	const fetcher = vi.fn();

	beforeEach(() => vi.resetAllMocks());

	it('schedules deletion without deleting immediately in the client', async () => {
		fetcher.mockResolvedValue(new Response(null, { status: 204 }));
		await scheduleAccountDeletion(fetcher);
		expect(fetcher).toHaveBeenCalledWith(
			'https://api.example.test/api/v1/account',
			expect.objectContaining({
				method: 'DELETE',
				body: JSON.stringify({ confirmation: 'DELETE' })
			})
		);
	});

	it('preserves the backend error message', async () => {
		fetcher.mockResolvedValue(
			Response.json(
				{ statusCode: 409, message: 'account is not pending deletion' },
				{ status: 409 }
			)
		);

		await expect(cancelAccountDeletion(fetcher)).rejects.toMatchObject({
			status: 409,
			message: 'account is not pending deletion'
		});
	});

	it('cancels scheduled deletion', async () => {
		fetcher.mockResolvedValue(new Response(null, { status: 204 }));
		await cancelAccountDeletion(fetcher);
		expect(fetcher).toHaveBeenCalledWith(
			'https://api.example.test/api/v1/account/cancel-deletion',
			expect.objectContaining({ method: 'POST' })
		);
	});
});
