import type { LayoutServerLoad } from './$types';

const OAUTH_LOGIN_SUCCESS_COOKIE = 'oauth_login_success';

export const load: LayoutServerLoad = ({ locals, cookies }) => {
	const oauthLoginSuccess = cookies.get(OAUTH_LOGIN_SUCCESS_COOKIE) === '1';
	if (oauthLoginSuccess) cookies.delete(OAUTH_LOGIN_SUCCESS_COOKIE, { path: '/' });

	return {
		user: locals.user,
		oauthLoginSuccess
	};
};
