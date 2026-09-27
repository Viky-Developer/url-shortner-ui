import { describe, expect, it, vi } from 'vitest';
import { updateShortURLRequest } from './short-urls';

describe('updateShortURLRequest', () => {
	it('sends URL updates as JSON with PATCH', async () => {
		const fetcher = vi.fn(async () => Response.json({ success: true })) as unknown as typeof fetch;
		const request = { title: 'Updated', status: 1 as const };

		await updateShortURLRequest(fetcher, '/my-links/url%2F7', request);

		expect(fetcher).toHaveBeenCalledWith('/my-links/url%2F7', {
			method: 'PATCH',
			headers: { accept: 'application/json', 'content-type': 'application/json' },
			body: JSON.stringify(request)
		});
	});
});
