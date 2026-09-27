import type { UpdateURLRequest } from '$lib/types/short-url';

export function updateShortURLRequest(
	fetcher: typeof fetch,
	endpoint: string,
	request: UpdateURLRequest
): Promise<Response> {
	return fetcher(endpoint, {
		method: 'PATCH',
		headers: { accept: 'application/json', 'content-type': 'application/json' },
		body: JSON.stringify(request)
	});
}
