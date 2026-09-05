import type {
	CreateURLRequest,
	ClickLogPage,
	ShortURL,
	ShortURLPage,
	UpdateURLRequest,
	URLStatusCounts,
	URLStatusCode
} from '$lib/types/short-url';
import { getBackendUrl } from './auth';

const SHORTEN_PATH = '/shorten';
const URLS_PATH = '/urls';

const STATUS_COUNTS_PATH = `${URLS_PATH}/status-counts`;

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
	return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function optionalNumberValue(
	record: Record<string, unknown>,
	...keys: string[]
): number | undefined {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === 'number' && Number.isFinite(value)) return value;
	}
}

function statusValue(value: Record<string, unknown>): {
	status: ShortURL['status'];
	statusCode: URLStatusCode;
} {
	const numericStatus = optionalNumberValue(value, 'status');
	const rawStatus = stringValue(value, 'status')?.toLowerCase();
	const explicitlyInactive = value.isActive === false || value.is_active === false;
	const expiresAt = stringValue(value, 'expiresAt', 'expires_at');
	const expiredByDate = expiresAt ? Date.parse(expiresAt) <= Date.now() : false;

	if (numericStatus === 3 || rawStatus === 'deleted') return { status: 'deleted', statusCode: 3 };
	if (numericStatus === 2 || rawStatus === 'expired' || expiredByDate)
		return { status: 'expired', statusCode: 2 };
	if (
		numericStatus === 0 ||
		rawStatus === 'inactive' ||
		rawStatus === 'disabled' ||
		explicitlyInactive
	)
		return { status: 'inactive', statusCode: 0 };
	return { status: 'active', statusCode: 1 };
}

function normalizeShortURL(value: unknown, index = 0): ShortURL | undefined {
	if (!isRecord(value)) return undefined;
	const originalURL = stringValue(value, 'originalURL', 'originalUrl', 'original_url');
	const shortCode = stringValue(value, 'shortCode', 'short_code', 'customCode', 'code');
	if (!originalURL || !shortCode) return undefined;

	const expiresAt = stringValue(value, 'expiresAt', 'expires_at');
	const { status, statusCode } = statusValue(value);

	return {
		id: String(value.id ?? value.urlId ?? value.url_id ?? `${shortCode}-${index}`),
		originalURL,
		shortCode,
		shortURL: stringValue(value, 'shortURL', 'shortUrl', 'short_url'),
		title: stringValue(value, 'title'),
		description: stringValue(value, 'description'),
		clicks: numberValue(value, 'clicks', 'clickCount', 'click_count', 'totalClicks'),
		status,
		statusCode,
		health: status === 'active' ? 'healthy' : 'inactive',
		createdAt: stringValue(value, 'createdAt', 'created_at'),
		expiresAt
	};
}

function responseItem(payload: unknown): unknown {
	if (!isRecord(payload)) return payload;
	if (isRecord(payload.data)) {
		for (const key of ['url', 'link', 'item'])
			if (isRecord(payload.data[key])) return payload.data[key];
		return payload.data;
	}
	if (Array.isArray(payload.data)) return payload.data[0];
	for (const key of ['url', 'link', 'item']) if (isRecord(payload[key])) return payload[key];
	return payload;
}

function positiveInteger(
	record: Record<string, unknown>,
	keys: string[],
	fallback: number
): number {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
	}
	return fallback;
}

function paginationRecord(payload: unknown): Record<string, unknown> {
	if (!isRecord(payload)) return {};
	for (const value of [payload.pagination, payload.meta, payload.data]) {
		if (isRecord(value)) {
			if (isRecord(value.pagination)) return value.pagination;
			if (isRecord(value.meta)) return value.meta;
			return value;
		}
	}
	return payload;
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
	return (await listShortURLPage(fetcher, 1, 5)).urls;
}

export async function getURLStatusCounts(fetcher: typeof fetch): Promise<URLStatusCounts> {
	let response: Response;
	try {
		response = await fetcher(`${getBackendUrl()}${STATUS_COUNTS_PATH}`, {
			headers: { accept: 'application/json' }
		});
	} catch {
		throw new ShortURLApiError('The URL service is unavailable.', 503);
	}
	const payload = await responsePayload(response);
	if (!response.ok)
		throw new ShortURLApiError(
			errorMessage(payload, 'Unable to load URL status counts.'),
			response.status
		);
	const counts = responseItem(payload);
	if (!isRecord(counts))
		throw new ShortURLApiError('The URL service returned invalid status counts.', 502);
	const active = numberValue(counts, 'ACTIVE', 'active');
	const disabled = numberValue(counts, 'DISABLED', 'disabled');
	const expired = numberValue(counts, 'EXPIRED', 'expired');
	const deleted = numberValue(counts, 'DELETED', 'deleted');
	return { all: active + disabled + expired + deleted, active, disabled, expired, deleted };
}

export async function listURLClicks(
	fetcher: typeof fetch,
	id: string,
	page = 1,
	perPage = 7
): Promise<ClickLogPage> {
	return fetchClickLogPage(fetcher, `${URLS_PATH}/${encodeURIComponent(id)}/clicks`, page, perPage);
}

export function listAllURLClicks(
	fetcher: typeof fetch,
	page = 1,
	perPage = 10,
	range?: { from: string; to: string }
): Promise<ClickLogPage> {
	return fetchClickLogPage(fetcher, `${URLS_PATH}/clicks`, page, perPage, range);
}

async function fetchClickLogPage(
	fetcher: typeof fetch,
	path: string,
	page: number,
	perPage: number,
	range?: { from: string; to: string }
): Promise<ClickLogPage> {
	let response: Response;
	try {
		const search = new URLSearchParams({ page: String(page), perPage: String(perPage) });
		if (range) {
			search.set('from', `${range.from}T00:00:00Z`);
			search.set('to', `${range.to}T23:59:59.999999999Z`);
		}
		response = await fetcher(`${getBackendUrl()}${path}?${search}`, {
			headers: { accept: 'application/json' }
		});
	} catch {
		throw new ShortURLApiError('The click service is unavailable.', 503);
	}
	const payload = await responsePayload(response);
	if (!response.ok)
		throw new ShortURLApiError(
			errorMessage(payload, 'Unable to load URL clicks.'),
			response.status
		);
	const clicks = responseItems(payload)
		.filter(isRecord)
		.map((item, index) => ({
			id: String(item.id ?? index),
			shortCode: stringValue(item, 'shortCode', 'short_code'),
			clickedAt: stringValue(item, 'clickedAt', 'clicked_at') ?? '',
			ipAddress: stringValue(item, 'ipAddress', 'ip_address') ?? 'Unknown',
			userAgent: stringValue(item, 'userAgent', 'user_agent') ?? 'Unknown',
			referrer: stringValue(item, 'referrer') ?? 'Direct',
			browser: stringValue(item, 'browser') ?? 'Unknown',
			deviceType: stringValue(item, 'deviceType', 'device_type') ?? 'Unknown'
		}));
	const pagination = paginationRecord(payload);
	return {
		clicks,
		page: positiveInteger(pagination, ['page'], page),
		perPage: positiveInteger(pagination, ['perPage', 'per_page'], perPage),
		total: positiveInteger(pagination, ['total'], clicks.length)
	};
}

export async function listShortURLPage(
	fetcher: typeof fetch,
	page = 1,
	perPage = 10,
	status?: 'active' | 'disabled' | 'expired' | 'deleted'
): Promise<ShortURLPage> {
	let response: Response;
	try {
		const search = new URLSearchParams({ page: String(page), perPage: String(perPage) });
		if (status) search.set('status', status);
		response = await fetcher(`${getBackendUrl()}${URLS_PATH}?${search}`, {
			headers: { accept: 'application/json' }
		});
	} catch {
		throw new ShortURLApiError('The URL service is unavailable.', 503);
	}
	const payload = await responsePayload(response);
	if (!response.ok)
		throw new ShortURLApiError(errorMessage(payload, 'Unable to load your URLs.'), response.status);
	const urls = responseItems(payload)
		.map(normalizeShortURL)
		.filter((url): url is ShortURL => url !== undefined)
		.map((url) =>
			status === 'expired'
				? { ...url, status: 'expired' as const, statusCode: 2 as const }
				: status === 'deleted'
					? { ...url, status: 'deleted' as const, statusCode: 3 as const }
					: status === 'disabled'
						? { ...url, status: 'inactive' as const, statusCode: 0 as const }
						: url
		);
	const pagination = paginationRecord(payload);
	return {
		urls,
		page: positiveInteger(pagination, ['page', 'currentPage', 'current_page'], page),
		perPage: positiveInteger(pagination, ['perPage', 'per_page', 'limit'], perPage),
		total: positiveInteger(pagination, ['total', 'totalItems', 'total_items', 'count'], urls.length)
	};
}

async function deleteShortURL(fetcher: typeof fetch, id: string, approve: boolean): Promise<void> {
	let response: Response;
	try {
		response = await fetcher(
			`${getBackendUrl()}${URLS_PATH}/${encodeURIComponent(id)}${approve ? '/approve' : ''}`,
			{ method: 'DELETE', headers: { accept: 'application/json' } }
		);
	} catch {
		throw new ShortURLApiError('The URL service is unavailable.', 503);
	}
	if (!response.ok) {
		const payload = await responsePayload(response);
		throw new ShortURLApiError(
			errorMessage(
				payload,
				approve ? 'Unable to permanently delete this URL.' : 'Unable to delete this URL.'
			),
			response.status
		);
	}
}

export function softDeleteShortURL(fetcher: typeof fetch, id: string): Promise<void> {
	return deleteShortURL(fetcher, id, false);
}

export function hardDeleteShortURL(fetcher: typeof fetch, id: string): Promise<void> {
	return deleteShortURL(fetcher, id, true);
}

export async function getShortURL(fetcher: typeof fetch, id: string): Promise<ShortURL> {
	let response: Response;
	try {
		response = await fetcher(`${getBackendUrl()}${URLS_PATH}/${encodeURIComponent(id)}`, {
			headers: { accept: 'application/json' }
		});
	} catch {
		throw new ShortURLApiError('The URL service is unavailable.', 503);
	}
	const payload = await responsePayload(response);
	if (!response.ok)
		throw new ShortURLApiError(errorMessage(payload, 'Unable to load this URL.'), response.status);
	const url = normalizeShortURL(responseItem(payload));
	if (!url) throw new ShortURLApiError('The URL service returned an invalid URL.', 502);
	return url;
}

export async function updateShortURL(
	fetcher: typeof fetch,
	id: string,
	request: UpdateURLRequest
): Promise<ShortURL | undefined> {
	let response: Response;
	try {
		response = await fetcher(`${getBackendUrl()}${URLS_PATH}/${encodeURIComponent(id)}`, {
			method: 'PATCH',
			headers: { accept: 'application/json', 'content-type': 'application/json' },
			body: JSON.stringify(request)
		});
	} catch {
		throw new ShortURLApiError('The URL service is unavailable.', 503);
	}
	if (!response.ok) {
		const payload = await responsePayload(response);
		throw new ShortURLApiError(
			errorMessage(payload, 'Unable to update this URL.'),
			response.status
		);
	}
	if (response.status === 204) return undefined;
	const payload = await responsePayload(response);
	return normalizeShortURL(responseItem(payload));
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

export async function getClickCounts(
	fetcher: typeof fetch
): Promise<{ days: number; total: number; items: { date: string; clicks: number }[] }> {
	let response: Response;
	try {
		response = await fetcher(`${getBackendUrl()}/urls/clicks/counts`, {
			headers: { accept: 'application/json' }
		});
	} catch {
		throw new ShortURLApiError('The click service is unavailable.', 503);
	}
	const payload = await responsePayload(response);
	if (!response.ok)
		throw new ShortURLApiError(
			errorMessage(payload, 'Unable to load total clicks.'),
			response.status
		);
	const value = responseItem(payload);
	const validCount = (value: unknown): value is number =>
		typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
	if (
		!isRecord(value) ||
		!validCount(value.days) ||
		value.days < 1 ||
		!validCount(value.total) ||
		!Array.isArray(value.items) ||
		!value.items.every(
			(item) =>
				isRecord(item) &&
				typeof item.date === 'string' &&
				/^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
				Number.isFinite(Date.parse(item.date)) &&
				validCount(item.clicks)
		)
	) {
		throw new ShortURLApiError('The click service returned invalid click counts.', 502);
	}
	return { days: value.days, total: value.total, items: value.items };
}
