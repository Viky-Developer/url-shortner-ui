import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthApiError, requestPasswordReset } from '$lib/server/auth';
import { actions } from './+page.server';

vi.mock('$lib/server/auth', async (importOriginal) => {
	const original = await importOriginal<typeof import('$lib/server/auth')>();
	return { ...original, requestPasswordReset: vi.fn() };
});

type ActionEvent = Parameters<NonNullable<typeof actions.default>>[0];

function event(
	email: string,
	newPassword = 'Different2',
	confirmPassword = newPassword
): ActionEvent {
	const body = new FormData();
	body.set('email', email);
	body.set('newPassword', newPassword);
	body.set('confirmPassword', confirmPassword);
	return {
		fetch: vi.fn(),
		request: new Request('http://localhost/forgot-password', { method: 'POST', body })
	} as unknown as ActionEvent;
}

beforeEach(() => vi.resetAllMocks());

describe('forgot-password action', () => {
	it('normalizes the email and resets the password', async () => {
		const result = await actions.default(event('  USER@Example.com  '));

		expect(requestPasswordReset).toHaveBeenCalledWith(expect.any(Function), {
			email: 'user@example.com',
			newPassword: 'Different2'
		});
		expect(result).toMatchObject({
			success: true,
			message: expect.stringContaining('password has been reset')
		});
	});

	it('rejects an invalid email before calling the backend', async () => {
		const result = await actions.default(event('invalid-email'));

		expect(result).toMatchObject({ status: 400 });
		expect(requestPasswordReset).not.toHaveBeenCalled();
	});

	it('rejects a weak or mismatched password before calling the backend', async () => {
		const weak = await actions.default(event('user@example.com', 'weak'));
		const mismatched = await actions.default(event('user@example.com', 'Different2', 'Different3'));

		expect(weak).toMatchObject({ status: 400 });
		expect(mismatched).toMatchObject({ status: 400 });
		expect(requestPasswordReset).not.toHaveBeenCalled();
	});

	it('preserves the backend password-reuse message for the error toast', async () => {
		vi.mocked(requestPasswordReset).mockRejectedValue(
			new AuthApiError('New password cannot be current password.', 409)
		);

		const result = await actions.default(event('user@example.com'));

		expect(result).toMatchObject({
			status: 409,
			data: { message: 'New password cannot be current password.' }
		});
	});
});
