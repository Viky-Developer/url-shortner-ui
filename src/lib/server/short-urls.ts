import type { CreateURLRequest, ShortURL } from '$lib/types/short-url';
import { getBackendUrl } from './auth';

const SHORTEN_PATH = '/shorten';

export class ShortURLApiError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'ShortURLApiError';
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function stringValue(record: Record<string, unknown>, ...keys: string[]): string | undefined {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === 'string' && value.trim()) return value.trim();
	}
}

function numberValue(record: Record<string, unknown>, ...keys: string[]): number {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === 'number' && Number.isFinite(value)) return value;
	}
	return 0;
}

function normalizeShortURL(value: unknown, index: number): ShortURL | undefined {
	if (!isRecord(value)) return undefined;
	const originalURL = stringValue(value, 'originalURL', 'originalUrl', 'original_url');
	const shortCode = stringValue(value, 'shortCode', 'short_code', 'customCode', 'code');
	if (!originalURL || !shortCode) return undefined;

	const rawStatus = stringValue(value, 'status')?.toLowerCase();
	const expiresAt = stringValue(value, 'expiresAt', 'expires_at');
	const expiredByDate = expiresAt ? Date.parse(expiresAt) <= Date.now() : false;
	const status =
		rawStatus === 'expired' || expiredByDate
			? 'expired'
			: rawStatus === 'inactive' || rawStatus === 'disabled'
				? 'inactive'
				: 'active';

	return {
		id: String(value.id ?? value.urlId ?? value.url_id ?? `${shortCode}-${index}`),
		originalURL,
		shortCode,
		shortURL: stringValue(value, 'shortURL', 'shortUrl', 'short_url'),
		title: stringValue(value, 'title'),
		description: stringValue(value, 'description'),
		clicks: numberValue(value, 'clicks', 'clickCount', 'click_count', 'totalClicks'),
		status,
		health: status === 'active' ? 'healthy' : 'inactive',
		createdAt: stringValue(value, 'createdAt', 'created_at'),
		expiresAt
	};
}

function responseItems(payload: unknown): unknown[] {
	if (Array.isArray(payload)) return payload;
	if (!isRecord(payload)) return [];
	if (isRecord(payload.data)) {
		for (const key of ['urls', 'links', 'items', 'data']) {
			if (Array.isArray(payload.data[key])) return payload.data[key];
		}
	}
	if (Array.isArray(payload.data)) {
		if (payload.data.length === 1 && isRecord(payload.data[0])) {
			for (const key of ['urls', 'links', 'items', 'data']) {
				const nested = payload.data[0][key];
				if (Array.isArray(nested)) return nested;
			}
		}
		return payload.data;
	}
	for (const key of ['urls', 'links', 'items']) {
		if (Array.isArray(payload[key])) return payload[key];
	}
	return [];
}

async function responsePayload(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		throw new ShortURLApiError('The URL service returned an invalid response.', 502);
	}
}

function errorMessage(payload: unknown, fallback: string): string {
	if (!isRecord(payload)) return fallback;
	for (const key of ['message', 'error', 'detail']) {
		const value = payload[key];
		if (typeof value === 'string' && value.trim()) return value;
	}
	return fallback;
}

export async function listShortURLs(fetcher: typeof fetch): Promise<ShortURL[]> {
	let response: Response;
	try {
		response = await fetcher(`${getBackendUrl()}${SHORTEN_PATH}`, {
			headers: { accept: 'application/json' }
		});
	} catch {
		throw new ShortURLApiError('The URL service is unavailable.', 503);
	}
	const payload = await responsePayload(response);
	if (!response.ok)
		throw new ShortURLApiError(errorMessage(payload, 'Unable to load your URLs.'), response.status);
	return responseItems(payload)
		.map(normalizeShortURL)
		.filter((url): url is ShortURL => url !== undefined);
}

export async function createShortURL(
	fetcher: typeof fetch,
	request: CreateURLRequest
): Promise<void> {
	let response: Response;
	try {
		response = await fetcher(`${getBackendUrl()}${SHORTEN_PATH}`, {
			method: 'POST',
			headers: { accept: 'application/json', 'content-type': 'application/json' },
			body: JSON.stringify(request)
		});
	} catch {
		throw new ShortURLApiError('The URL service is unavailable.', 503);
	}
	if (!response.ok) {
		const payload = await responsePayload(response);
		throw new ShortURLApiError(
			errorMessage(payload, 'Unable to shorten this URL.'),
			response.status
		);
	}
}
