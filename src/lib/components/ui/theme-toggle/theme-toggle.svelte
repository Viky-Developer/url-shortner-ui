<script lang="ts">
	import { onMount } from 'svelte';
	import { Moon, Sun } from '$lib/components/ui/icons';
	import { cn } from '$lib/utils.js';

	let { class: className }: { class?: string } = $props();

	let dark = $state(false);
	let transitionTimer: ReturnType<typeof setTimeout> | undefined;
	const themeTransitionDuration = 100;

	function toggle() {
		const root = document.documentElement;
		clearTimeout(transitionTimer);
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			root.classList.add('theme-changing');
			// Apply transition styles before changing the palette.
			void root.offsetWidth;
			transitionTimer = setTimeout(
				() => root.classList.remove('theme-changing'),
				themeTransitionDuration + 50
			);
		} else {
			root.classList.remove('theme-changing');
		}
		dark = !dark;
		apply(dark);
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	}

	function apply(isDark: boolean) {
		document.documentElement.classList.toggle('dark', isDark);
	}

	onMount(() => {
		const saved = localStorage.getItem('theme');
		const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
		if (saved) {
			dark = saved === 'dark';
		} else {
			dark = systemTheme.matches;
		}
		apply(dark);

		function followSystemTheme(event: MediaQueryListEvent) {
			if (localStorage.getItem('theme')) return;
			dark = event.matches;
			apply(dark);
		}

		systemTheme.addEventListener('change', followSystemTheme);
		return () => {
			clearTimeout(transitionTimer);
			systemTheme.removeEventListener('change', followSystemTheme);
			document.documentElement.classList.remove('theme-changing');
		};
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
