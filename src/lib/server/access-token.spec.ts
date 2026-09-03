import { describe, expect, it } from 'vitest';
import { isAccessTokenUsable, readAccessTokenClaims, readAccessTokenUser } from './access-token';

function createToken(claims: Record<string, unknown>): string {
	const encode = (value: Record<string, unknown>) =>
		Buffer.from(JSON.stringify(value)).toString('base64url');

	return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
}

describe('access token lifetime', () => {
	it('accepts a token that is inside the 15-minute lifetime', () => {
		const token = createToken({ iat: 1_000, exp: 1_900 });

		expect(isAccessTokenUsable(token, 1_800)).toBe(true);
	});

	it('refreshes a token shortly before it expires', () => {
		const token = createToken({ iat: 1_000, exp: 1_900 });

		expect(isAccessTokenUsable(token, 1_870)).toBe(false);
	});

	it('enforces 15 minutes even if a token claims a later expiry', () => {
		const token = createToken({ iat: 1_000, exp: 5_000 });

		expect(isAccessTokenUsable(token, 1_871)).toBe(false);
	});

	it('rejects malformed or incomplete JWT claims', () => {
		expect(readAccessTokenClaims('not-a-jwt')).toBeUndefined();
		expect(isAccessTokenUsable(createToken({ exp: 1_900 }), 1_000)).toBe(false);
	});

	it('reads the sidebar identity from access-token claims', () => {
		const token = createToken({
			iat: 1_000,
			exp: 1_900,
			user_id: '82ef-912c',
			display_name: 'Alex Rivera',
			email: 'alex@example.com',
			role: 'USER'
		});

		expect(readAccessTokenUser(token)).toEqual({
			id: '82ef-912c',
			displayName: 'Alex Rivera',
			email: 'alex@example.com',
			role: 'USER'
		});
	});

	it('uses the email name when display name is not present', () => {
		const token = createToken({
			iat: 1_000,
			exp: 1_900,
			user_id: 'user-id',
			email: 'personal.user@example.com'
		});

		expect(readAccessTokenUser(token)).toMatchObject({
			id: 'user-id',
			displayName: 'personal.user'
		});
	});
});
