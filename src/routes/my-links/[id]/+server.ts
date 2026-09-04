import {
	getShortURL,
	hardDeleteShortURL,
	ShortURLApiError,
	softDeleteShortURL,
	updateShortURL
} from '$lib/server/short-urls';
import type { UpdateURLRequest, URLStatusCode } from '$lib/types/short-url';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function validHttpURL(value: string): boolean {
	try {
		return ['https:'].includes(new URL(value).protocol);
	} catch {
		return false;
	}
}

function apiError(cause: unknown, fallback: string): never {
	if (cause instanceof ShortURLApiError) error(cause.status, cause.message);
	error(500, fallback);
}

export const GET: RequestHandler = async ({ params, fetch }) => {
	try {
		return json(await getShortURL(fetch, params.id));
	} catch (cause) {
		return apiError(cause, 'Unable to load this URL.');
	}
};

export const PATCH: RequestHandler = async ({ params, request, fetch }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Enter a valid update request.');
	}
	if (!body || typeof body !== 'object' || Array.isArray(body))
		error(400, 'Enter a valid update request.');

	const input = body as Record<string, unknown>;
	const payload: UpdateURLRequest = {};
	if (typeof input.originalURL === 'string') {
		if (!validHttpURL(input.originalURL)) error(400, 'Enter a valid URL beginning with https://');
		payload.originalURL = input.originalURL.trim();
	}
	for (const key of ['title', 'description'] as const) {
		if (typeof input[key] === 'string') payload[key] = input[key].trim();
	}
	if (typeof input.status === 'number' && [0, 1, 2, 3].includes(input.status))
		payload.status = input.status as URLStatusCode;
	else if (input.status !== undefined) error(400, 'Select a valid URL status.');
	if (typeof input.expiresAt === 'string' && input.expiresAt) {
		if (Number.isNaN(Date.parse(input.expiresAt))) error(400, 'Enter a valid expiration date.');
		payload.expiresAt = new Date(input.expiresAt).toISOString();
	}
	if (Object.keys(payload).length === 0) error(400, 'Change at least one field before updating.');

	try {
		const currentURL = await getShortURL(fetch, params.id);
		if (currentURL.status === 'expired' || currentURL.status === 'deleted')
			throw new ShortURLApiError('Expired and deleted URLs cannot be changed.', 409);
		return json((await updateShortURL(fetch, params.id, payload)) ?? { success: true });
	} catch (cause) {
		return apiError(cause, 'Unable to update this URL.');
	}
};

export const DELETE: RequestHandler = async ({ params, url, fetch }) => {
	const hardDelete = url.searchParams.get('mode') === 'hard';
	try {
		if (hardDelete) await hardDeleteShortURL(fetch, params.id);
		else await softDeleteShortURL(fetch, params.id);
		return json({ success: true });
	} catch (cause) {
		return apiError(
			cause,
			hardDelete ? 'Unable to permanently delete this URL.' : 'Unable to delete this URL.'
		);
	}
};
