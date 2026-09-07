import { AuthApiError, getBackendUrl } from './auth';

const ACCOUNT_PATH = '/account';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

async function request(
	fetcher: typeof fetch,
	path: string,
	method: string,
	body?: Record<string, string>
): Promise<Response> {
	let response: Response;
	try {
		response = await fetcher(`${getBackendUrl()}${ACCOUNT_PATH}${path}`, {
			method,
			...(method === 'GET' ? { cache: 'no-store' } : {}),
			headers: {
				accept: 'application/json',
				...(body ? { 'content-type': 'application/json' } : {})
			},
			...(body ? { body: JSON.stringify(body) } : {})
		});
	} catch {
		throw new AuthApiError('The account service is unavailable. Please try again.', 503);
	}

	if (!response.ok) {
		let message = 'Unable to update your account. Please try again.';
		try {
			const payload: unknown = await response.json();
			if (isRecord(payload) && typeof payload.message === 'string' && payload.message.trim()) {
				message = payload.message;
			}
		} catch {
			// Use the safe fallback when the backend response is not JSON.
		}
		throw new AuthApiError(message, response.status);
	}
	return response;
}

export async function scheduleAccountDeletion(fetcher: typeof fetch): Promise<void> {
	await request(fetcher, '', 'DELETE', { confirmation: 'DELETE' });
}

export async function cancelAccountDeletion(fetcher: typeof fetch): Promise<void> {
	await request(fetcher, '/cancel-deletion', 'POST');
}
