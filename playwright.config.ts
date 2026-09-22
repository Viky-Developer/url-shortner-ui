import { defineConfig } from '@playwright/test';

const TEST_JWT_SECRET = 'playwright-jwt-secret-key-for-linkflow-tests';
const TEST_ACCESS_TOKEN_EXPIRY = '15';
const TEST_REFRESH_TOKEN_EXPIRY = '7';
const TEST_AUTH_ENV = `JWT_SECRET_KEY=${TEST_JWT_SECRET} ACCESS_TOKEN_EXPIRY=${TEST_ACCESS_TOKEN_EXPIRY} REFRESH_TOKEN_EXPIRY=${TEST_REFRESH_TOKEN_EXPIRY}`;

process.env.ACCESS_TOKEN_EXPIRY ??= TEST_ACCESS_TOKEN_EXPIRY;

export default defineConfig({
	use: { baseURL: 'http://127.0.0.1:4173' },
	webServer: [
		{
			command: `${TEST_AUTH_ENV} node scripts/playwright-auth-backend.js`,
			port: 18085,
			reuseExistingServer: !process.env.CI
		},
		{
			command: `APP_ENV=http://127.0.0.1:18085/api/v1 ${TEST_AUTH_ENV} AUTH_COOKIE_SECURE=false npm run build && APP_ENV=http://127.0.0.1:18085/api/v1 ${TEST_AUTH_ENV} AUTH_COOKIE_SECURE=false npm run preview -- --host 127.0.0.1`,
			port: 4173,
			reuseExistingServer: !process.env.CI
		}
	],
	testMatch: '**/*.e2e.{ts,js}'
});
