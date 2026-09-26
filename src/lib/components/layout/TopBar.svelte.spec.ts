import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TopBar from './TopBar.svelte';

describe('TopBar', () => {
	it('disables link creation while account deletion is pending', async () => {
		render(TopBar, {
			user: {
				id: 'user-1',
				email: 'user@example.com',
				displayName: 'User',
				status: 'PENDING_DELETION'
			}
		});

		const createLink = page.getByRole('button', { name: 'Create new link' });
		await expect.element(createLink).toBeDisabled();
		await expect
			.element(createLink)
			.toHaveAttribute('title', 'Restore your account to create links');
	});
});
