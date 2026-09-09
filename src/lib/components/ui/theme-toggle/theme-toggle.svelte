<script lang="ts">
	import { onMount } from 'svelte';
	import Monitor from '@lucide/svelte/icons/monitor';
	import { Moon, Sun } from '$lib/components/ui/icons';
	import { cn } from '$lib/utils.js';

	let { class: className }: { class?: string } = $props();

	type Theme = 'light' | 'dark' | 'system';

	let theme = $state<Theme>('system');
	const themes = [
		{ value: 'light' as const, label: 'Light', icon: Sun },
		{ value: 'dark' as const, label: 'Dark', icon: Moon },
		{ value: 'system' as const, label: 'System', icon: Monitor }
	];

	function selectTheme(nextTheme: Theme) {
		theme = nextTheme;
		if (theme === 'system') localStorage.removeItem('theme');
		else localStorage.setItem('theme', theme);
		applyTheme();
	}

	function applyTheme() {
		const dark =
			theme === 'dark' ||
			(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		document.documentElement.classList.toggle('dark', dark);
	}

	onMount(() => {
		const saved = localStorage.getItem('theme');
		const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
		theme = saved === 'light' || saved === 'dark' ? saved : 'system';
		applyTheme();

		function followSystemTheme() {
			if (theme === 'system') applyTheme();
		}

		systemTheme.addEventListener('change', followSystemTheme);
		return () => {
			systemTheme.removeEventListener('change', followSystemTheme);
		};
	});
</script>

<div
	role="group"
	aria-label="Theme preference"
	class={cn('grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/60 p-1', className)}
>
	{#each themes as option (option.value)}
		<button
			type="button"
			onclick={() => selectTheme(option.value)}
			aria-pressed={theme === option.value}
			class={[
				'inline-flex h-9 min-w-20 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
				theme === option.value
					? 'bg-primary text-primary-foreground shadow-sm'
					: 'text-foreground hover:bg-background hover:text-primary'
			]}
		>
			<option.icon class="size-4" aria-hidden="true" />
			{option.label}
		</button>
	{/each}
</div>
