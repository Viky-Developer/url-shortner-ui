import { env } from '$env/dynamic/private';
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { accessTokenUserFromClaims, verifyAccessToken } from './access-token';
import { ACCESS_TOKEN_LIFETIME_SECONDS } from './auth-cookies';

const ISSUED_AT = 1_000;
const EXPIRES_AT = ISSUED_AT + ACCESS_TOKEN_LIFETIME_SECONDS;
const VALID_NOW = EXPIRES_AT - 100;

function createToken(
	claims: Record<string, unknown>,
	options: { algorithm?: string; secret?: string } = {}
): string {
	const encode = (value: Record<string, unknown>) =>
		Buffer.from(JSON.stringify(value)).toString('base64url');
	const header = encode({ alg: options.algorithm ?? 'HS256', typ: 'JWT' });
	const payload = encode({
		sub: 'user-id',
		user_id: 'user-id',
		session_id: 17,
		session_version: 1_000,
		...claims
	});
	const unsignedToken = `${header}.${payload}`;
	const signature = createHmac('sha256', options.secret ?? env.JWT_SECRET_KEY)
		.update(unsignedToken)
		.digest('base64url');

	return `${unsignedToken}.${signature}`;
}

describe('access token verification', () => {
	it('accepts a signed token inside the 15-minute lifetime', async () => {
		const claims = await verifyAccessToken(
			createToken({ iat: ISSUED_AT, exp: EXPIRES_AT }),
			VALID_NOW
		);

		expect(claims).toMatchObject({
			subject: 'user-id',
			userId: 'user-id',
			sessionId: 17,
			sessionVersion: 1_000
		});
	});

	it('refreshes a token shortly before it expires', async () => {
		await expect(
			verifyAccessToken(createToken({ iat: ISSUED_AT, exp: EXPIRES_AT }), EXPIRES_AT - 30)
		).resolves.toBeUndefined();
	});

	it('rejects a lifetime longer than 15 minutes', async () => {
		await expect(
			verifyAccessToken(createToken({ iat: ISSUED_AT, exp: EXPIRES_AT + 1 }), VALID_NOW)
		).resolves.toBeUndefined();
	});

	it('rejects a forged signature and an unapproved algorithm', async () => {
		const forged = createToken(
			{ iat: ISSUED_AT, exp: EXPIRES_AT },
			{ secret: 'different-test-secret-key-that-is-long-enough' }
		);
		const wrongAlgorithm = createToken({ iat: ISSUED_AT, exp: EXPIRES_AT }, { algorithm: 'HS512' });

		await expect(verifyAccessToken(forged, VALID_NOW)).resolves.toBeUndefined();
		await expect(verifyAccessToken(wrongAlgorithm, VALID_NOW)).resolves.toBeUndefined();
	});

	it('rejects generic or incomplete authentication claims', async () => {
		const genericToken = createToken({
			sub: undefined,
			user_id: undefined,
			session_id: undefined,
			session_version: undefined,
			authenticated: true,
			iat: ISSUED_AT,
			exp: EXPIRES_AT
		});
		const mismatchedSubject = createToken({
			sub: 'another-user',
			iat: ISSUED_AT,
			exp: EXPIRES_AT
		});

		await expect(verifyAccessToken('not-a-jwt', 1_000)).resolves.toBeUndefined();
		await expect(verifyAccessToken(genericToken, VALID_NOW)).resolves.toBeUndefined();
		await expect(verifyAccessToken(mismatchedSubject, VALID_NOW)).resolves.toBeUndefined();
	});

	it('reads the sidebar identity only from verified claims', async () => {
		const claims = await verifyAccessToken(
			createToken({
				iat: ISSUED_AT,
				exp: EXPIRES_AT,
				display_name: 'Alex Rivera',
				email: 'alex@example.com',
				role: 'USER'
			}),
			VALID_NOW
		);

		expect(claims && accessTokenUserFromClaims(claims)).toEqual({
			id: 'user-id',
			displayName: 'Alex Rivera',
			email: 'alex@example.com',
			role: 'USER'
		});
	});

	it('uses the verified email name when display name is absent', async () => {
		const claims = await verifyAccessToken(
			createToken({
				iat: ISSUED_AT,
				exp: EXPIRES_AT,
				email: 'personal.user@example.com'
			}),
			VALID_NOW
		);

		expect(claims && accessTokenUserFromClaims(claims)).toMatchObject({
			id: 'user-id',
			displayName: 'personal.user'
		});
	});
});
