import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';
import { verifyAccessToken } from '$lib/server/access-token';
import { clearAuthCookies } from '$lib/server/auth-cookies';
import {
	listSessions,
	revokeSession,
	revokeAllSessions,
	revokeOtherSessions
} from '$lib/server/sessions';
import { AuthApiError } from '$lib/server/auth';

vi.mock('$lib/server/access-token', () => ({ verifyAccessToken: vi.fn() }));
vi.mock('$lib/server/auth-cookies', () => ({ clearAuthCookies: vi.fn() }));
vi.mock('$lib/server/sessions', () => ({
	listSessions: vi.fn(),
	revokeSession: vi.fn(),
	revokeAllSessions: vi.fn(),
	revokeOtherSessions: vi.fn()
}));

function event(id = '2') {
	const body = new FormData();
	body.set('id', id);
	return {
		locals: { authenticated: true, accessToken: 'token' },
		cookies: {},
		fetch: vi.fn(),
		request: new Request('http://localhost/sessions', { method: 'POST', body })
	};
}
// Route event fixtures intentionally supply only fields used by these handlers.
type ActionEvent = Parameters<NonNullable<typeof actions.revoke>>[0];

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(verifyAccessToken).mockResolvedValue({ sessionId: 1 } as Awaited<
		ReturnType<typeof verifyAccessToken>
	>);
});

describe('session actions', () => {
	it('rejects individual revocation of the current session', async () => {
		const result = await actions.revoke(event('1') as unknown as ActionEvent);
		expect(result).toMatchObject({ status: 400 });
		expect(revokeSession).not.toHaveBeenCalled();
	});
	it.each(['-1', 'NaN', '1.2', 'revoke-all', '9007199254740992'])(
		'rejects invalid ID %s',
		async (id) => {
			expect(await actions.revoke(event(id) as unknown as ActionEvent)).toMatchObject({
				status: 400
			});
			expect(revokeSession).not.toHaveBeenCalled();
		}
	);
	it('revokes an eligible session', async () => {
		const input = event();
		expect(await actions.revoke(input as unknown as ActionEvent)).toMatchObject({
			success: 'Session revoked.'
		});
		expect(revokeSession).toHaveBeenCalledWith(input.fetch, 2);
	});
	it('keeps authentication when revoking other sessions', async () => {
		await actions.revokeOthers(event() as unknown as ActionEvent);
		expect(revokeOtherSessions).toHaveBeenCalledOnce();
		expect(clearAuthCookies).not.toHaveBeenCalled();
	});
	it('clears authentication and redirects after revoke all', async () => {
		await expect(actions.revokeAll(event() as unknown as ActionEvent)).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
		expect(revokeAllSessions).toHaveBeenCalledOnce();
		expect(clearAuthCookies).toHaveBeenCalledOnce();
	});
	it('preserves authentication if revoke all fails', async () => {
		vi.mocked(revokeAllSessions).mockRejectedValue(new AuthApiError('Unavailable', 503));
		expect(await actions.revokeAll(event() as unknown as ActionEvent)).toMatchObject({
			data: { error: 'Unavailable' }
		});
		expect(clearAuthCookies).not.toHaveBeenCalled();
	});
	it('requires authentication before mutation', async () => {
		vi.mocked(verifyAccessToken).mockResolvedValue(undefined);
		await expect(actions.revokeOthers(event() as unknown as ActionEvent)).rejects.toMatchObject({
			status: 303
		});
		expect(revokeOtherSessions).not.toHaveBeenCalled();
	});
	it('redirects when backend rejects a revoked token', async () => {
		vi.mocked(listSessions).mockRejectedValue(new AuthApiError('Unauthorized', 401));
		await expect(load(event() as unknown as Parameters<typeof load>[0])).rejects.toMatchObject({
			status: 303
		});
		expect(clearAuthCookies).toHaveBeenCalledOnce();
	});
});
