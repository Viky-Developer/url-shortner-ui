import { env } from '$env/dynamic/private';
import type { AuthenticatedUser } from '$lib/types/auth';
import { jwtVerify } from 'jose';
import { ACCESS_TOKEN_LIFETIME_SECONDS } from './auth-cookies';

const REFRESH_EARLY_SECONDS = 30;
const MINIMUM_HS256_SECRET_BYTES = 32;
const textEncoder = new TextEncoder();

export interface AccessTokenClaims {
	exp: number;
	iat: number;
	subject: string;
	userId: string;
	sessionId: number;
	sessionVersion: number;
	displayName?: string;
	email?: string;
	role?: string;
}

export class AccessTokenConfigurationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AccessTokenConfigurationError';
	}
}

function readString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readPositiveInteger(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function getVerificationKey(): Uint8Array {
	const secret = env.JWT_SECRET_KEY?.trim();
	if (!secret) {
		throw new AccessTokenConfigurationError('JWT_SECRET_KEY is not configured.');
	}

	const key = textEncoder.encode(secret);
	if (key.byteLength < MINIMUM_HS256_SECRET_BYTES) {
		throw new AccessTokenConfigurationError(
			`JWT_SECRET_KEY must contain at least ${MINIMUM_HS256_SECRET_BYTES} bytes.`
		);
	}

	return key;
}

/**
 * Verifies the JWT before exposing any claims for authorization or UI state.
 * The backend remains responsible for checking that the represented session
 * has not been revoked.
 */
export async function verifyAccessToken(
	token: string,
	nowSeconds = Math.floor(Date.now() / 1000)
): Promise<AccessTokenClaims | undefined> {
	const issuer = env.JWT_ISSUER?.trim() || undefined;
	const audience = env.JWT_AUDIENCE?.trim() || undefined;

	try {
		const { payload } = await jwtVerify(token, getVerificationKey(), {
			algorithms: ['HS256'],
			typ: 'JWT',
			requiredClaims: ['sub', 'iat', 'exp'],
			clockTolerance: REFRESH_EARLY_SECONDS,
			currentDate: new Date(nowSeconds * 1000),
			...(issuer ? { issuer } : {}),
			...(audience ? { audience } : {})
		});

		const subject = readString(payload.sub);
		const userId = readString(payload.user_id);
		const sessionId = readPositiveInteger(payload.session_id);
		const sessionVersion = readPositiveInteger(payload.session_version);
		const { exp, iat } = payload;

		if (
			!subject ||
			!userId ||
			subject !== userId ||
			!sessionId ||
			!sessionVersion ||
			typeof exp !== 'number' ||
			typeof iat !== 'number' ||
			!Number.isFinite(exp) ||
			!Number.isFinite(iat) ||
			iat > nowSeconds + REFRESH_EARLY_SECONDS ||
			exp > iat + ACCESS_TOKEN_LIFETIME_SECONDS ||
			exp <= nowSeconds + REFRESH_EARLY_SECONDS
		) {
			return undefined;
		}

		const displayName = readString(payload.display_name);
		const email = readString(payload.email);
		const role = readString(payload.role);

		return {
			exp,
			iat,
			subject,
			userId,
			sessionId,
			sessionVersion,
			...(displayName ? { displayName } : {}),
			...(email ? { email } : {}),
			...(role ? { role } : {})
		};
	} catch (error) {
		if (error instanceof AccessTokenConfigurationError) throw error;
		return undefined;
	}
}

export function accessTokenUserFromClaims(claims: AccessTokenClaims): AuthenticatedUser {
	const emailName = claims.email?.split('@')[0]?.trim();
	return {
		id: claims.userId,
		displayName: claims.displayName || emailName || 'User',
		...(claims.email ? { email: claims.email } : {}),
		...(claims.role ? { role: claims.role } : {})
	};
}
