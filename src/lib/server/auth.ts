import { env } from '$env/dynamic/private';
import type { AuthResponse, RegisterRequest, UserResponse } from '$lib/types/auth';

const REGISTER_PATH = '/auth/register';

export class AuthApiError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'AuthApiError';
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
	return typeof value === 'string' || value === null;
}

function isUserResponse(value: unknown): value is UserResponse {
	return (
		isRecord(value) &&
		isNullableString(value.id) &&
		isNullableString(value.email) &&
		(value.displayName === undefined || isNullableString(value.displayName)) &&
		(value.role === undefined || isNullableString(value.role)) &&
		(value.passwordAgeDays === undefined ||
			value.passwordAgeDays === null ||
			typeof value.passwordAgeDays === 'number') &&
		(value.changeSuggested === undefined ||
			value.changeSuggested === null ||
			typeof value.changeSuggested === 'boolean')
	);
}

function isAuthResponse(value: unknown): value is AuthResponse {
	return (
		isRecord(value) &&
		isNullableString(value.accessToken) &&
		isNullableString(value.refreshToken) &&
		isUserResponse(value.user)
	);
}

function extractAuthResponse(payload: unknown): AuthResponse | undefined {
	if (isAuthResponse(payload)) return payload;
	if (!isRecord(payload) || !Array.isArray(payload.data)) return undefined;

	const authResponse = payload.data[0];
	return isAuthResponse(authResponse) ? authResponse : undefined;
}

function getErrorMessage(payload: unknown): string | undefined {
	if (!isRecord(payload)) return undefined;

	for (const key of ['message', 'error', 'detail']) {
		const value = payload[key];
		if (typeof value === 'string' && value.trim()) return value;
		if (isRecord(value) && typeof value.message === 'string' && value.message.trim()) {
			return value.message;
		}
	}

	return undefined;
}

export async function registerUser(
	fetcher: typeof globalThis.fetch,
	request: RegisterRequest
): Promise<AuthResponse> {
	const configuredBackendUrl = env.APP_ENV?.trim();
	if (!configuredBackendUrl) {
		throw new AuthApiError('The backend API URL is not configured.', 500);
	}

	let backendUrl: string;
	try {
		const parsedBackendUrl = new URL(configuredBackendUrl);
		if (parsedBackendUrl.protocol !== 'http:' && parsedBackendUrl.protocol !== 'https:')
			throw new Error();
		backendUrl = parsedBackendUrl.href.replace(/\/$/, '');
	} catch {
		throw new AuthApiError('The backend API URL is invalid.', 500);
	}

	let response: Response;

	try {
		response = await fetcher(`${backendUrl}${REGISTER_PATH}`, {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json'
			},
			body: JSON.stringify(request)
		});
	} catch {
		throw new AuthApiError('The registration service is unavailable. Please try again.', 503);
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		throw new AuthApiError(
			response.ok
				? 'The registration service returned an invalid response.'
				: 'Unable to create your account. Please try again.',
			response.ok ? 502 : response.status
		);
	}

	if (!response.ok) {
		throw new AuthApiError(
			getErrorMessage(payload) || 'Unable to create your account. Please try again.',
			response.status
		);
	}

	const authResponse = extractAuthResponse(payload);
	if (!authResponse) {
		throw new AuthApiError('The registration service returned an invalid response.', 502);
	}

	return authResponse;
}
