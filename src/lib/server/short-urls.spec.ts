import { env } from '$env/dynamic/private';
import { describe, expect, it, vi } from 'vitest';
import { createShortURL, listShortURLs, ShortURLApiError } from './short-urls';

describe('short URL API', () => {
	it('loads and normalizes URLs from the API envelope', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({
				data: {
					urls: [
						{
							id: 42,
							original_url: 'https://example.com/long',
							short_code: 'launch',
							click_count: 12,
							status: 'active',
							created_at: '2026-09-04T00:00:00Z'
						}
					]
				}
			})
		) as unknown as typeof fetch;

		await expect(listShortURLs(fetcher)).resolves.toEqual([
			expect.objectContaining({
				id: '42',
				originalURL: 'https://example.com/long',
				shortCode: 'launch',
				clicks: 12,
				status: 'active'
			})
		]);
		expect(fetcher).toHaveBeenCalledWith(`${env.APP_ENV}/urls?page=1&perPage=5`, {
			headers: { accept: 'application/json' }
		});
	});

	it('posts only the mapped create request fields', async () => {
		const fetcher = vi.fn(
			async () => new Response(null, { status: 201 })
		) as unknown as typeof fetch;
		const request = {
			originalURL: 'https://example.com/long',
			customCode: 'launch',
			title: 'Launch'
		};

		await expect(createShortURL(fetcher, request)).resolves.toBeUndefined();
		expect(fetcher).toHaveBeenCalledWith(
			`${env.APP_ENV}/shorten`,
			expect.objectContaining({ method: 'POST', body: JSON.stringify(request) })
		);
	});

	it('surfaces backend validation messages', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({ message: 'Custom code is already in use.' }, { status: 409 })
		) as unknown as typeof fetch;

		await expect(createShortURL(fetcher, { originalURL: 'https://example.com' })).rejects.toEqual(
			expect.objectContaining<Partial<ShortURLApiError>>({
				message: 'Custom code is already in use.',
				status: 409
			})
		);
	});
});
