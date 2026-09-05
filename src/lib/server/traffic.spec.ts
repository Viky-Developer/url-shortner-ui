import { describe, expect, it, vi } from 'vitest';
import { comparisonRange, getTraffic } from './traffic';
import { listAllURLClicks } from './short-urls';
vi.mock('./short-urls', () => ({
	listAllURLClicks: vi.fn(),
	ShortURLApiError: class extends Error {}
}));
const range = { from: '2026-09-01', to: '2026-09-03' };
describe('account traffic', () => {
	it('compares an equally sized preceding period', () => {
		expect(comparisonRange(range, 'previous-period')).toEqual({
			from: '2026-08-29',
			to: '2026-08-31'
		});
	});
	it('handles leap-day year comparisons', () => {
		expect(comparisonRange({ from: '2024-02-29', to: '2024-03-01' }, 'previous-year')).toEqual({
			from: '2023-02-28',
			to: '2023-03-01'
		});
	});
	it('counts all pages and fills days without clicks', async () => {
		const click = { clickedAt: '2026-09-01T12:00:00Z', referrer: 'Direct' };
		vi.mocked(listAllURLClicks)
			.mockResolvedValueOnce({ clicks: [click], total: 2, page: 1, perPage: 1 } as never)
			.mockResolvedValueOnce({
				clicks: [{ ...click, clickedAt: '2026-09-03T12:00:00Z' }],
				total: 2,
				page: 2,
				perPage: 1
			} as never);
		expect(await getTraffic(vi.fn(), range)).toMatchObject({
			total: 2,
			dailyStats: [
				{ date: '2026-09-01', clicks: 1 },
				{ date: '2026-09-02', clicks: 0 },
				{ date: '2026-09-03', clicks: 1 }
			]
		});
		expect(listAllURLClicks).toHaveBeenLastCalledWith(expect.anything(), 2, 100, range);
	});
	it('fails rather than presenting an incomplete total', async () => {
		vi.mocked(listAllURLClicks).mockResolvedValueOnce({
			clicks: [],
			total: 5,
			page: 1,
			perPage: 100
		});
		await expect(getTraffic(vi.fn(), range)).rejects.toThrow('complete traffic');
	});
});
