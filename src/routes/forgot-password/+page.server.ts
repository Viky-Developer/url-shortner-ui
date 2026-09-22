import { AuthApiError, requestPasswordReset } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,55}$/;

export const actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '')
			.trim()
			.toLowerCase();
		const newPassword = String(formData.get('newPassword') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');
		const values = { email };

		if (!emailPattern.test(email)) {
			return fail(400, {
				success: false,
				message: 'Enter the email address associated with your account.',
				errors: { email: 'Please enter a valid email address.' },
				values
			});
		}
		if (!passwordPattern.test(newPassword)) {
			return fail(400, {
				success: false,
				message: 'Choose a stronger password.',
				errors: {
					newPassword:
						'Use 8–55 characters with uppercase and lowercase letters and at least one number.'
				},
				values
			});
		}
		if (newPassword !== confirmPassword) {
			return fail(400, {
				success: false,
				message: 'The passwords do not match.',
				errors: { confirmPassword: 'Enter the same password again.' },
				values
			});
		}

		try {
			await requestPasswordReset(fetch, { email, newPassword });
			return {
				success: true,
				message: 'Your password has been reset. You can now sign in.',
				errors: {},
				values
			};
		} catch (error) {
			const status =
				error instanceof AuthApiError && error.status >= 400 && error.status <= 599
					? error.status
					: 503;
			return fail(status, {
				success: false,
				message:
					error instanceof AuthApiError
						? error.message
						: 'We could not request a password reset right now. Please try again.',
				errors: {},
				values
			});
		}
	}
} satisfies Actions;
