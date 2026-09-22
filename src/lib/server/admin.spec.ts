import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createBlockedDomain,
	createBlockedIPRange,
	deleteBlockedDomain,
	deleteBlockedIPRange,
	listBlockedDomains,
	listBlockedIPRanges,
	purgePasswordHistory,
	purgeSessions
} from './admin';

vi.mock('$env/dynamic/private', () => ({ env: { APP_ENV: 'https://backend.test/api/v1' } }));

const fetcher = vi.fn<typeof fetch>();

beforeEach(() => vi.resetAllMocks());

describe('admin API client', () => {
	it('loads blocked domains from the response envelope', async () => {
		fetcher.mockResolvedValue(
			Response.json({
				data: [{ id: 1, domain: 'bad.test', reason: 'Spam', createdAt: '2026-09-07' }]
			})
		);
		await expect(listBlockedDomains(fetcher)).resolves.toEqual([
			{ id: 1, domain: 'bad.test', reason: 'Spam', createdAt: '2026-09-07' }
		]);
		expect(fetcher).toHaveBeenCalledWith(
			'https://backend.test/api/v1/admin/blocked-domains',
			expect.objectContaining({ cache: 'no-store' })
		);
	});

	it('creates and deletes blocked domains', async () => {
		fetcher.mockResolvedValue(Response.json({ data: [] }));
		await createBlockedDomain(fetcher, { domain: 'bad.test', reason: 'Spam' });
		await deleteBlockedDomain(fetcher, 7);
		expect(fetcher).toHaveBeenNthCalledWith(
			1,
			'https://backend.test/api/v1/admin/blocked-domains',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ domain: 'bad.test', reason: 'Spam' })
			})
		);
		expect(fetcher).toHaveBeenNthCalledWith(
			2,
			'https://backend.test/api/v1/admin/blocked-domains/7',
			expect.objectContaining({ method: 'DELETE' })
		);
	});

	it('loads, creates, and deletes blocked IP ranges using the backend payload fields', async () => {
		fetcher.mockResolvedValue(
			Response.json({ data: [{ id: 2, cidr: '10.0.0.0/8', description: 'Internal' }] })
		);
		await expect(listBlockedIPRanges(fetcher)).resolves.toEqual([
			{ id: 2, cidr: '10.0.0.0/8', description: 'Internal' }
		]);
		fetcher.mockResolvedValue(Response.json({ data: [] }));
		await createBlockedIPRange(fetcher, { cidr: '192.0.2.0/24', description: 'Abuse' });
		await deleteBlockedIPRange(fetcher, 2);
		expect(fetcher).toHaveBeenNthCalledWith(
			2,
			'https://backend.test/api/v1/admin/blocked-ip-ranges',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ cidr: '192.0.2.0/24', description: 'Abuse' })
			})
		);
		expect(fetcher).toHaveBeenNthCalledWith(
			3,
			'https://backend.test/api/v1/admin/blocked-ip-ranges/2',
			expect.objectContaining({ method: 'DELETE' })
		);
	});

	it('uses the backend error message', async () => {
		fetcher.mockResolvedValue(
			Response.json({ message: 'Domain already blocked' }, { status: 409 })
		);
		await expect(createBlockedDomain(fetcher, { domain: 'bad.test' })).rejects.toMatchObject({
			message: 'Domain already blocked',
			status: 409
		});
	});

	it('purges sessions and password history using the selected retention days', async () => {
		fetcher.mockResolvedValue(Response.json({ data: [] }));
		await purgeSessions(fetcher, 30);
		await purgePasswordHistory(fetcher, 90);
		expect(fetcher).toHaveBeenNthCalledWith(
			1,
			'https://backend.test/api/v1/admin/maintenance/purge-sessions?days=30',
			expect.objectContaining({ method: 'POST' })
		);
		expect(fetcher).toHaveBeenNthCalledWith(
			2,
			'https://backend.test/api/v1/admin/maintenance/purge-password-history?days=90',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('rejects invalid retention days before calling the backend', async () => {
		await expect(purgeSessions(fetcher, 0)).rejects.toMatchObject({ status: 400 });
		expect(fetcher).not.toHaveBeenCalled();
	});
});
