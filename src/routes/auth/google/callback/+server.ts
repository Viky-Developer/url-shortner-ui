import { handleOAuthCallback } from '$lib/server/oauth-callback';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = (event) => handleOAuthCallback(event);
