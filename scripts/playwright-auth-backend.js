import { createServer } from 'node:http';
import { createHmac } from 'node:crypto';

const jwtSecret = process.env.JWT_SECRET_KEY;
if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
	throw new Error('JWT_SECRET_KEY must contain at least 32 bytes.');
}

const accessTokenExpiryMinutes = Number(process.env.ACCESS_TOKEN_EXPIRY);
if (!Number.isSafeInteger(accessTokenExpiryMinutes) || accessTokenExpiryMinutes <= 0) {
	throw new Error('ACCESS_TOKEN_EXPIRY must be a positive integer.');
}

let lastLogoutRequest;
let lastLoginRequest;

function sendJson(response, status, payload) {
	response.writeHead(status, { 'content-type': 'application/json' });
	response.end(JSON.stringify(payload));
}

function createAccessToken(email) {
	const now = Math.floor(Date.now() / 1000);
	const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
	const header = encode({ alg: 'HS256', typ: 'JWT' });
	const payload = encode({
		user_id: 'USR_LOGIN_TEST',
		sub: 'USR_LOGIN_TEST',
		email,
		display_name: 'Login Test User',
		role: 'USER',
		session_id: 17,
		session_version: now,
		iat: now,
		exp: now + accessTokenExpiryMinutes * 60
	});
	const unsignedToken = `${header}.${payload}`;
	const signature = createHmac('sha256', jwtSecret).update(unsignedToken).digest('base64url');

	return `${unsignedToken}.${signature}`;
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

	if (request.method === 'POST' && request.url === '/__test__/reset-login') {
		lastLoginRequest = undefined;
		response.writeHead(204).end();
		return;
	}

	if (request.method === 'GET' && request.url === '/__test__/last-login') {
		sendJson(response, 200, lastLoginRequest ?? null);
		return;
	}

	if (request.method === 'POST' && request.url === '/api/v1/auth/login') {
		let rawBody = '';
		request.setEncoding('utf8');
		request.on('data', (chunk) => {
			rawBody += chunk;
		});
		request.on('end', () => {
			try {
				const body = JSON.parse(rawBody);
				lastLoginRequest = {
					body,
					authorization: request.headers.authorization ?? null,
					contentType: request.headers['content-type']
				};
				sendJson(response, 200, {
					statusCode: 200,
					message: 'authenticated',
					data: [
						{
							token: {
								accessToken: createAccessToken(body.email),
								refreshToken: 'login-refresh-token'
							},
							user: {
								id: 'USR_LOGIN_TEST',
								email: body.email,
								displayName: 'Login Test User',
								role: 'USER'
							}
						}
					]
				});
			} catch {
				sendJson(response, 400, { message: 'Invalid JSON' });
			}
		});
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
