import { env } from '$env/dynamic/private';
import { describe, expect, it, vi } from 'vitest';
import {
	createShortURL,
	getShortURL,
	getURLStatusCounts,
	hardDeleteShortURL,
	listShortURLPage,
	listShortURLs,
	listURLClicks,
	ShortURLApiError,
	softDeleteShortURL,
	updateShortURL
} from './short-urls';

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

	it('loads one URL by id and maps a numeric status', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({
				statusCode: 200,
				message: 'url retrieved',
				data: [{ id: 7, originalURL: 'https://example.com', shortCode: 'go', isActive: false }]
			})
		) as unknown as typeof fetch;

		await expect(getShortURL(fetcher, '7')).resolves.toEqual(
			expect.objectContaining({ id: '7', status: 'inactive', statusCode: 0 })
		);
		expect(fetcher).toHaveBeenCalledWith(`${env.APP_ENV}/urls/7`, {
			headers: { accept: 'application/json' }
		});
	});

	it('loads a requested page and preserves pagination metadata', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({ data: { urls: [], pagination: { page: 2, perPage: 25, total: 80 } } })
		) as unknown as typeof fetch;

		await expect(listShortURLPage(fetcher, 2, 25)).resolves.toEqual({
			urls: [],
			page: 2,
			perPage: 25,
			total: 80
		});
	});

	it('loads all status counts from the dedicated endpoint', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({
				statusCode: 200,
				data: [{ ACTIVE: 10, DISABLED: 2, EXPIRED: 5, DELETED: 3 }]
			})
		) as unknown as typeof fetch;

		await expect(getURLStatusCounts(fetcher)).resolves.toEqual({
			all: 20,
			active: 10,
			disabled: 2,
			expired: 5,
			deleted: 3
		});
		expect(fetcher).toHaveBeenCalledWith(`${env.APP_ENV}/urls/status-counts`, {
			headers: { accept: 'application/json' }
		});
	});

	it('loads paginated click history for a URL', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({
				data: [
					{ id: 9, clickedAt: '2026-09-04T10:00:00Z', browser: 'Chrome', deviceType: 'desktop' }
				],
				pagination: { page: 2, perPage: 7, total: 12 }
			})
		) as unknown as typeof fetch;

		await expect(listURLClicks(fetcher, '42', 2, 7)).resolves.toEqual(
			expect.objectContaining({
				page: 2,
				perPage: 7,
				total: 12,
				clicks: [expect.objectContaining({ id: '9', browser: 'Chrome' })]
			})
		);
		expect(fetcher).toHaveBeenCalledWith(`${env.APP_ENV}/urls/42/clicks?page=2&perPage=7`, {
			headers: { accept: 'application/json' }
		});
	});

	it('requests and labels deleted URLs using the backend status filter', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({
				data: [{ id: 8, originalURL: 'https://example.com', shortCode: 'gone', isActive: false }],
				pagination: { page: 1, perPage: 10, total: 1 }
			})
		) as unknown as typeof fetch;

		await expect(listShortURLPage(fetcher, 1, 10, 'deleted')).resolves.toEqual(
			expect.objectContaining({
				urls: [expect.objectContaining({ status: 'deleted', statusCode: 3 })]
			})
		);
		expect(fetcher).toHaveBeenCalledWith(`${env.APP_ENV}/urls?page=1&perPage=10&status=deleted`, {
			headers: { accept: 'application/json' }
		});
	});

	it('patches an approved URL update payload', async () => {
		const fetcher = vi.fn(
			async () => new Response(null, { status: 204 })
		) as unknown as typeof fetch;
		const request = { title: 'Updated', status: 1 as const };

		await expect(updateShortURL(fetcher, 'url/7', request)).resolves.toBeUndefined();
		expect(fetcher).toHaveBeenCalledWith(
			`${env.APP_ENV}/urls/url%2F7`,
			expect.objectContaining({ method: 'PATCH', body: JSON.stringify(request) })
		);
	});

	it('uses separate soft and approved hard-delete routes', async () => {
		const fetcher = vi.fn(async () => Response.json({ data: [] })) as unknown as typeof fetch;

		await softDeleteShortURL(fetcher, '7');
		await hardDeleteShortURL(fetcher, '7');

		expect(fetcher).toHaveBeenNthCalledWith(1, `${env.APP_ENV}/urls/7`, {
			method: 'DELETE',
			headers: { accept: 'application/json' }
		});
		expect(fetcher).toHaveBeenNthCalledWith(2, `${env.APP_ENV}/urls/7/approve`, {
			method: 'DELETE',
			headers: { accept: 'application/json' }
		});
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
