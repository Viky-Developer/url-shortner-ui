<script lang="ts">
	import { onMount } from 'svelte';
	import { Moon, Sun } from '$lib/components/ui/icons';
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
		<Sun class="size-4" />
	{:else}
		<Moon class="size-4" />
	{/if}
</button>
