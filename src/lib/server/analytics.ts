import { getBackendUrl } from './auth';
import { ShortURLApiError } from './short-urls';

export interface Analytics {
	stats: {
		totalClicks: number;
		uniqueVisitors: number;
		firstClickedAt: string;
		lastClickedAt: string;
	};
	referrers: { referrer: string; count: number }[];
	dailyStats: { date: string; clicks: number }[];
}

function record(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}
function count(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
export function analyticsRange(search: URLSearchParams, now = new Date()) {
	const end = now.toISOString().slice(0, 10);
	const start = new Date(now.getTime() - 29 * 86400000).toISOString().slice(0, 10);
	const from = search.get('from') ?? start;
	const to = search.get('to') ?? end;
	const valid = (date: string) =>
		/^\d{4}-\d{2}-\d{2}$/.test(date) &&
		Number.isFinite(Date.parse(date)) &&
		new Date(date).toISOString().slice(0, 10) === date;
	if (!valid(from) || !valid(to) || from > to)
		throw new ShortURLApiError('Choose a valid start and end date.', 400);
	return { from, to };
}
export async function getAnalytics(
	fetcher: typeof fetch,
	id: string,
	range: { from: string; to: string }
): Promise<Analytics> {
	const search = new URLSearchParams({
		from: `${range.from}T00:00:00Z`,
		to: `${range.to}T23:59:59.999999999Z`
	});
	let response: Response;
	try {
		response = await fetcher(
			`${getBackendUrl()}/urls/${encodeURIComponent(id)}/analytics?${search}`,
			{ headers: { accept: 'application/json' } }
		);
	} catch {
		throw new ShortURLApiError('The analytics service is unavailable.', 503);
	}
	if (!response.ok)
		throw new ShortURLApiError(
			response.status === 404 ? 'This link could not be found.' : 'Unable to load link analytics.',
			response.status
		);
	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		throw new ShortURLApiError('The analytics service returned an invalid response.', 502);
	}
	const value = record(payload) && Array.isArray(payload.data) ? payload.data[0] : payload;
	const invalid = () =>
		new ShortURLApiError('The analytics service returned invalid analytics.', 502);
	if (!record(value) || !record(value.stats)) throw invalid();
	const stats = value.stats;
	if (
		!count(stats.totalClicks) ||
		!count(stats.uniqueVisitors) ||
		typeof stats.firstClickedAt !== 'string' ||
		typeof stats.lastClickedAt !== 'string'
	)
		throw invalid();
	const referrers = value.referrers ?? [];
	const dailyStats = value.dailyStats ?? [];
	if (
		!Array.isArray(referrers) ||
		!referrers.every((r) => record(r) && typeof r.referrer === 'string' && count(r.count))
	)
		throw invalid();
	if (
		!Array.isArray(dailyStats) ||
		!dailyStats.every(
			(d) =>
				record(d) &&
				typeof d.date === 'string' &&
				/^\d{4}-\d{2}-\d{2}$/.test(d.date) &&
				count(d.clicks)
		)
	)
		throw invalid();
	return {
		stats: {
			totalClicks: stats.totalClicks,
			uniqueVisitors: stats.uniqueVisitors,
			firstClickedAt: stats.firstClickedAt,
			lastClickedAt: stats.lastClickedAt
		},
		referrers,
		dailyStats
	};
}
