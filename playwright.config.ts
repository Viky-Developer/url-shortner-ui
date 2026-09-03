import { defineConfig } from '@playwright/test';

export default defineConfig({
	use: { baseURL: 'http://127.0.0.1:4173' },
	webServer: [
		{
			command: 'node scripts/playwright-auth-backend.js',
			port: 18085,
			reuseExistingServer: !process.env.CI
		},
		{
			command:
				'APP_ENV=http://127.0.0.1:18085/api/v1 npm run build && APP_ENV=http://127.0.0.1:18085/api/v1 npm run preview -- --host 127.0.0.1',
			port: 4173,
			reuseExistingServer: !process.env.CI
		}
	],
	testMatch: '**/*.e2e.{ts,js}'
});
