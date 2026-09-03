import { expect, test } from '@playwright/test';

test('submits registration only after Create Account is clicked', async ({ page }) => {
	let submittedForm: URLSearchParams | undefined;

	await page.route('**/signup', async (route) => {
		if (route.request().method() !== 'POST') {
			await route.continue();
			return;
		}

		submittedForm = new URLSearchParams(route.request().postData() ?? '');
		await route.abort('blockedbyclient');
	});

	await page.goto('/signup');

	const submitButton = page.getByRole('button', { name: 'Create Account' });
	await expect(submitButton).toBeDisabled();
	await expect(submitButton).toHaveCSS('cursor', 'not-allowed');

	await page.getByLabel('Email').fill('user@example.com');
	await page.getByTestId('password-input').fill(`Password1${'x'.repeat(47)}`);

	await expect(submitButton).toBeDisabled();
	await expect(
		page.getByText('Password is too long. Use no more than 55 characters.')
	).toBeVisible();
	expect(submittedForm).toBeUndefined();

	await page.getByTestId('password-input').fill('Password1');

	await expect(submitButton).toBeEnabled();
	await expect(
		page.getByRole('progressbar', { name: 'Password requirements completed' })
	).not.toBeVisible();
	expect(submittedForm).toBeUndefined();

	await submitButton.click();
	await expect.poll(() => submittedForm).toBeDefined();
	expect(submittedForm?.get('email')).toBe('user@example.com');
	expect(submittedForm?.get('password')).toBe('Password1');
});
