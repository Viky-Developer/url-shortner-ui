<script lang="ts">
	import './layout.css';
	import { navigating, page } from '$app/state';
	import { CreateLinkModal, RouteSkeleton, Sidebar, TopBar } from '$lib/components/layout';
	import { Toaster } from 'svelte-sonner';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	let sidebarOpen = $state(false);
	const isAuthRoute = $derived(['/login', '/signup'].includes(page.url.pathname));
	const loadingPage = $derived.by(() => {
		const pathname = navigating.to?.url.pathname;
		if (pathname === '/dashboard') return 'dashboard';
		if (pathname === '/my-links') return 'my-links';
		return undefined;
	});
</script>

{#if isAuthRoute}
	{@render children()}
{:else}
	<TopBar onmenuclick={() => (sidebarOpen = true)} />
	<Sidebar user={data.user} open={sidebarOpen} onclose={() => (sidebarOpen = false)} />

	<main class="min-h-screen space-y-8 p-4 pt-4 md:ml-60 md:p-8">
		{#if loadingPage}
			<RouteSkeleton page={loadingPage} />
		{:else}
			{#key page.url.pathname}
				<div class="route-content">
					{@render children()}
				</div>
			{/key}
		{/if}
	</main>
	<CreateLinkModal />
{/if}

<Toaster
	position="top-right"
	richColors
	toastOptions={{ style: 'min-height: 64px; padding: 16px 18px;' }}
/>
