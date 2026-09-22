import { AuthApiError, registerUser } from '$lib/server/auth';
import { verifyAccessToken } from '$lib/server/access-token';
import { setAuthCookies } from '$lib/server/auth-cookies';
import type { RegisterRequest } from '$lib/types/auth';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,55}$/;

function readString(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

function readPassword(formData: FormData): string {
	const value = formData.get('password');
	return typeof value === 'string' ? value : '';
}

function registrationErrorMessage(status: number): string {
	if (status === 409) return 'An account with this email already exists.';
	if (status === 429) return 'Too many signup attempts. Please wait and try again.';
	if (status >= 500) return 'We could not create your account right now. Please try again.';
	return 'Please check your account details and try again.';
}

export const actions = {
	default: async ({ request, fetch, cookies }) => {
		const formData = await request.formData();
		const email = readString(formData, 'email');
		const password = readPassword(formData);
		const displayName = readString(formData, 'displayName');
		const values = { email, displayName };

		if (!EMAIL_PATTERN.test(email)) {
			return fail(400, {
				success: false,
				message: 'Please enter a valid email address.',
				errors: { email: 'Please enter a valid email address.' },
				values
			});
		}

		if (password.length > 55) {
			return fail(400, {
				success: false,
				message: 'Password is too long. Use no more than 55 characters.',
				errors: { password: 'Password is too long. Use no more than 55 characters.' },
				values
			});
		}

		if (!PASSWORD_PATTERN.test(password)) {
			return fail(400, {
				success: false,
				message: 'Please enter a password that meets every requirement.',
				errors: { password: 'Password does not meet every requirement.' },
				values
			});
		}

		const payload: RegisterRequest = {
			email,
			password,
			...(displayName ? { displayName } : {})
		};

		try {
			const auth = await registerUser(fetch, payload);
			if (!auth.token.accessToken || !auth.token.refreshToken) {
				throw new AuthApiError(
					'The registration response did not include authentication tokens.',
					502
				);
			}
			if (!(await verifyAccessToken(auth.token.accessToken))) {
				throw new AuthApiError('The registration response included an invalid access token.', 502);
			}
			setAuthCookies(cookies, {
				accessToken: auth.token.accessToken,
				refreshToken: auth.token.refreshToken
			});

			return {
				success: true,
				message: 'Account created successfully.',
				user: auth.user,
				errors: {},
				values
			};
		} catch (error) {
			if (error instanceof AuthApiError) {
				const status = error.status >= 400 && error.status <= 599 ? error.status : 502;
				return fail(status, {
					success: false,
					message: registrationErrorMessage(status),
					errors: {},
					values
				});
			}

			return fail(500, {
				success: false,
				message: 'Unable to create your account. Please try again.',
				errors: {},
				values
			});
		}
	}
} satisfies Actions;
