import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { verifyAccessToken } from '$lib/server/access-token';
import { AuthApiError } from '$lib/server/auth';
import { clearAuthCookies } from '$lib/server/auth-cookies';
import {
	listSessions,
	revokeAllSessions,
	revokeOtherSessions,
	revokeSession
} from '$lib/server/sessions';
import type { Actions, PageServerLoad } from './$types';

async function requireSession(event: Pick<RequestEvent, 'locals' | 'cookies'>) {
	const claims =
		event.locals.authenticated && event.locals.accessToken
			? await verifyAccessToken(event.locals.accessToken)
			: undefined;
	if (!claims) {
		clearAuthCookies(event.cookies);
		redirect(303, '/login?redirectTo=%2Fsessions');
	}
	return claims.sessionId;
}

function handleFailure(error: unknown, event: Pick<RequestEvent, 'cookies'>) {
	if (error instanceof AuthApiError && error.status === 401) {
		clearAuthCookies(event.cookies);
		redirect(303, '/login?redirectTo=%2Fsessions');
	}
	return error instanceof AuthApiError
		? error.message
		: 'Unable to manage your sessions. Please try again.';
}

export const load: PageServerLoad = async (event) => {
	const currentSessionId = await requireSession(event);
	try {
		const sessions = await listSessions(event.fetch);
		return { sessions, currentSessionId, loadError: null };
	} catch (error) {
		return { sessions: [], currentSessionId, loadError: handleFailure(error, event) };
	}
};

export const actions: Actions = {
	revoke: async (event) => {
		const currentId = await requireSession(event);
		const form = await event.request.formData();
		const rawId = form.get('id');
		const id = typeof rawId === 'string' && /^\d+$/.test(rawId) ? Number(rawId) : NaN;
		if (!Number.isSafeInteger(id) || id <= 0) return fail(400, { error: 'Invalid session ID.' });
		if (id === currentId)
			return fail(400, { error: 'Use Revoke all sessions to sign out this device.' });
		try {
			await revokeSession(event.fetch, id);
		} catch (error) {
			return fail(400, { error: handleFailure(error, event) });
		}
		return { success: 'Session revoked.' };
	},
	revokeOthers: async (event) => {
		await requireSession(event);
		try {
			await revokeOtherSessions(event.fetch);
		} catch (error) {
			return fail(400, { error: handleFailure(error, event) });
		}
		return { success: 'Other sessions revoked. This device is still signed in.' };
	},
	revokeAll: async (event) => {
		await requireSession(event);
		try {
			await revokeAllSessions(event.fetch);
		} catch (error) {
			return fail(400, { error: handleFailure(error, event) });
		}
		clearAuthCookies(event.cookies);
		redirect(303, '/login');
	}
};
