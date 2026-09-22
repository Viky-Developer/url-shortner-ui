import { parseDate } from '@internationalized/date';
import { listAllURLClicks, ShortURLApiError } from './short-urls';

export type TrafficRange = { from: string; to: string };
export type CompareMode = 'previous-period' | 'previous-year';
export function comparisonRange(range: TrafficRange, mode: CompareMode): TrafficRange {
	const start = parseDate(range.from);
	const end = parseDate(range.to);
	if (mode === 'previous-year')
		return {
			from: start.subtract({ years: 1 }).toString(),
			to: end.subtract({ years: 1 }).toString()
		};
	const days = Math.round((Date.parse(range.to) - Date.parse(range.from)) / 86400000) + 1;
	return { from: start.subtract({ days }).toString(), to: start.subtract({ days: 1 }).toString() };
}

export async function getTraffic(fetcher: typeof fetch, range: TrafficRange) {
	const days = Math.round((Date.parse(range.to) - Date.parse(range.from)) / 86400000) + 1;
	if (days > 366) throw new ShortURLApiError('Choose a period of up to one year.', 400);
	const counts = new Map<string, number>();
	for (let i = 0; i < days; i++) counts.set(parseDate(range.from).add({ days: i }).toString(), 0);
	const referrers = new Map<string, number>();
	let total = 0;
	let page = 1;
	let processed = 0;
	// Aggregate every page; never present a partial page as the full traffic total.
	while (true) {
		const result = await listAllURLClicks(fetcher, page, 100, range);
		for (const click of result.clicks) {
			const date = click.clickedAt.slice(0, 10);
			if (!counts.has(date)) continue;
			counts.set(date, counts.get(date)! + 1);
			const referrer = click.referrer || 'Direct';
			referrers.set(referrer, (referrers.get(referrer) ?? 0) + 1);
			total++;
		}
		processed += result.clicks.length;
		if (processed >= result.total) break;
		if (!result.clicks.length || page >= 100)
			throw new ShortURLApiError(
				'Unable to load the complete traffic overview. Try a shorter date range.',
				502
			);
		page++;
	}
	return {
		total,
		dailyStats: [...counts].map(([date, clicks]) => ({ date, clicks })),
		referrers: [...referrers]
			.map(([referrer, count]) => ({ referrer, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10)
	};
}
