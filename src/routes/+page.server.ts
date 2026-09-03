import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export const load = ({ locals, url }: RequestEvent) => {
	if (!locals.authenticated) {
		const destination = `${url.pathname}${url.search}`;
		return redirect(303, `/login?redirectTo=${encodeURIComponent(destination)}`);
	}

	return {};
};
