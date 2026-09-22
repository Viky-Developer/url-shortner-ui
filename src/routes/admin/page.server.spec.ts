import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';
import {
	createBlockedDomain,
	createBlockedIPRange,
	deleteBlockedDomain,
	deleteBlockedIPRange,
	listBlockedDomains,
	listBlockedIPRanges,
	purgePasswordHistory,
	purgeSessions
} from '$lib/server/admin';

vi.mock('$lib/server/admin', () => ({
	createBlockedDomain: vi.fn(),
	createBlockedIPRange: vi.fn(),
	deleteBlockedDomain: vi.fn(),
	deleteBlockedIPRange: vi.fn(),
	listBlockedDomains: vi.fn(),
	listBlockedIPRanges: vi.fn(),
	purgePasswordHistory: vi.fn(),
	purgeSessions: vi.fn()
}));

function eventFor(role: string | null = 'ADMIN', values: Record<string, string> = {}) {
	const body = new FormData();
	for (const [key, value] of Object.entries(values)) body.set(key, value);
	return {
		locals: role
			? { authenticated: true, user: { id: '1', displayName: 'Admin', role } }
			: { authenticated: false },
		url: new URL('https://linkflow.test/admin'),
		fetch: vi.fn(),
		cookies: {},
		request: new Request('https://linkflow.test/admin', { method: 'POST', body })
	};
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(listBlockedDomains).mockResolvedValue([]);
	vi.mocked(listBlockedIPRanges).mockResolvedValue([]);
});

describe('admin page access and data', () => {
	it('loads both block lists for ADMIN users', async () => {
		const event = eventFor();
		await expect(load(event as never)).resolves.toMatchObject({ domains: [], ipRanges: [] });
		expect(listBlockedDomains).toHaveBeenCalledWith(event.fetch);
		expect(listBlockedIPRanges).toHaveBeenCalledWith(event.fetch);
	});

	it('redirects USER accounts to the dashboard', async () => {
		await expect(load(eventFor('USER') as never)).rejects.toMatchObject({
			status: 303,
			location: '/dashboard'
		});
	});

	it('redirects unauthenticated visitors to login', async () => {
		await expect(load(eventFor(null) as never)).rejects.toMatchObject({
			status: 303,
			location: '/login?redirectTo=%2Fadmin'
		});
	});
});

describe('admin block-list actions', () => {
	it('creates a blocked domain', async () => {
		const event = eventFor('ADMIN', { domain: 'bad.test', reason: 'Spam' });
		await expect(actions.createDomain(event as never)).resolves.toMatchObject({
			success: 'Domain blocked successfully.'
		});
		expect(createBlockedDomain).toHaveBeenCalledWith(event.fetch, {
			domain: 'bad.test',
			reason: 'Spam'
		});
	});

	it('creates a blocked IP range with the API payload fields', async () => {
		const event = eventFor('ADMIN', { cidr: '192.0.2.0/24', description: 'Abuse' });
		await expect(actions.createIPRange(event as never)).resolves.toMatchObject({
			success: 'IP range blocked successfully.'
		});
		expect(createBlockedIPRange).toHaveBeenCalledWith(event.fetch, {
			cidr: '192.0.2.0/24',
			description: 'Abuse'
		});
	});

	it('deletes domain and IP range entries by ID', async () => {
		const domainEvent = eventFor('ADMIN', { id: '3' });
		const ipEvent = eventFor('ADMIN', { id: '4' });
		await actions.deleteDomain(domainEvent as never);
		await actions.deleteIPRange(ipEvent as never);
		expect(deleteBlockedDomain).toHaveBeenCalledWith(domainEvent.fetch, 3);
		expect(deleteBlockedIPRange).toHaveBeenCalledWith(ipEvent.fetch, 4);
	});

	it('rejects invalid IDs before calling the API', async () => {
		const result = await actions.deleteDomain(eventFor('ADMIN', { id: '../all' }) as never);
		expect(result).toMatchObject({ status: 400 });
		expect(deleteBlockedDomain).not.toHaveBeenCalled();
	});

	it('purges sessions and password history with the selected retention days', async () => {
		const sessionsEvent = eventFor('ADMIN', { days: '30' });
		const passwordsEvent = eventFor('ADMIN', { days: '90' });
		await expect(actions.purgeSessions(sessionsEvent as never)).resolves.toMatchObject({
			success: 'Sessions older than 30 days purged successfully.'
		});
		await expect(actions.purgePasswordHistory(passwordsEvent as never)).resolves.toMatchObject({
			success: 'Password history older than 90 days purged successfully.'
		});
		expect(purgeSessions).toHaveBeenCalledWith(sessionsEvent.fetch, 30);
		expect(purgePasswordHistory).toHaveBeenCalledWith(passwordsEvent.fetch, 90);
	});

	it('rejects invalid retention days before calling maintenance APIs', async () => {
		const result = await actions.purgeSessions(eventFor('ADMIN', { days: '0' }) as never);
		expect(result).toMatchObject({ status: 400 });
		expect(purgeSessions).not.toHaveBeenCalled();
	});
});
