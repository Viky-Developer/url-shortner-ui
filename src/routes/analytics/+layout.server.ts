import { analyticsRange } from '$lib/server/analytics';
import { listAllURLClicks } from '$lib/server/short-urls';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, fetch }) => {
	const requestedPage = Number(url.searchParams.get('page') ?? 1);
	const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	try {
		const clickFrom = url.searchParams.get('logFrom');
		const clickTo = url.searchParams.get('logTo');
		const range =
			clickFrom || clickTo
				? analyticsRange(new URLSearchParams({ from: clickFrom ?? '', to: clickTo ?? '' }))
				: undefined;
		return {
			clicks: await listAllURLClicks(fetch, page, 10, range),
			clickRange: range ?? null,
			clicksError: ''
		};
	} catch {
		return { clicks: null, clickRange: null, clicksError: 'Unable to load the click log.' };
	}
};
