import { redirect, type RequestHandler } from '@sveltejs/kit';
import { logoutUser } from '$lib/server/auth';
import { REFRESH_TOKEN_COOKIE, clearAuthCookies } from '$lib/server/auth-cookies';

export const POST: RequestHandler = async ({ cookies, fetch }) => {
	const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE);

	if (refreshToken) {
		await logoutUser(fetch, refreshToken).catch(() => undefined);
	}

	clearAuthCookies(cookies);
	return redirect(303, '/login');
};
