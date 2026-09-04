<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Bell, ChevronRight, HomeIcon, LinkIcon, Menu, Plus } from '$lib/components/ui/icons';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';

	let { onmenuclick }: { onmenuclick?: () => void } = $props();

	function openCreateLink(): void {
		void goto(resolve('/dashboard#create-link'), { noScroll: true, keepFocus: true });
	}
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
				<Menu class="size-5" />
			</button>

			<!-- Logo (mobile only, desktop uses breadcrumbs as context) -->
			<a href={resolve('/dashboard')} class="flex items-center gap-2 md:hidden">
				<LinkIcon class="size-6 text-primary" />
				<span class="text-lg font-semibold tracking-tight">Linkflow</span>
			</a>

			<!-- Breadcrumbs (desktop only) -->
			<div class="text-on-surface-variant font-body-sm hidden items-center gap-2 truncate md:flex">
				<HomeIcon class="size-4 shrink-0" />
				<ChevronRight class="size-4 shrink-0" />
				<span class="text-on-surface font-headline-md truncate text-body-base tracking-tight"
					>Project Alpha</span
				>
				<ChevronRight class="size-4 shrink-0" />
				<span class="font-code-base truncate text-primary">/routes</span>
			</div>
		</div>

		<!-- Right: Notifications + Create Link + Theme Toggle -->
		<div class="flex shrink-0 items-center gap-1 sm:gap-3 md:gap-4">
			<!-- Notification bell -->
			<button
				class="rounded-full p-2 transition-colors hover:bg-surface-container"
				aria-label="Notifications"
			>
				<Bell class="text-on-surface-variant size-5" />
			</button>

			<!-- Create Link button: icon on mobile, label on desktop -->
			<button
				type="button"
				onclick={openCreateLink}
				class="font-label-caps hover:bg-primary-container inline-flex size-9 items-center justify-center gap-2 rounded-lg bg-primary text-label-caps text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 md:h-auto md:w-auto md:px-4 md:py-2"
				aria-label="Create new link"
			>
				<Plus class="size-5" />
				<span class="hidden md:inline">Create Link</span>
			</button>

			<ThemeToggle />
		</div>
	</div>
</header>
