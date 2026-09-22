import { expect, it, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { listAllURLClicks } from '$lib/server/short-urls';
import { getTraffic } from '$lib/server/traffic';
vi.mock('$lib/server/short-urls', () => ({
	listAllURLClicks: vi.fn(),
	ShortURLApiError: class extends Error {}
}));
vi.mock('$lib/server/traffic', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/server/traffic')>()),
	getTraffic: vi.fn()
}));
async function visit(query = '') {
	return load({
		url: new URL(`https://app.test/analytics?from=2026-09-01&to=2026-09-03${query}`),
		fetch: vi.fn()
	} as unknown as Parameters<typeof load>[0]);
}
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getTraffic).mockResolvedValue({ total: 0, dailyStats: [], referrers: [] });
	vi.mocked(listAllURLClicks).mockResolvedValue({ clicks: [], page: 1, perPage: 10, total: 0 });
});
it('loads account-wide traffic without a link ID, applying dates and pagination', async () => {
	expect(await visit('&id=42&page=3')).toMatchObject({ loadError: '' });
	expect(listAllURLClicks).not.toHaveBeenCalled();
	expect(getTraffic).toHaveBeenCalledWith(expect.anything(), {
		from: '2026-09-01',
		to: '2026-09-03'
	});
});
it('fetches the previous period only when comparison is enabled', async () => {
	expect(await visit('&compare=true')).toMatchObject({
		comparisonRange: { from: '2026-08-29', to: '2026-08-31' }
	});
	expect(getTraffic).toHaveBeenCalledTimes(2);
	expect(getTraffic).toHaveBeenLastCalledWith(expect.anything(), {
		from: '2026-08-29',
		to: '2026-08-31'
	});
});
it('reports traffic failures independently of the click log', async () => {
	vi.mocked(getTraffic).mockRejectedValue(new Error('offline'));
	expect(await visit()).toMatchObject({
		loadError: 'Unable to load traffic overview.'
	});
});
it('keeps primary traffic if the comparison request fails', async () => {
	vi.mocked(getTraffic)
		.mockResolvedValueOnce({ total: 0, dailyStats: [], referrers: [] })
		.mockRejectedValueOnce(new Error('offline'));
	expect(await visit('&compare=true')).toMatchObject({
		traffic: { total: 0 },
		comparison: null,
		comparisonError: 'Unable to load the comparison period.'
	});
});
