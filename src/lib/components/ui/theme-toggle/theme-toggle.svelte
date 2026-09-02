<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils.js';

	let { class: className }: { class?: string } = $props();

	let dark = $state(false);

	function toggle() {
		dark = !dark;
		apply(dark);
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	}

	function apply(isDark: boolean) {
		document.documentElement.classList.toggle('dark', isDark);
	}

	onMount(() => {
		const saved = localStorage.getItem('theme');
		if (saved) {
			dark = saved === 'dark';
		} else {
			dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		apply(dark);
	});
</script>

<button
	onclick={toggle}
	class={cn(
		'text-on-surface inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-container transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
		className
	)}
	aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
>
	{#if dark}
		<svg
			class="size-4"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2" />
			<path d="M12 20v2" />
			<path d="m4.93 4.93 1.41 1.41" />
			<path d="m17.66 17.66 1.41 1.41" />
			<path d="M2 12h2" />
			<path d="M20 12h2" />
			<path d="m6.34 17.66-1.41 1.41" />
			<path d="m19.07 4.93-1.41 1.41" />
		</svg>
	{:else}
		<svg
			class="size-4"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	{/if}
</button>
