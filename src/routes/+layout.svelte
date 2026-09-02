<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';

	let { children } = $props();
</script>

<header
	class="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="mx-auto flex w-full max-w-5xl items-center justify-between px-4">
		<div class="flex items-center gap-2">
			<svg
				class="size-6 text-primary"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
				<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
			</svg>
			<span class="text-lg font-semibold tracking-tight">Linkflow</span>
		</div>

		<nav class="flex items-center gap-1">
			<a
				href={resolve('/')}
				class="text-on-surface-variant hover:text-on-surface rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-surface-container"
			>
				Home
			</a>
			<a
				href={resolve('/analytics')}
				class="text-on-surface-variant hover:text-on-surface rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-surface-container"
			>
				Analytics
			</a>
			<a
				href={resolve('/demo')}
				class="text-on-surface-variant hover:text-on-surface rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-surface-container"
			>
				Demo
			</a>
		</nav>

		<ThemeToggle />
	</div>
</header>

<main class="mx-auto max-w-5xl space-y-8 p-4">
	{@render children()}
</main>
