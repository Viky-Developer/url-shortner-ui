import { env } from '$env/dynamic/private';
import type { AuthResponse, AuthTokens, RegisterRequest, UserResponse } from '$lib/types/auth';

const REGISTER_PATH = '/auth/register';
const REFRESH_PATH = '/auth/refresh';
const LOGOUT_PATH = '/auth/logout';

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
		isRecord(value.token) &&
		isNullableString(value.token.accessToken) &&
		isNullableString(value.token.refreshToken) &&
		isUserResponse(value.user)
	);
}

function isAuthTokens(value: unknown): value is AuthTokens {
	return (
		isRecord(value) &&
		typeof value.accessToken === 'string' &&
		value.accessToken.length > 0 &&
		typeof value.refreshToken === 'string' &&
		value.refreshToken.length > 0
	);
}

function extractAuthResponse(payload: unknown): AuthResponse | undefined {
	if (isAuthResponse(payload)) return payload;
	if (!isRecord(payload) || !Array.isArray(payload.data)) return undefined;

	const authResponse = payload.data[0];
	return isAuthResponse(authResponse) ? authResponse : undefined;
}

function extractRefreshTokenResponse(payload: unknown): AuthTokens | undefined {
	if (isAuthTokens(payload)) return payload;
	if (!isRecord(payload) || !Array.isArray(payload.data)) return undefined;

	const refreshResponse = payload.data[0];
	return isAuthTokens(refreshResponse) ? refreshResponse : undefined;
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
	const backendUrl = getBackendUrl();

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

export async function refreshAccessToken(
	fetcher: typeof globalThis.fetch,
	accessToken: string,
	refreshToken: string
): Promise<AuthTokens> {
	const backendUrl = getBackendUrl();
	let response: Response;

	try {
		response = await fetcher(`${backendUrl}${REFRESH_PATH}`, {
			method: 'POST',
			headers: {
				accept: 'application/json',
				authorization: `Bearer ${accessToken}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({ refreshToken })
		});
	} catch {
		throw new AuthApiError('The authentication service is unavailable.', 503);
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		throw new AuthApiError('The authentication service returned an invalid response.', 502);
	}

	if (!response.ok) {
		throw new AuthApiError(
			getErrorMessage(payload) || 'Unable to refresh the session.',
			response.status
		);
	}

	const refreshResponse = extractRefreshTokenResponse(payload);
	if (!refreshResponse) {
		throw new AuthApiError('The authentication service returned an invalid response.', 502);
	}

	return refreshResponse;
}

export async function logoutUser(
	fetcher: typeof globalThis.fetch,
	refreshToken: string
): Promise<void> {
	const backendUrl = getBackendUrl();
	let response: Response;

	try {
		response = await fetcher(`${backendUrl}${LOGOUT_PATH}`, {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json'
			},
			body: JSON.stringify({ refreshToken })
		});
	} catch {
		throw new AuthApiError('The logout service is unavailable.', 503);
	}

	if (!response.ok) {
		throw new AuthApiError('Unable to sign out from the server.', response.status);
	}
}

export function getBackendUrl(): string {
	const configuredBackendUrl = env.APP_ENV?.trim();
	if (!configuredBackendUrl) {
		throw new AuthApiError('The backend API URL is not configured.', 500);
	}

	try {
		const parsedBackendUrl = new URL(configuredBackendUrl);
		if (parsedBackendUrl.protocol !== 'http:' && parsedBackendUrl.protocol !== 'https:') {
			throw new Error();
		}
		return parsedBackendUrl.href.replace(/\/$/, '');
	} catch {
		throw new AuthApiError('The backend API URL is invalid.', 500);
	}
}
