import { writeFileSync } from 'node:fs';

const isProduction =
	process.env.BACKEND_API_URL === 'https://api-linkpluse.onrender.com' ||
	process.env.SITE_NAME === 'app-linkpluse' ||
	process.env.CONTEXT === 'production' ||
	process.env.BRANCH === 'main';

const backendUrl = isProduction
	? 'https://api-linkpluse.onrender.com'
	: 'https://url-shortner-0skn.onrender.com';

const redirectsContent = `/api/v1/*  ${backendUrl}/api/v1/:splat  200!\n`;

writeFileSync('_redirects', redirectsContent, 'utf-8');
console.log(`[redirects] Configured /api/v1/* proxy to ${backendUrl}`);
