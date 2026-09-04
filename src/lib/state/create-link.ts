import { writable } from 'svelte/store';

export const createLinkOpen = writable(false);

export function openCreateLink(): void {
	createLinkOpen.set(true);
}

export function closeCreateLink(): void {
	createLinkOpen.set(false);
}
