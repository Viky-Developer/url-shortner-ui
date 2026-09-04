<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import {
		ChartNoAxesColumn,
		LayoutDashboard,
		LinkIcon,
		LogOut,
		Package,
		Settings,
		X
	} from '$lib/components/ui/icons';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import type { AuthenticatedUser } from '$lib/types/auth';
	import { tick } from 'svelte';

	let {
		user,
		open = false,
		onclose
	}: { user?: AuthenticatedUser; open?: boolean; onclose?: () => void } = $props();

	const userName = $derived(user?.displayName || 'User');
	const userInitial = $derived(userName.charAt(0).toUpperCase());
	const userRole = $derived(formatRole(user?.role));
	const userId = $derived(user?.id || 'unavailable');

	function formatRole(role: string | undefined): string {
		if (!role?.trim()) return 'MEMBER';

		return role.trim().toUpperCase().replaceAll('_', ' ');
	}

	const mainNav = [
		{ href: resolve('/dashboard'), label: 'Dashboard', icon: LayoutDashboard },
		{ href: resolve('/my-links'), label: 'My Links', icon: LinkIcon },
		{ href: resolve('/analytics'), label: 'Analytics', icon: ChartNoAxesColumn },
		{ href: resolve('/demo'), label: 'Demo', icon: Package }
	];

	const bottomNav = [{ href: resolve('/settings'), label: 'Settings', icon: Settings }];

	interface IndicatorPosition {
		top: number;
		height: number;
		visible: boolean;
	}

	let desktopNav: HTMLElement | undefined;
	let mobileNav: HTMLElement | undefined;
	let desktopIndicator = $state<IndicatorPosition>({ top: 0, height: 0, visible: false });
	let mobileIndicator = $state<IndicatorPosition>({ top: 0, height: 0, visible: false });

	function isNavActive(href: string): boolean {
		return href === '/dashboard'
			? page.url.pathname === href
			: page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	function measureIndicator(nav: HTMLElement | undefined): IndicatorPosition {
		const activeLink = nav?.querySelector<HTMLElement>('[aria-current="page"]');
		if (!nav || !activeLink) return { top: 0, height: 0, visible: false };

		const navBounds = nav.getBoundingClientRect();
		const linkBounds = activeLink.getBoundingClientRect();
		return {
			top: linkBounds.top - navBounds.top,
			height: linkBounds.height,
			visible: true
		};
	}

	$effect(() => {
		const pathname = page.url.pathname;
		void tick().then(() => {
			if (page.url.pathname !== pathname) return;
			desktopIndicator = measureIndicator(desktopNav);
			mobileIndicator = measureIndicator(mobileNav);
		});
	});
</script>

{#snippet userCard()}
	<Popover>
		<PopoverTrigger>
			{#snippet child({ props })}
				<button
					{...props}
					type="button"
					class="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent p-2 text-left transition-colors hover:bg-sidebar-accent/80 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
					aria-label="Open account menu"
				>
					<span
						class="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground"
					>
						{userInitial}
					</span>
					<span class="min-w-0 flex-1">
						<span
							class="block truncate text-sm font-medium text-sidebar-foreground"
							title={userName}
						>
							{userName}
						</span>
						<span
							class="block truncate text-label-caps text-sidebar-foreground/50"
							title={`Role: ${userRole}`}
						>
							{userRole}
						</span>
					</span>
				</button>
			{/snippet}
		</PopoverTrigger>

		<PopoverContent
			side="top"
			align="start"
			sideOffset={8}
			class="shadow-overlay w-52 gap-0 overflow-hidden rounded-xl border border-border bg-popover p-0"
		>
			<div class="flex items-center gap-3 p-3">
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
				>
					{userInitial}
				</div>
				<div class="min-w-0 flex-1">
					<div class="truncate font-semibold text-popover-foreground" title={userName}>
						{userName}
					</div>
					<div class="truncate text-xs text-muted-foreground" title={`Role: ${userRole}`}>
						{userRole}
					</div>
					<div class="truncate text-xs text-primary" title={`User ID: ${userId}`}>
						# {userId}
					</div>
				</div>
			</div>

			<form method="POST" action={resolve('/logout')} class="border-t border-border p-1.5">
				<button
					type="submit"
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none"
				>
					<LogOut class="size-4" />
					<span>Sign out</span>
				</button>
			</form>
		</PopoverContent>
	</Popover>
{/snippet}

<!-- Desktop sidebar -->
<aside
	class="fixed top-0 left-0 z-50 hidden h-full w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex"
>
	<div class="px-6 py-5">
		<a
			href={resolve('/dashboard')}
			class="flex w-fit items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none"
			aria-label="Go to Dashboard"
		>
			<LinkIcon class="size-7 text-sidebar-primary" />
			<span class="text-xl font-semibold tracking-tight text-sidebar-foreground">Linkflow</span>
		</a>
	</div>

	<nav bind:this={desktopNav} class="relative mt-4 flex flex-1 flex-col gap-1 px-3">
		<span
			class="pointer-events-none absolute left-0 z-10 w-0.5 rounded-r-full bg-sidebar-primary shadow-sm transition-all duration-300 ease-out will-change-transform motion-reduce:transition-none"
			class:opacity-0={!desktopIndicator.visible}
			class:opacity-100={desktopIndicator.visible}
			style:height={`${desktopIndicator.height}px`}
			style:transform={`translateY(${desktopIndicator.top}px)`}
			aria-hidden="true"
		></span>

		<div class="relative flex flex-col gap-1">
			{#each mainNav as link (link.href)}
				<a
					href={link.href}
					aria-current={isNavActive(link.href) ? 'page' : undefined}
					class={[
						'flex h-11 items-center gap-3 rounded-lg px-4 text-sm transition-all duration-200 ease-out',
						isNavActive(link.href)
							? 'bg-sidebar-accent text-sidebar-primary'
							: 'text-sidebar-foreground/70 hover:translate-x-0.5 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
					]}
				>
					<link.icon class="size-5 shrink-0" />
					<span>{link.label}</span>
				</a>
			{/each}
		</div>

		<div class="mx-4 my-4 h-px bg-sidebar-border"></div>

		{#each bottomNav as link (link.href)}
			<a
				href={link.href}
				aria-current={isNavActive(link.href) ? 'page' : undefined}
				class={[
					'flex h-11 items-center gap-3 rounded-lg px-4 text-sm transition-all duration-200 ease-out',
					isNavActive(link.href)
						? 'bg-sidebar-accent text-sidebar-primary'
						: 'text-sidebar-foreground/70 hover:translate-x-0.5 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
				]}
			>
				<link.icon class="size-5 shrink-0" />
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>

	<div class="mouse-poi mt-auto border-t border-sidebar-border p-4">
		{@render userCard()}
	</div>
</aside>

<!-- Mobile drawer overlay -->
{#if open}
	<div
		class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
		onclick={onclose}
		onkeydown={(e) => e.key === 'Escape' && onclose?.()}
		role="button"
		tabindex="-1"
		aria-label="Close sidebar"
	></div>
{/if}

<!-- Mobile drawer -->
<div
	class="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-in-out md:hidden"
	style:transform={open ? 'translateX(0)' : 'translateX(-100%)'}
	role="dialog"
	aria-modal="true"
	aria-label="Mobile navigation"
>
	<div class="flex items-center justify-between px-6 py-5">
		<a
			href={resolve('/dashboard')}
			class="flex items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none"
			onclick={onclose}
			aria-label="Go to Dashboard"
		>
			<LinkIcon class="size-7 text-sidebar-primary" />
			<span class="text-xl font-semibold tracking-tight text-sidebar-foreground">Linkflow</span>
		</a>
		<button
			class="inline-flex size-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
			onclick={onclose}
			aria-label="Close sidebar"
		>
			<X class="size-5" />
		</button>
	</div>

	<nav bind:this={mobileNav} class="relative mt-4 flex flex-1 flex-col gap-1 px-3">
		<span
			class="pointer-events-none absolute left-0 z-10 w-0.5 rounded-r-full bg-sidebar-primary shadow-sm transition-all duration-300 ease-out will-change-transform motion-reduce:transition-none"
			class:opacity-0={!mobileIndicator.visible}
			class:opacity-100={mobileIndicator.visible}
			style:height={`${mobileIndicator.height}px`}
			style:transform={`translateY(${mobileIndicator.top}px)`}
			aria-hidden="true"
		></span>

		<div class="relative flex flex-col gap-1">
			{#each mainNav as link (link.href)}
				<a
					href={link.href}
					aria-current={isNavActive(link.href) ? 'page' : undefined}
					class={[
						'flex h-11 items-center gap-3 rounded-lg px-4 text-sm transition-all duration-200 ease-out',
						isNavActive(link.href)
							? 'bg-sidebar-accent text-sidebar-primary'
							: 'text-sidebar-foreground/70 hover:translate-x-0.5 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
					]}
					onclick={onclose}
				>
					<link.icon class="size-5 shrink-0" />
					<span>{link.label}</span>
				</a>
			{/each}
		</div>

		<div class="mx-4 my-4 h-px bg-sidebar-border"></div>

		{#each bottomNav as link (link.href)}
			<a
				href={link.href}
				aria-current={isNavActive(link.href) ? 'page' : undefined}
				class={[
					'flex h-11 items-center gap-3 rounded-lg px-4 text-sm transition-all duration-200 ease-out',
					isNavActive(link.href)
						? 'bg-sidebar-accent text-sidebar-primary'
						: 'text-sidebar-foreground/70 hover:translate-x-0.5 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
				]}
				onclick={onclose}
			>
				<link.icon class="size-5 shrink-0" />
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>

	<div class="mt-auto border-t border-sidebar-border p-4">
		{@render userCard()}
	</div>
</div>
