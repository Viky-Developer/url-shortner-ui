<script lang="ts">
	import { resolve } from '$app/paths';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';

	let { onmenuclick }: { onmenuclick?: () => void } = $props();
</script>

<header
	class="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	style="left: var(--sidebar-width);"
>
	<div class="flex w-full items-center justify-between px-4">
		<!-- Left: Mobile hamburger + Desktop breadcrumbs + Logo -->
		<div class="flex min-w-0 flex-1 items-center gap-2">
			<!-- Mobile hamburger (hidden on desktop) -->
			<button
				class="text-on-surface inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface-container transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:hidden"
				onclick={onmenuclick}
				aria-label="Open menu"
			>
				<svg
					class="size-5"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="4" x2="20" y1="12" y2="12" />
					<line x1="4" x2="20" y1="6" y2="6" />
					<line x1="4" x2="20" y1="18" y2="18" />
				</svg>
			</button>

			<!-- Logo (mobile only, desktop uses breadcrumbs as context) -->
			<a href={resolve('/')} class="flex items-center gap-2 md:hidden">
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
			</a>

			<!-- Breadcrumbs (desktop only) -->
			<div class="text-on-surface-variant font-body-sm hidden items-center gap-2 truncate md:flex">
				<svg
					class="size-4 shrink-0"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline
						points="9 22 9 12 15 12 15 22"
					/></svg
				>
				<svg
					class="size-4 shrink-0"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg
				>
				<span class="text-on-surface font-headline-md truncate text-body-base tracking-tight"
					>Project Alpha</span
				>
				<svg
					class="size-4 shrink-0"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg
				>
				<span class="font-code-base truncate text-primary">/routes</span>
			</div>
		</div>

		<!-- Right: Notifications + Create Link + Theme Toggle -->
		<div class="flex shrink-0 items-center gap-4">
			<!-- Notification bell -->
			<button
				class="rounded-full p-2 transition-colors hover:bg-surface-container"
				aria-label="Notifications"
			>
				<svg
					class="text-on-surface-variant size-5"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
					<path d="M13.73 21a2 2 0 0 1-3.46 0" />
				</svg>
			</button>

			<!-- Create Link button (desktop only) -->
			<button
				class="font-label-caps hover:bg-primary-container hidden items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-caps text-primary-foreground shadow-sm transition-all md:flex"
				aria-label="Create new link"
			>
				<svg
					class="size-5"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="12" x2="12" y1="5" y2="19" />
					<line x1="5" x2="19" y1="12" y2="12" />
				</svg>
				Create Link
			</button>

			<ThemeToggle />
		</div>
	</div>
</header>
