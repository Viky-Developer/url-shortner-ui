import { ACCESS_TOKEN_LIFETIME_SECONDS } from './auth-cookies';
import type { AuthenticatedUser } from '$lib/types/auth';

const REFRESH_EARLY_SECONDS = 30;

export interface AccessTokenClaims {
	exp: number;
	iat: number;
	userId?: string;
	displayName?: string;
	email?: string;
	role?: string;
}

function decodeBase64Url(value: string): string {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
	return atob(`${normalized}${padding}`);
}

export function readAccessTokenClaims(token: string): AccessTokenClaims | undefined {
	try {
		const parts = token.split('.');
		if (parts.length !== 3 || !parts[1]) return undefined;

		const payload: unknown = JSON.parse(decodeBase64Url(parts[1]));
		if (typeof payload !== 'object' || payload === null) return undefined;

		const { exp, iat, user_id, display_name, email, role } = payload as Record<string, unknown>;
		if (
			typeof exp !== 'number' ||
			!Number.isFinite(exp) ||
			typeof iat !== 'number' ||
			!Number.isFinite(iat)
		) {
			return undefined;
		}

		return {
			exp,
			iat,
			...(typeof user_id === 'string' && user_id.trim() ? { userId: user_id.trim() } : {}),
			...(typeof display_name === 'string' && display_name.trim()
				? { displayName: display_name.trim() }
				: {}),
			...(typeof email === 'string' && email.trim() ? { email: email.trim() } : {}),
			...(typeof role === 'string' && role.trim() ? { role: role.trim() } : {})
		};
	} catch {
		return undefined;
	}
}

export function readAccessTokenUser(token: string): AuthenticatedUser | undefined {
	const claims = readAccessTokenClaims(token);
	if (!claims?.userId) return undefined;

	const emailName = claims.email?.split('@')[0]?.trim();
	return {
		id: claims.userId,
		displayName: claims.displayName || emailName || 'User',
		...(claims.email ? { email: claims.email } : {}),
		...(claims.role ? { role: claims.role } : {})
	};
}

export function isAccessTokenUsable(
	token: string,
	nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
	const claims = readAccessTokenClaims(token);
	if (!claims) return false;

	const enforcedExpiry = Math.min(claims.exp, claims.iat + ACCESS_TOKEN_LIFETIME_SECONDS);

	return enforcedExpiry > nowSeconds + REFRESH_EARLY_SECONDS;
}
