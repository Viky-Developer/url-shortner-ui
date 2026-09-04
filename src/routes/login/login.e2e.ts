import { expect, test } from '@playwright/test';

const APP_URL = 'http://127.0.0.1:4173';
const BACKEND_URL = 'http://127.0.0.1:18085';

test('signs in through SSR and redirects to the requested protected route', async ({
	context,
	page,
	request
}) => {
	await request.post(`${BACKEND_URL}/__test__/reset-login`);
	await page.goto('/login?redirectTo=%2Fanalytics');

	const submitButton = page.getByRole('button', { name: 'Sign In' });
	await expect(submitButton).toBeDisabled();
	await expect(submitButton).toHaveCSS('cursor', 'not-allowed');

	await page.getByLabel('Email').fill('invalid-email');
	await page.getByTestId('login-password-input').fill('existing-password');
	await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
	await expect(submitButton).toBeDisabled();

	await page.getByLabel('Email').fill('user@example.com');
	await expect(submitButton).toBeEnabled();
	await submitButton.click();

	await expect(page).toHaveURL('/analytics');
	await expect
		.poll(async () => {
			const response = await request.get(`${BACKEND_URL}/__test__/last-login`);
			return response.json();
		})
		.toEqual({
			body: {
				email: 'user@example.com',
				password: 'existing-password'
			},
			authorization: null,
			contentType: 'application/json'
		});

	const authCookies = (await context.cookies(APP_URL)).filter(({ name }) =>
		['access_token', 'refresh_token'].includes(name)
	);
	expect(authCookies.map(({ name }) => name).sort()).toEqual(['access_token', 'refresh_token']);
	expect(authCookies.every(({ httpOnly }) => httpOnly)).toBe(true);

	await page.goto('/login');
	await expect(page).toHaveURL('/dashboard');
});
