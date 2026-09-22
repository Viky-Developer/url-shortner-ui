import { listURLClicks, ShortURLApiError } from '$lib/server/short-urls';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, fetch }) => {
	const requestedPage = Number(url.searchParams.get('page'));
	const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	try {
		return json(await listURLClicks(fetch, params.id, page, 7));
	} catch (cause) {
		if (cause instanceof ShortURLApiError) error(cause.status, cause.message);
		error(500, 'Unable to load URL clicks.');
	}
};
