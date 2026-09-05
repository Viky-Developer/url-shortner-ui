import { analyticsRange } from '$lib/server/analytics';
import { ShortURLApiError } from '$lib/server/short-urls';
import { comparisonRange, getTraffic } from '$lib/server/traffic';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const defaults = {
		...analyticsRange(new URLSearchParams()),
		traffic: null,
		comparison: null,
		comparisonRange: null,
		compare: false,
		compareMode: 'previous-period' as 'previous-period' | 'previous-year',
		loadError: '',
		comparisonError: ''
	};
	let range;
	try {
		range = analyticsRange(url.searchParams);
	} catch (cause) {
		return {
			...defaults,
			loadError: cause instanceof Error ? cause.message : 'Invalid date range.'
		};
	}
	const compare = url.searchParams.get('compare') === 'true';
	const compareMode =
		url.searchParams.get('compareMode') === 'previous-year'
			? ('previous-year' as const)
			: ('previous-period' as const);
	const previous = compare ? comparisonRange(range, compareMode) : null;
	const [traffic, comparison] = await Promise.allSettled([
		getTraffic(fetch, range),
		previous ? getTraffic(fetch, previous) : Promise.resolve(null)
	]);
	return {
		...defaults,
		...range,
		compare,
		compareMode,
		comparisonRange: previous,
		traffic: traffic.status === 'fulfilled' ? traffic.value : null,
		comparison: comparison.status === 'fulfilled' ? comparison.value : null,
		loadError:
			traffic.status === 'rejected'
				? traffic.reason instanceof ShortURLApiError
					? traffic.reason.message
					: 'Unable to load traffic overview.'
				: '',
		comparisonError: comparison.status === 'rejected' ? 'Unable to load the comparison period.' : ''
	};
};
