import { createServer } from 'node:http';

let lastLogoutRequest;

function sendJson(response, status, payload) {
	response.writeHead(status, { 'content-type': 'application/json' });
	response.end(JSON.stringify(payload));
}

const server = createServer((request, response) => {
	if (request.method === 'POST' && request.url === '/__test__/reset') {
		lastLogoutRequest = undefined;
		response.writeHead(204).end();
		return;
	}

	if (request.method === 'GET' && request.url === '/__test__/last-logout') {
		sendJson(response, 200, lastLogoutRequest ?? null);
		return;
	}

	if (request.method !== 'POST' || request.url !== '/api/v1/auth/logout') {
		sendJson(response, 404, { message: 'Not found' });
		return;
	}

	let rawBody = '';
	request.setEncoding('utf8');
	request.on('data', (chunk) => {
		rawBody += chunk;
	});
	request.on('end', () => {
		try {
			lastLogoutRequest = {
				body: JSON.parse(rawBody),
				authorization: request.headers.authorization,
				contentType: request.headers['content-type']
			};
			response.writeHead(204).end();
		} catch {
			sendJson(response, 400, { message: 'Invalid JSON' });
		}
	});
});

server.listen(18085, '127.0.0.1');
