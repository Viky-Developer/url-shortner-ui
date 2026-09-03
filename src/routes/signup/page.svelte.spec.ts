import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SignupPage from './+page.svelte';

describe('signup page', () => {
	it('validates the form and toggles password visibility', async () => {
		render(SignupPage);

		const submitButton = page.getByRole('button', { name: 'Create Account' });
		const passwordInput = page.getByLabelText('Password');

		await expect.element(submitButton).toBeDisabled();
		await expect
			.element(page.getByRole('progressbar', { name: 'Password requirements completed' }))
			.not.toBeInTheDocument();
		await expect.element(page.getByText('At least 8 characters')).not.toBeInTheDocument();

		await page.getByLabelText('Email').fill('not-an-email');
		await expect
			.element(page.getByText('Please enter a valid email address.'))
			.not.toBeInTheDocument();
		await passwordInput.fill('short');

		await expect.element(submitButton).toBeDisabled();
		await expect
			.element(page.getByRole('progressbar', { name: 'Password requirements completed' }))
			.toBeVisible();
		await expect.element(page.getByText('Please enter a valid email address.')).toBeVisible();
		await expect.element(page.getByText('At least 8 characters')).toBeVisible();

		await page.getByLabelText('Email').fill('user@example.com');
		await passwordInput.fill('lowercase1');
		await expect.element(submitButton).toBeDisabled();
		await expect.element(page.getByText('1 uppercase letter')).toBeVisible();
		await expect.element(page.getByText('1 lowercase letter')).not.toBeInTheDocument();
		await expect.element(page.getByText('1 number')).not.toBeInTheDocument();

		await passwordInput.fill('UPPERCASE1');
		await expect.element(submitButton).toBeDisabled();

		await passwordInput.fill(`Password1${'x'.repeat(47)}`);
		await expect.element(submitButton).toBeDisabled();
		await expect
			.element(page.getByText('Password is too long. Use no more than 55 characters.'))
			.toBeVisible();

		await passwordInput.fill('Valid long Password 1');

		await expect.element(submitButton).toBeEnabled();
		await expect
			.element(page.getByRole('progressbar', { name: 'Password requirements completed' }))
			.not.toBeInTheDocument();
		await expect.element(passwordInput).toHaveAttribute('type', 'password');

		await page.getByRole('button', { name: 'Show password' }).click();
		await expect.element(passwordInput).toHaveAttribute('type', 'text');
		await expect.element(page.getByText('1 uppercase letter')).not.toBeInTheDocument();
		await expect.element(page.getByText('1 lowercase letter')).not.toBeInTheDocument();
		await expect.element(page.getByText('1 number')).not.toBeInTheDocument();
	});
});
