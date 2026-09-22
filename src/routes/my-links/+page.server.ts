import { getURLStatusCounts, listShortURLPage, ShortURLApiError } from '$lib/server/short-urls';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

function positiveInteger(value: string | null, fallback: number): number {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	if (!locals.authenticated) {
		const destination = `${url.pathname}${url.search}`;
		return redirect(303, `/login?redirectTo=${encodeURIComponent(destination)}`);
	}

	const page = positiveInteger(url.searchParams.get('page'), 1);
	const perPage = 7;
	const requestedStatus = url.searchParams.get('status');
	const status =
		requestedStatus === 'active' ||
		requestedStatus === 'disabled' ||
		requestedStatus === 'expired' ||
		requestedStatus === 'deleted'
			? requestedStatus
			: undefined;
	try {
		const [urlPage, counts] = await Promise.all([
			listShortURLPage(fetch, page, perPage, status),
			getURLStatusCounts(fetch)
		]);
		return {
			...urlPage,
			counts,
			filter: status === 'disabled' ? 'inactive' : (status ?? 'all'),
			loadError: undefined
		};
	} catch (error) {
		return {
			urls: [],
			page,
			perPage,
			total: 0,
			counts: { all: null, active: null, disabled: null, expired: null, deleted: null },
			filter: status === 'disabled' ? 'inactive' : (status ?? 'all'),
			loadError: error instanceof ShortURLApiError ? error.message : 'Unable to load your URLs.'
		};
	}
};
