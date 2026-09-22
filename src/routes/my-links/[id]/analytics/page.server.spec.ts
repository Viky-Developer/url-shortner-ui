import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAnalytics } from '$lib/server/analytics';
import { getShortURL, listURLClicks } from '$lib/server/short-urls';
import { load } from './+page.server';

vi.mock('$lib/server/analytics', async (importOriginal) => {
	const original = await importOriginal<typeof import('$lib/server/analytics')>();
	return { ...original, getAnalytics: vi.fn() };
});
vi.mock('$lib/server/short-urls', () => ({
	getShortURL: vi.fn(),
	listURLClicks: vi.fn(),
	ShortURLApiError: class extends Error {
		status: number;
		constructor(message: string, status: number) {
			super(message);
			this.status = status;
		}
	}
}));

const shortURL = {
	id: '12',
	originalURL: 'https://example.com',
	shortCode: 'launch',
	clicks: 4,
	status: 'active',
	statusCode: 1
};
const analytics = {
	stats: { totalClicks: 4, uniqueVisitors: 2, firstClickedAt: '', lastClickedAt: '' },
	referrers: [],
	dailyStats: []
};
const clicks = { clicks: [], page: 2, perPage: 10, total: 0 };

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(getShortURL).mockResolvedValue(shortURL as never);
	vi.mocked(getAnalytics).mockResolvedValue(analytics);
	vi.mocked(listURLClicks).mockResolvedValue(clicks);
});

describe('single URL analytics page', () => {
	it('loads the URL, analytics, and paginated clicks for the selected range', async () => {
		const fetcher = vi.fn();
		const result = await load({
			locals: { authenticated: true },
			params: { id: '12' },
			url: new URL('https://app.test/my-links/12/analytics?from=2026-09-01&to=2026-09-07&page=2'),
			fetch: fetcher
		} as never);

		expect(result).toMatchObject({ url: shortURL, analytics, clicks, page: 2 });
		const range = { from: '2026-09-01', to: '2026-09-07' };
		expect(getAnalytics).toHaveBeenCalledWith(fetcher, '12', range);
		expect(listURLClicks).toHaveBeenCalledWith(fetcher, '12', 2, 10, range);
	});

	it('redirects unauthenticated visitors back through login', async () => {
		await expect(
			load({
				locals: { authenticated: false },
				params: { id: '12' },
				url: new URL('https://app.test/my-links/12/analytics'),
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({ status: 303 });
	});
});
