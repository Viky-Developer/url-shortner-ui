import { AuthApiError, getBackendUrl } from './auth';
import type {
	BlockedDomain,
	BlockedIPRange,
	CreateBlockedDomainRequest,
	CreateBlockedIPRangeRequest
} from '$lib/types/admin';

const ADMIN_PATH = '/admin';

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

async function responsePayload(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		throw new AuthApiError('The admin service returned an invalid response.', 502);
	}
}

function responseItems(payload: unknown): unknown[] {
	if (Array.isArray(payload)) return payload;
	if (isRecord(payload) && Array.isArray(payload.data)) return payload.data;
	throw new AuthApiError('The admin service returned an invalid response.', 502);
}

function errorMessage(payload: unknown, fallback: string): string {
	if (!isRecord(payload)) return fallback;
	for (const key of ['message', 'error', 'detail']) {
		const value = payload[key];
		if (typeof value === 'string' && value.trim()) return value;
	}
	return fallback;
}

async function request(
	fetcher: typeof fetch,
	path: string,
	init: RequestInit = {},
	fallback: string
): Promise<Response> {
	let response: Response;
	try {
		response = await fetcher(`${getBackendUrl()}${ADMIN_PATH}${path}`, {
			...init,
			headers: {
				accept: 'application/json',
				...(init.body ? { 'content-type': 'application/json' } : {}),
				...init.headers
			}
		});
	} catch {
		throw new AuthApiError('The admin service is unavailable. Please try again.', 503);
	}
	if (!response.ok) {
		let payload: unknown;
		try {
			payload = await response.json();
		} catch {
			payload = undefined;
		}
		throw new AuthApiError(errorMessage(payload, fallback), response.status);
	}
	return response;
}

function positiveId(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function blockedDomain(value: unknown): BlockedDomain | undefined {
	if (!isRecord(value)) return undefined;
	const id = positiveId(value.id);
	if (!id || typeof value.domain !== 'string') return undefined;
	return {
		id,
		domain: value.domain,
		reason: typeof value.reason === 'string' ? value.reason : '',
		createdAt: typeof value.createdAt === 'string' ? value.createdAt : ''
	};
}

function blockedIPRange(value: unknown): BlockedIPRange | undefined {
	if (!isRecord(value)) return undefined;
	const id = positiveId(value.id);
	if (!id || typeof value.cidr !== 'string' || typeof value.description !== 'string')
		return undefined;
	return { id, cidr: value.cidr, description: value.description };
}

function parseItems<T>(payload: unknown, parser: (value: unknown) => T | undefined): T[] {
	const parsed = responseItems(payload).map(parser);
	if (parsed.some((item) => item === undefined))
		throw new AuthApiError('The admin service returned an invalid response.', 502);
	return parsed as T[];
}

function validateId(id: number): void {
	if (!Number.isSafeInteger(id) || id <= 0) throw new AuthApiError('Invalid block-list ID.', 400);
}

export async function listBlockedDomains(fetcher: typeof fetch): Promise<BlockedDomain[]> {
	const response = await request(
		fetcher,
		'/blocked-domains',
		{ cache: 'no-store' },
		'Unable to load blocked domains.'
	);
	return parseItems(await responsePayload(response), blockedDomain);
}

export async function createBlockedDomain(
	fetcher: typeof fetch,
	payload: CreateBlockedDomainRequest
): Promise<void> {
	await request(
		fetcher,
		'/blocked-domains',
		{ method: 'POST', body: JSON.stringify(payload) },
		'Unable to block this domain.'
	);
}

export async function deleteBlockedDomain(fetcher: typeof fetch, id: number): Promise<void> {
	validateId(id);
	await request(
		fetcher,
		`/blocked-domains/${id}`,
		{ method: 'DELETE' },
		'Unable to unblock this domain.'
	);
}

export async function listBlockedIPRanges(fetcher: typeof fetch): Promise<BlockedIPRange[]> {
	const response = await request(
		fetcher,
		'/blocked-ip-ranges',
		{ cache: 'no-store' },
		'Unable to load blocked IP ranges.'
	);
	return parseItems(await responsePayload(response), blockedIPRange);
}

export async function createBlockedIPRange(
	fetcher: typeof fetch,
	payload: CreateBlockedIPRangeRequest
): Promise<void> {
	await request(
		fetcher,
		'/blocked-ip-ranges',
		{ method: 'POST', body: JSON.stringify(payload) },
		'Unable to block this IP range.'
	);
}

export async function deleteBlockedIPRange(fetcher: typeof fetch, id: number): Promise<void> {
	validateId(id);
	await request(
		fetcher,
		`/blocked-ip-ranges/${id}`,
		{ method: 'DELETE' },
		'Unable to unblock this IP range.'
	);
}

function validateRetentionDays(days: number): void {
	if (!Number.isSafeInteger(days) || days <= 0)
		throw new AuthApiError('Retention days must be a positive whole number.', 400);
}

export async function purgeSessions(fetcher: typeof fetch, days: number): Promise<void> {
	validateRetentionDays(days);
	await request(
		fetcher,
		`/maintenance/purge-sessions?days=${days}`,
		{ method: 'POST' },
		'Unable to purge old sessions.'
	);
}

export async function purgePasswordHistory(fetcher: typeof fetch, days: number): Promise<void> {
	validateRetentionDays(days);
	await request(
		fetcher,
		`/maintenance/purge-password-history?days=${days}`,
		{ method: 'POST' },
		'Unable to purge password history.'
	);
}
