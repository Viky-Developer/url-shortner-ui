import { analyticsRange, getAnalytics } from '$lib/server/analytics';
import { getShortURL, listURLClicks, ShortURLApiError } from '$lib/server/short-urls';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

function positiveInteger(value: string | null, fallback: number): number {
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function message(error: unknown, fallback: string): string {
	return error instanceof ShortURLApiError ? error.message : fallback;
}

export const load: PageServerLoad = async ({ locals, params, url, fetch }) => {
	if (!locals.authenticated) {
		const destination = `${url.pathname}${url.search}`;
		redirect(303, `/login?redirectTo=${encodeURIComponent(destination)}`);
	}

	const page = positiveInteger(url.searchParams.get('page'), 1);
	let range;
	try {
		range = analyticsRange(url.searchParams);
	} catch (error) {
		return {
			url: null,
			analytics: null,
			clicks: null,
			from: '',
			to: '',
			page,
			urlError: '',
			analyticsError: message(error, 'Choose a valid date range.'),
			clicksError: ''
		};
	}

	const [shortURL, analytics, clicks] = await Promise.allSettled([
		getShortURL(fetch, params.id),
		getAnalytics(fetch, params.id, range),
		listURLClicks(fetch, params.id, page, 10, range)
	]);

	return {
		...range,
		page,
		url: shortURL.status === 'fulfilled' ? shortURL.value : null,
		analytics: analytics.status === 'fulfilled' ? analytics.value : null,
		clicks: clicks.status === 'fulfilled' ? clicks.value : null,
		urlError:
			shortURL.status === 'rejected' ? message(shortURL.reason, 'Unable to load this URL.') : '',
		analyticsError:
			analytics.status === 'rejected'
				? message(analytics.reason, 'Unable to load link analytics.')
				: '',
		clicksError:
			clicks.status === 'rejected' ? message(clicks.reason, 'Unable to load URL clicks.') : ''
	};
};
