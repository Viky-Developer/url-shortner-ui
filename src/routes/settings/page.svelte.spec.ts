import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SettingsPage from './+page.svelte';

function renderSettings(changeSuggested?: boolean | null) {
	render(SettingsPage, {
		params: {},
		data: {
			user: {
				id: 'user-1',
				email: 'user@example.com',
				displayName: 'User',
				changeSuggested
			}
		},
		form: null
	});
}

describe('settings page', () => {
	it('shows the password recommendation when a change is suggested', async () => {
		renderSettings(true);

		await expect.element(page.getByText('Password update recommended')).toBeVisible();
	});

	it('hides the password recommendation when a change is not suggested', async () => {
		renderSettings(false);

		await expect.element(page.getByText('Password update recommended')).not.toBeInTheDocument();
	});

	it('validates a different matching password and provides visibility controls', async () => {
		renderSettings(false);
		const currentPassword = page.getByPlaceholder('Enter your current password');
		const newPassword = page.getByPlaceholder('Enter a new password');
		const confirmation = page.getByPlaceholder('Confirm your new password');
		const saveButton = page.getByRole('button', { name: 'Save changes' });

		await currentPassword.fill('Password1');
		await newPassword.fill('Password1');
		await confirmation.fill('Password1');
		await expect.element(saveButton).toBeDisabled();
		await expect
			.element(page.getByText('New password must be different from your current password.'))
			.toBeVisible();

		await newPassword.fill('weak');
		await confirmation.fill('weak');
		await expect.element(saveButton).toBeDisabled();

		await newPassword.fill('Different2');
		await confirmation.fill('Different2');
		await expect.element(saveButton).toBeEnabled();

		await page.getByRole('button', { name: 'Show new password' }).click();
		await expect.element(newPassword).toHaveAttribute('type', 'text');
	});
});
