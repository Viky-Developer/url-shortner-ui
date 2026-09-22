import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import {
	createBlockedDomain,
	createBlockedIPRange,
	deleteBlockedDomain,
	deleteBlockedIPRange,
	listBlockedDomains,
	listBlockedIPRanges,
	purgePasswordHistory,
	purgeSessions
} from '$lib/server/admin';
import { AuthApiError } from '$lib/server/auth';
import { clearAuthCookies } from '$lib/server/auth-cookies';
import type { Actions, PageServerLoad } from './$types';

function requireAdmin(event: Pick<RequestEvent, 'locals' | 'url'>): void {
	if (!event.locals.authenticated) {
		const destination = `${event.url.pathname}${event.url.search}`;
		redirect(303, `/login?redirectTo=${encodeURIComponent(destination)}`);
	}
	if (event.locals.user?.role?.trim().toUpperCase() !== 'ADMIN') redirect(303, '/dashboard');
}

function formValue(form: FormData, key: string): string {
	const value = form.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

function formId(form: FormData): number {
	const value = formValue(form, 'id');
	return /^\d+$/.test(value) ? Number(value) : NaN;
}

function formDays(form: FormData): number {
	const value = formValue(form, 'days');
	return /^\d+$/.test(value) ? Number(value) : NaN;
}

function actionFailure(error: unknown, event: Pick<RequestEvent, 'cookies'>, fallback: string) {
	if (error instanceof AuthApiError && error.status === 401) {
		clearAuthCookies(event.cookies);
		redirect(303, '/login?redirectTo=%2Fadmin');
	}
	return fail(error instanceof AuthApiError ? error.status : 500, {
		error: error instanceof AuthApiError ? error.message : fallback
	});
}

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const [domains, ipRanges] = await Promise.allSettled([
		listBlockedDomains(event.fetch),
		listBlockedIPRanges(event.fetch)
	]);
	return {
		domains: domains.status === 'fulfilled' ? domains.value : [],
		domainsError:
			domains.status === 'rejected'
				? domains.reason instanceof AuthApiError
					? domains.reason.message
					: 'Unable to load blocked domains.'
				: null,
		ipRanges: ipRanges.status === 'fulfilled' ? ipRanges.value : [],
		ipRangesError:
			ipRanges.status === 'rejected'
				? ipRanges.reason instanceof AuthApiError
					? ipRanges.reason.message
					: 'Unable to load blocked IP ranges.'
				: null
	};
};

export const actions: Actions = {
	createDomain: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const domain = formValue(form, 'domain');
		const reason = formValue(form, 'reason');
		if (!domain) return fail(400, { error: 'Domain is required.', action: 'createDomain' });
		try {
			await createBlockedDomain(event.fetch, { domain, ...(reason ? { reason } : {}) });
			return { success: 'Domain blocked successfully.', action: 'createDomain' };
		} catch (error) {
			return actionFailure(error, event, 'Unable to block this domain.');
		}
	},
	deleteDomain: async (event) => {
		requireAdmin(event);
		const id = formId(await event.request.formData());
		if (!Number.isSafeInteger(id) || id <= 0)
			return fail(400, { error: 'Invalid blocked-domain ID.', action: 'deleteDomain' });
		try {
			await deleteBlockedDomain(event.fetch, id);
			return { success: 'Domain unblocked successfully.', action: 'deleteDomain' };
		} catch (error) {
			return actionFailure(error, event, 'Unable to unblock this domain.');
		}
	},
	createIPRange: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const cidr = formValue(form, 'cidr');
		const description = formValue(form, 'description');
		if (!cidr || !description)
			return fail(400, {
				error: 'CIDR and description are required.',
				action: 'createIPRange'
			});
		try {
			await createBlockedIPRange(event.fetch, { cidr, description });
			return { success: 'IP range blocked successfully.', action: 'createIPRange' };
		} catch (error) {
			return actionFailure(error, event, 'Unable to block this IP range.');
		}
	},
	deleteIPRange: async (event) => {
		requireAdmin(event);
		const id = formId(await event.request.formData());
		if (!Number.isSafeInteger(id) || id <= 0)
			return fail(400, { error: 'Invalid blocked-IP-range ID.', action: 'deleteIPRange' });
		try {
			await deleteBlockedIPRange(event.fetch, id);
			return { success: 'IP range unblocked successfully.', action: 'deleteIPRange' };
		} catch (error) {
			return actionFailure(error, event, 'Unable to unblock this IP range.');
		}
	},
	purgeSessions: async (event) => {
		requireAdmin(event);
		const days = formDays(await event.request.formData());
		if (!Number.isSafeInteger(days) || days <= 0)
			return fail(400, { error: 'Retention days must be a positive whole number.' });
		try {
			await purgeSessions(event.fetch, days);
			return { success: `Sessions older than ${days} days purged successfully.` };
		} catch (error) {
			return actionFailure(error, event, 'Unable to purge old sessions.');
		}
	},
	purgePasswordHistory: async (event) => {
		requireAdmin(event);
		const days = formDays(await event.request.formData());
		if (!Number.isSafeInteger(days) || days <= 0)
			return fail(400, { error: 'Retention days must be a positive whole number.' });
		try {
			await purgePasswordHistory(event.fetch, days);
			return { success: `Password history older than ${days} days purged successfully.` };
		} catch (error) {
			return actionFailure(error, event, 'Unable to purge password history.');
		}
	}
};
