<script lang="ts">
	import { resolve } from '$app/paths';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';

	let { open = false, onclose }: { open?: boolean; onclose?: () => void } = $props();

	const mainNav = [
		{ href: resolve('/'), label: 'Dashboard', icon: '📊' },
		{ href: resolve('/analytics'), label: 'Analytics', icon: '📈' },
		{ href: resolve('/demo'), label: 'Demo', icon: '📦' }
	];

	const bottomNav = [{ href: resolve('/'), label: 'Settings', icon: '⚙️' }];
</script>

<!-- Desktop sidebar -->
<aside
	class="fixed top-0 left-0 z-50 hidden h-full w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex"
>
	<div class="flex items-center gap-3 px-6 py-5">
		<svg
			class="size-7 text-sidebar-primary"
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
		<span class="text-xl font-semibold tracking-tight text-sidebar-foreground">Linkflow</span>
	</div>

	<nav class="mt-4 flex flex-1 flex-col gap-1 px-3">
		{#each mainNav as link (link.href)}
			<a
				href={link.href}
				class="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
			>
				<span class="text-xl">{link.icon}</span>
				<span>{link.label}</span>
			</a>
		{/each}

		<div class="mx-4 my-4 h-px bg-sidebar-border"></div>

		{#each bottomNav as link (link.href)}
			<a
				href={link.href}
				class="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
			>
				<span class="text-xl">{link.icon}</span>
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>

	<div class="mt-auto border-t border-sidebar-border p-4">
		<div
			class="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent p-2"
		>
			<div
				class="flex size-8 items-center justify-center rounded-full bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground"
			>
				A
			</div>
			<div class="min-w-0 flex-1">
				<div class="truncate text-sm font-medium text-sidebar-foreground">Alex Rivera</div>
				<div class="truncate text-[10px] text-sidebar-foreground/50">UID: 82ef-912c</div>
			</div>
			<ThemeToggle />
		</div>
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
		<div class="flex items-center gap-3">
			<svg
				class="size-7 text-sidebar-primary"
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
			<span class="text-xl font-semibold tracking-tight text-sidebar-foreground">Linkflow</span>
		</div>
		<button
			class="inline-flex size-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
			onclick={onclose}
			aria-label="Close sidebar"
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
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			</svg>
		</button>
	</div>

	<nav class="mt-4 flex flex-1 flex-col gap-1 px-3">
		{#each mainNav as link (link.href)}
			<a
				href={link.href}
				class="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
				onclick={onclose}
			>
				<span class="text-xl">{link.icon}</span>
				<span>{link.label}</span>
			</a>
		{/each}

		<div class="mx-4 my-4 h-px bg-sidebar-border"></div>

		{#each bottomNav as link (link.href)}
			<a
				href={link.href}
				class="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
				onclick={onclose}
			>
				<span class="text-xl">{link.icon}</span>
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>

	<div class="mt-auto border-t border-sidebar-border p-4">
		<div
			class="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent p-2"
		>
			<div
				class="flex size-8 items-center justify-center rounded-full bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground"
			>
				A
			</div>
			<div class="min-w-0 flex-1">
				<div class="truncate text-sm font-medium text-sidebar-foreground">Alex Rivera</div>
				<div class="truncate text-[10px] text-sidebar-foreground/50">UID: 82ef-912c</div>
			</div>
			<ThemeToggle />
		</div>
	</div>
</div>
