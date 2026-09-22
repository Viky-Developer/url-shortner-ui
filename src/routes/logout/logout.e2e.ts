import { expect, test } from '@playwright/test';
import { createHmac } from 'node:crypto';

const APP_URL = 'http://127.0.0.1:4173';
const BACKEND_URL = 'http://127.0.0.1:18085';
const TEST_JWT_SECRET = 'playwright-jwt-secret-key-for-linkflow-tests';
const accessTokenExpiryMinutes = Number(process.env.ACCESS_TOKEN_EXPIRY);

if (!Number.isSafeInteger(accessTokenExpiryMinutes) || accessTokenExpiryMinutes <= 0) {
	throw new Error('ACCESS_TOKEN_EXPIRY must be a positive integer.');
}

function createAccessToken(): string {
	const now = Math.floor(Date.now() / 1000);
	const encode = (value: Record<string, unknown>) =>
		Buffer.from(JSON.stringify(value)).toString('base64url');
	const header = encode({ alg: 'HS256', typ: 'JWT' });
	const payload = encode({
		user_id: 'USR_9ZL2zWWN4iW',
		sub: 'USR_9ZL2zWWN4iW',
		email: 'nekaz@mailinator.com',
		display_name: 'Len Blair',
		role: 'USER',
		session_id: 17,
		session_version: now,
		iat: now,
		exp: now + accessTokenExpiryMinutes * 60
	});
	const unsignedToken = `${header}.${payload}`;
	const signature = createHmac('sha256', TEST_JWT_SECRET).update(unsignedToken).digest('base64url');

	return `${unsignedToken}.${signature}`;
}

test('signs out through the backend API and removes authentication cookies', async ({
	context,
	page,
	request
}) => {
	await request.post(`${BACKEND_URL}/__test__/reset`);
	const accessToken = createAccessToken();

	await context.addCookies([
		{
			name: 'access_token',
			value: accessToken,
			url: APP_URL,
			httpOnly: true,
			sameSite: 'Lax'
		},
		{
			name: 'refresh_token',
			value: 'refresh-token',
			url: APP_URL,
			httpOnly: true,
			sameSite: 'Lax'
		}
	]);

	await page.goto('/');
	await page.getByRole('button', { name: 'Open account menu' }).click();
	const accountMenu = page.locator('[data-slot="popover-content"]');
	await expect(accountMenu.getByText('USER', { exact: true })).toBeVisible();
	await expect(accountMenu.getByText('# USR_9ZL2zWWN4iW', { exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page).toHaveURL('/login');

	await expect
		.poll(async () => {
			const response = await request.get(`${BACKEND_URL}/__test__/last-logout`);
			return response.json();
		})
		.toEqual({
			body: { refreshToken: 'refresh-token' },
			authorization: `Bearer ${accessToken}`,
			contentType: 'application/json'
		});

	const authCookies = (await context.cookies(APP_URL)).filter(({ name }) =>
		['access_token', 'refresh_token'].includes(name)
	);
	expect(authCookies).toEqual([]);
});
