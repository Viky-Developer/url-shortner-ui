import { AuthApiError, getBackendUrl } from './auth';

export interface Session {
	id: number;
	deviceType?: string;
	deviceName?: string;
	ipAddress?: string;
	country?: string;
	city?: string;
	loggedInAt: string;
	lastActiveAt: string;
	expiresAt?: string;
}

async function request(fetcher: typeof fetch, path: string, method: string): Promise<Response> {
	let response: Response;
	try {
		response = await fetcher(`${getBackendUrl()}/auth/sessions${path}`, {
			method,
			headers: { accept: 'application/json' }
		});
	} catch {
		throw new AuthApiError('The session service is unavailable. Please try again.', 503);
	}
	if (!response.ok) {
		throw new AuthApiError('Unable to manage your sessions. Please try again.', response.status);
	}
	return response;
}

export async function listSessions(fetcher: typeof fetch): Promise<Session[]> {
	const response = await request(fetcher, '', 'GET');
	try {
		const payload: unknown = await response.json();
		const rows =
			payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
		if (!Array.isArray(rows)) throw new Error();
		const ids = new Set<number>();
		return rows.map((row: unknown) => {
			if (
				!row ||
				typeof row !== 'object' ||
				!('id' in row) ||
				typeof row.id !== 'number' ||
				!Number.isSafeInteger(row.id) ||
				row.id <= 0 ||
				ids.has(row.id)
			)
				throw new Error();
			ids.add(row.id);
			const source = row as Record<string, unknown>;
			const result: Session = { id: row.id, loggedInAt: '', lastActiveAt: '' };
			for (const field of [
				'deviceType',
				'deviceName',
				'ipAddress',
				'country',
				'city',
				'loggedInAt',
				'lastActiveAt',
				'expiresAt'
			] as const) {
				const value = source[field];
				if (value !== undefined && value !== null && typeof value !== 'string') throw new Error();
				if (typeof value === 'string') result[field] = value;
			}
			return result;
		});
	} catch {
		throw new AuthApiError('The session service returned an invalid response.', 502);
	}
}

export async function revokeSession(fetcher: typeof fetch, id: number): Promise<void> {
	if (!Number.isSafeInteger(id) || id <= 0) throw new AuthApiError('Invalid session ID.', 400);
	await request(fetcher, `/${id}`, 'DELETE');
}

export async function revokeOtherSessions(fetcher: typeof fetch): Promise<void> {
	await request(fetcher, '/revoke-others', 'POST');
}

export async function revokeAllSessions(fetcher: typeof fetch): Promise<void> {
	await request(fetcher, '/revoke-all', 'POST');
}
