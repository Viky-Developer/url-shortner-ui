import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';
import { cancelAccountDeletion, scheduleAccountDeletion } from '$lib/server/account';
import { clearAuthCookies, setAccountStatusCookie } from '$lib/server/auth-cookies';
import { AuthApiError, changePassword } from '$lib/server/auth';

vi.mock('$lib/server/account', () => ({
	scheduleAccountDeletion: vi.fn(),
	cancelAccountDeletion: vi.fn()
}));
vi.mock('$lib/server/auth-cookies', () => ({
	clearAuthCookies: vi.fn(),
	setAccountStatusCookie: vi.fn()
}));
vi.mock('$lib/server/auth', async (importOriginal) => {
	const original = await importOriginal<typeof import('$lib/server/auth')>();
	return { ...original, changePassword: vi.fn() };
});

function event(confirmation = 'delete my account') {
	const body = new FormData();
	body.set('confirmation', confirmation);
	return {
		fetch: vi.fn(),
		cookies: {},
		parent: vi.fn().mockResolvedValue({ user: { id: '1', displayName: 'Vicky' } }),
		request: new Request('http://localhost/settings', { method: 'POST', body })
	};
}

type ScheduleEvent = Parameters<NonNullable<typeof actions.scheduleDeletion>>[0];
type CancelEvent = Parameters<NonNullable<typeof actions.cancelDeletion>>[0];
type ChangePasswordEvent = Parameters<NonNullable<typeof actions.changePassword>>[0];

function passwordEvent(currentPassword: string, newPassword: string, confirmPassword: string) {
	const input = event();
	const body = new FormData();
	body.set('currentPassword', currentPassword);
	body.set('newPassword', newPassword);
	body.set('confirmPassword', confirmPassword);
	return {
		...input,
		request: new Request('http://localhost/settings', { method: 'POST', body })
	};
}

beforeEach(() => vi.resetAllMocks());

describe('settings account lifecycle', () => {
	it('changes a valid password', async () => {
		const result = await actions.changePassword(
			passwordEvent('Current1', 'Different2', 'Different2') as unknown as ChangePasswordEvent
		);

		expect(result).toEqual({ success: 'Password changed successfully.' });
		expect(changePassword).toHaveBeenCalledWith(expect.any(Function), {
			currentPassword: 'Current1',
			newPassword: 'Different2'
		});
	});

	it('rejects a reused current password', async () => {
		const result = await actions.changePassword(
			passwordEvent('Password1', 'Password1', 'Password1') as unknown as ChangePasswordEvent
		);

		expect(result).toMatchObject({ status: 400 });
		expect(changePassword).not.toHaveBeenCalled();
	});

	it('rejects a weak or mismatched new password', async () => {
		const weak = await actions.changePassword(
			passwordEvent('Current1', 'weak', 'weak') as unknown as ChangePasswordEvent
		);
		const mismatched = await actions.changePassword(
			passwordEvent('Current1', 'Different2', 'Different3') as unknown as ChangePasswordEvent
		);

		expect(weak).toMatchObject({ status: 400 });
		expect(mismatched).toMatchObject({ status: 400 });
		expect(changePassword).not.toHaveBeenCalled();
	});

	it('loads account state from the authenticated user response', async () => {
		const input = event();
		await expect(load(input as unknown as Parameters<typeof load>[0])).resolves.toEqual({
			user: { id: '1', displayName: 'Vicky' }
		});
	});

	it('requires explicit deletion confirmation', async () => {
		const result = await actions.scheduleDeletion(event('delete') as unknown as ScheduleEvent);
		expect(result).toMatchObject({ status: 400 });
		expect(scheduleAccountDeletion).not.toHaveBeenCalled();
	});

	it('keeps the recovery session and marks a newly scheduled deletion as pending', async () => {
		const result = await actions.scheduleDeletion(event() as unknown as ScheduleEvent);
		expect(result).toEqual({
			success: 'Account deletion scheduled. Opening account recovery…',
			redirectTo: '/settings',
			redirectDelayMs: 3000
		});
		expect(scheduleAccountDeletion).toHaveBeenCalledOnce();
		expect(setAccountStatusCookie).toHaveBeenCalledWith(expect.anything(), 'PENDING_DELETION');
		expect(clearAuthCookies).not.toHaveBeenCalled();
	});

	it('synchronizes an account that the backend reports is already pending deletion', async () => {
		vi.mocked(scheduleAccountDeletion).mockRejectedValue(
			new AuthApiError('account is already PENDING_DELETION', 409)
		);

		const result = await actions.scheduleDeletion(event() as unknown as ScheduleEvent);

		expect(result).toEqual({
			success: 'Account deletion is already pending. Opening account recovery…',
			redirectTo: '/settings',
			redirectDelayMs: 3000
		});
		expect(setAccountStatusCookie).toHaveBeenCalledWith(expect.anything(), 'PENDING_DELETION');
		expect(clearAuthCookies).not.toHaveBeenCalled();
	});

	it('restores an account and returns the dashboard destination', async () => {
		const result = await actions.cancelDeletion(event() as unknown as CancelEvent);
		expect(result).toEqual({
			success: 'Your account has been restored successfully.',
			redirectTo: '/dashboard'
		});
		expect(cancelAccountDeletion).toHaveBeenCalledOnce();
		expect(setAccountStatusCookie).toHaveBeenCalledWith(expect.anything(), 'ACTIVE');
	});
});
