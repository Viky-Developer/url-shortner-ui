import { AuthApiError, loginUser } from '$lib/server/auth';
import { verifyAccessToken } from '$lib/server/access-token';
import { setAuthCookies } from '$lib/server/auth-cookies';
import type { LoginRequest } from '$lib/types/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readString(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

function readPassword(formData: FormData): string {
	const value = formData.get('password');
	return typeof value === 'string' ? value : '';
}

function safeRedirectTarget(url: URL): string {
	const requestedTarget = url.searchParams.get('redirectTo');
	if (!requestedTarget) return '/';

	try {
		const target = new URL(requestedTarget, url.origin);
		if (target.origin !== url.origin || ['/login', '/signup'].includes(target.pathname)) return '/';
		return `${target.pathname}${target.search}${target.hash}`;
	} catch {
		return '/';
	}
}

function loginErrorMessage(status: number): string {
	if (status === 401 || status === 403) return 'The email or password is incorrect.';
	if (status === 409) return 'An active session is preventing sign-in. Please try again.';
	if (status === 429) return 'Too many sign-in attempts. Please wait and try again.';
	if (status >= 500) return 'We could not sign you in right now. Please try again.';
	return 'Please check your credentials and try again.';
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.authenticated) return redirect(303, safeRedirectTarget(url));
	return {};
};

export const actions = {
	default: async ({ request, fetch, cookies, url }) => {
		const formData = await request.formData();
		const email = readString(formData, 'email');
		const password = readPassword(formData);
		const rawRevokeSessionId = readString(formData, 'revokeSessionId');
		const values = { email };

		if (!EMAIL_PATTERN.test(email)) {
			return fail(400, {
				success: false,
				message: 'Please enter a valid email address.',
				errors: { email: 'Please enter a valid email address.' },
				values
			});
		}

		if (!password) {
			return fail(400, {
				success: false,
				message: 'Please enter your password.',
				errors: { password: 'Please enter your password.' },
				values
			});
		}

		let revokeSessionId: number | undefined;
		if (rawRevokeSessionId) {
			revokeSessionId = Number(rawRevokeSessionId);
			if (!Number.isSafeInteger(revokeSessionId) || revokeSessionId <= 0) {
				return fail(400, {
					success: false,
					message: 'The session selected for replacement is invalid.',
					errors: {},
					values
				});
			}
		}

		const payload: LoginRequest = {
			email,
			password,
			...(revokeSessionId ? { revokeSessionId } : {})
		};

		try {
			const auth = await loginUser(fetch, payload);
			if (!auth.token.accessToken || !auth.token.refreshToken) {
				throw new AuthApiError('The sign-in response did not include authentication tokens.', 502);
			}
			if (!(await verifyAccessToken(auth.token.accessToken))) {
				throw new AuthApiError('The sign-in response included an invalid access token.', 502);
			}

			setAuthCookies(cookies, {
				accessToken: auth.token.accessToken,
				refreshToken: auth.token.refreshToken
			});

			return {
				success: true,
				message: 'Signed in successfully.',
				redirectTo: safeRedirectTarget(url),
				user: auth.user,
				errors: {},
				values
			};
		} catch (error) {
			if (error instanceof AuthApiError) {
				const status = error.status >= 400 && error.status <= 599 ? error.status : 502;
				return fail(status, {
					success: false,
					message: loginErrorMessage(status),
					errors: {},
					values
				});
			}

			return fail(500, {
				success: false,
				message: 'We could not sign you in right now. Please try again.',
				errors: {},
				values
			});
		}
	}
} satisfies Actions;
