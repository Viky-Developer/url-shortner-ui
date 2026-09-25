import { googleAuthorizationUrl } from '$lib/server/oauth-callback';
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ url }) => redirect(303, googleAuthorizationUrl(url));
