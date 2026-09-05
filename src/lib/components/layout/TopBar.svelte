<script lang="ts">
	import { page } from '$app/state';
	import { Menu, Plus } from '$lib/components/ui/icons';
	import { openCreateLink } from '$lib/state/create-link';
	import type { AuthenticatedUser } from '$lib/types/auth';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';

	let {
		user,
		onmenuclick,
		desktopSidebarOpen = true
	}: {
		user?: AuthenticatedUser;
		onmenuclick?: () => void;
		desktopSidebarOpen?: boolean;
	} = $props();

	const userName = $derived(user?.displayName || 'User');

	const pageTitle = $derived.by(() => {
		if (page.url.pathname.startsWith('/analytics')) return 'Link Analytics';
		if (page.url.pathname.startsWith('/my-links')) return 'My Links';
		if (page.url.pathname.startsWith('/dashboard')) return `Welcome, ${userName}`;
		if (page.url.pathname.startsWith('/settings')) return 'Settings';
		return 'Linkflow';
	});
</script>

<header
	class={[
		'sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/80 backdrop-blur transition-[margin] duration-200 ease-in-out supports-backdrop-filter:bg-background/60',
		desktopSidebarOpen ? 'md:ml-60' : 'md:ml-0'
	]}
>
	<div class="flex w-full items-center justify-between px-4">
		<!-- Left: mobile navigation and desktop page title -->
		<div class="flex min-w-0 flex-1 items-center gap-2">
			<button
				type="button"
				class="text-on-surface inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-container transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:hidden"
				onclick={onmenuclick}
				aria-label="Toggle navigation menu"
			>
				<Menu class="size-5" />
			</button>

			<p class="min-w-0 truncate pl-2 text-sm font-semibold text-foreground md:hidden">
				{pageTitle}
			</p>

			<h1 class="hidden truncate text-2xl font-semibold tracking-tight text-foreground md:block">
				{pageTitle}
			</h1>
		</div>

		<!-- Right: Create Link + Theme Toggle -->
		<div class="flex shrink-0 items-center gap-1 sm:gap-3 md:gap-4">
			<button
				type="button"
				onclick={openCreateLink}
				class="font-label-caps hover:bg-primary-container inline-flex size-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary text-label-caps text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 md:h-auto md:w-auto md:px-4 md:py-2"
				aria-label="Create new link"
			>
				<Plus class="size-5" />
				<span class="hidden md:inline">Create Link</span>
			</button>

			<ThemeToggle class="shrink-0" />
		</div>
	</div>
</header>
