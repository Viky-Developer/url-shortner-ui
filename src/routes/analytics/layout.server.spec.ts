import { beforeEach, expect, it, vi } from 'vitest';
import { load } from './+layout.server';
import { listAllURLClicks } from '$lib/server/short-urls';

vi.mock('$lib/server/short-urls', () => ({ listAllURLClicks: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

it('loads the table page using its own optional range', async () => {
	const clicks = { clicks: [], page: 3, perPage: 10, total: 25 };
	vi.mocked(listAllURLClicks).mockResolvedValue(clicks);
	const result = await load({
		url: new URL(
			'https://app.test/analytics?page=3&from=2026-07-01&to=2026-07-31&logFrom=2026-08-01&logTo=2026-09-03'
		),
		fetch: vi.fn()
	} as unknown as Parameters<typeof load>[0]);
	expect(result).toEqual({
		clicks,
		clickRange: { from: '2026-08-01', to: '2026-09-03' },
		clicksError: ''
	});
	expect(listAllURLClicks).toHaveBeenCalledWith(expect.anything(), 3, 10, {
		from: '2026-08-01',
		to: '2026-09-03'
	});
});

it('loads all click logs when its optional range is empty', async () => {
	const clicks = { clicks: [], page: 1, perPage: 10, total: 0 };
	vi.mocked(listAllURLClicks).mockResolvedValue(clicks);
	expect(
		await load({
			url: new URL('https://app.test/analytics?from=2026-08-01&to=2026-09-03'),
			fetch: vi.fn()
		} as unknown as Parameters<typeof load>[0])
	).toEqual({ clicks, clickRange: null, clicksError: '' });
	expect(listAllURLClicks).toHaveBeenCalledWith(expect.anything(), 1, 10, undefined);
});

it('reports table request failures independently', async () => {
	vi.mocked(listAllURLClicks).mockRejectedValue(new Error('offline'));
	expect(
		await load({
			url: new URL('https://app.test/analytics'),
			fetch: vi.fn()
		} as unknown as Parameters<typeof load>[0])
	).toEqual({ clicks: null, clickRange: null, clicksError: 'Unable to load the click log.' });
});
