import { describe, expect, it, vi } from 'vitest';
import { analyticsRange, getAnalytics } from './analytics';
vi.mock('./auth', () => ({ getBackendUrl: () => 'https://backend.test/api/v1' }));
const stats = { totalClicks: 4, uniqueVisitors: 2, firstClickedAt: '', lastClickedAt: '' };
describe('analytics date range', () => {
	it('defaults to an inclusive 30-day UTC window', () => {
		expect(analyticsRange(new URLSearchParams(), new Date('2026-09-05T12:00:00Z'))).toEqual({
			from: '2026-08-07',
			to: '2026-09-05'
		});
	});
	it.each(['from=2026-02-30', 'from=invalid', 'from=2026-09-06&to=2026-09-05'])(
		'rejects invalid ranges: %s',
		(query) => {
			expect(() => analyticsRange(new URLSearchParams(query), new Date('2026-09-05'))).toThrow(
				'Choose a valid'
			);
		}
	);
});
describe('analytics API', () => {
	it('uses the backend envelope and inclusive UTC filters', async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
			Response.json({
				data: [
					{
						stats,
						referrers: [{ referrer: '', count: 4 }],
						dailyStats: [{ date: '2026-09-05', clicks: 4 }]
					}
				]
			})
		);
		const result = await getAnalytics(fetcher, '12', { from: '2026-09-01', to: '2026-09-05' });
		const url = new URL(String(fetcher.mock.calls[0][0]));
		expect(url.pathname).toBe('/api/v1/urls/12/analytics');
		expect(url.searchParams.get('from')).toBe('2026-09-01T00:00:00Z');
		expect(url.searchParams.get('to')).toBe('2026-09-05T23:59:59.999999999Z');
		expect(result.stats.totalClicks).toBe(4);
		expect(result.dailyStats).toHaveLength(1);
	});
	it('accepts null lists for links with no traffic', async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
			Response.json({
				data: [
					{
						stats: { ...stats, totalClicks: 0, uniqueVisitors: 0 },
						referrers: null,
						dailyStats: null
					}
				]
			})
		);
		expect(
			await getAnalytics(fetcher, '1', { from: '2026-09-01', to: '2026-09-05' })
		).toMatchObject({ referrers: [], dailyStats: [] });
	});
	it('rejects malformed statistics instead of showing fake zero counts', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValue(Response.json({ data: [{ stats: {} }] }));
		await expect(
			getAnalytics(fetcher, '1', { from: '2026-09-01', to: '2026-09-05' })
		).rejects.toMatchObject({ status: 502 });
	});
	it('preserves HTTP failures', async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 404 }));
		await expect(
			getAnalytics(fetcher, '1', { from: '2026-09-01', to: '2026-09-05' })
		).rejects.toMatchObject({ status: 404 });
	});
});
