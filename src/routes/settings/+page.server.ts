import { fail, redirect } from '@sveltejs/kit';
import { cancelAccountDeletion, scheduleAccountDeletion } from '$lib/server/account';
import { AuthApiError, changePassword } from '$lib/server/auth';
import { clearAuthCookies, setAccountStatusCookie } from '$lib/server/auth-cookies';
import type { Actions, PageServerLoad } from './$types';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,55}$/;

function passwordValue(form: FormData, name: string): string {
	const value = form.get(name);
	return typeof value === 'string' ? value : '';
}

function handleFailure(error: unknown, cookies: Parameters<typeof clearAuthCookies>[0]) {
	if (error instanceof AuthApiError && error.status === 401) {
		clearAuthCookies(cookies);
		redirect(303, '/login?redirectTo=%2Fsettings');
	}
	return error instanceof AuthApiError
		? error.message
		: 'Unable to manage your account. Please try again.';
}

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	return { user };
};

export const actions: Actions = {
	changePassword: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const currentPassword = passwordValue(form, 'currentPassword');
		const newPassword = passwordValue(form, 'newPassword');
		const confirmPassword = passwordValue(form, 'confirmPassword');

		if (!currentPassword) return fail(400, { error: 'Enter your current password.' });
		if (!PASSWORD_PATTERN.test(newPassword)) {
			return fail(400, {
				error: 'New password must be 8–55 characters with uppercase, lowercase, and a number.'
			});
		}
		if (currentPassword === newPassword) {
			return fail(400, { error: 'New password must be different from your current password.' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'New password and confirmation do not match.' });
		}

		try {
			await changePassword(fetch, { currentPassword, newPassword });
			return { success: 'Password changed successfully.' };
		} catch (error) {
			return fail(error instanceof AuthApiError ? error.status : 500, {
				error: handleFailure(error, cookies)
			});
		}
	},
	scheduleDeletion: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		if (form.get('confirmation') !== 'delete my account') {
			return fail(400, { error: 'Type delete my account to confirm the request.' });
		}
		try {
			await scheduleAccountDeletion(fetch);
		} catch (error) {
			return fail(400, { error: handleFailure(error, cookies) });
		}

		clearAuthCookies(cookies);
		return {
			success: 'Account deletion scheduled. Redirecting to sign in…',
			redirectTo: '/login',
			redirectDelayMs: 2000
		};
	},
	cancelDeletion: async ({ fetch, cookies }) => {
		try {
			await cancelAccountDeletion(fetch);
		} catch (error) {
			return fail(400, { error: handleFailure(error, cookies) });
		}

		setAccountStatusCookie(cookies, 'ACTIVE');
		return {
			success: 'Your account has been restored successfully.',
			redirectTo: '/dashboard'
		};
	}
};
