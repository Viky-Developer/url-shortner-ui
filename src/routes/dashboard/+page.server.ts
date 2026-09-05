import {
	createShortURL,
	getURLStatusCounts,
	getClickCounts,
	listShortURLs,
	ShortURLApiError
} from '$lib/server/short-urls';
import type { CreateURLRequest } from '$lib/types/short-url';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function formString(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

function validHttpURL(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	if (!locals.authenticated) {
		const destination = `${url.pathname}${url.search}`;
		if (destination === '/') return redirect(303, '/login');
		return redirect(303, `/login?redirectTo=${encodeURIComponent(destination)}`);
	}

	const [urlsResult, countsResult, clicksResult] = await Promise.allSettled([
		listShortURLs(fetch),
		getURLStatusCounts(fetch),
		getClickCounts(fetch)
	]);
	const urls = urlsResult.status === 'fulfilled' ? urlsResult.value : [];

	return {
		urls,
		clickCounts: clicksResult.status === 'fulfilled' ? clicksResult.value : null,
		clickCountsError: clicksResult.status === 'rejected' ? 'Unable to load total clicks.' : '',
		statusCounts: countsResult.status === 'fulfilled' ? countsResult.value : undefined,
		loadError:
			urlsResult.status === 'rejected'
				? urlsResult.reason instanceof ShortURLApiError
					? urlsResult.reason.message
					: 'Unable to load your URLs.'
				: undefined
	};
};

export const actions = {
	create: async ({ request, fetch }) => {
		const formData = await request.formData();
		const originalURL = formString(formData, 'originalURL');
		const customCode = formString(formData, 'customCode');
		const title = formString(formData, 'title');
		const description = formString(formData, 'description');
		const expiresAt = formString(formData, 'expiresAt');
		const values = { originalURL, customCode, title, description, expiresAt };

		if (!validHttpURL(originalURL))
			return fail(400, {
				success: false,
				message: 'Enter a valid URL beginning with https://',
				values
			});
		if (expiresAt && Number.isNaN(Date.parse(expiresAt)))
			return fail(400, { success: false, message: 'Enter a valid expiration date.', values });

		const payload: CreateURLRequest = {
			originalURL,
			...(customCode ? { customCode } : {}),
			...(title ? { title } : {}),
			...(description ? { description } : {}),
			...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {})
		};
		try {
			await createShortURL(fetch, payload);
			return {
				success: true,
				message: 'Short URL created successfully.',
				values: { originalURL: '', customCode: '', title: '', description: '', expiresAt: '' }
			};
		} catch (error) {
			const status = error instanceof ShortURLApiError ? error.status : 500;
			return fail(status, {
				success: false,
				message: error instanceof ShortURLApiError ? error.message : 'Unable to shorten this URL.',
				values
			});
		}
	}
} satisfies Actions;
