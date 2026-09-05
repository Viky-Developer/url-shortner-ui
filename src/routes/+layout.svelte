<script lang="ts">
	import './layout.css';
	import { navigating, page } from '$app/state';
	import { CreateLinkModal, RouteSkeleton, Sidebar, TopBar } from '$lib/components/layout';
	import { Toaster } from 'svelte-sonner';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	let sidebarOpen = $state(false);
	let desktopSidebarOpen = $state(true);

	function toggleSidebar() {
		if (window.matchMedia('(min-width: 768px)').matches) {
			desktopSidebarOpen = !desktopSidebarOpen;
		} else {
			sidebarOpen = true;
		}
	}
	const isAuthRoute = $derived(['/login', '/signup'].includes(page.url.pathname));
	const loadingPage = $derived.by(() => {
		const pathname = navigating.to?.url.pathname;
		if (pathname === page.url.pathname) return undefined;
		if (pathname === '/dashboard') return 'dashboard';
		if (pathname === '/my-links') return 'my-links';
		return undefined;
	});
</script>

{#if isAuthRoute}
	{@render children()}
{:else}
	<TopBar user={data.user} onmenuclick={toggleSidebar} {desktopSidebarOpen} />
	<Sidebar
		user={data.user}
		open={sidebarOpen}
		desktopOpen={desktopSidebarOpen}
		onclose={() => (sidebarOpen = false)}
	/>

	<main
		class={[
			'min-h-screen space-y-8 p-4 pt-4 transition-[margin] duration-200 ease-in-out md:p-8',
			desktopSidebarOpen ? 'md:ml-60' : 'md:ml-0'
		]}
	>
		{#if loadingPage}
			<RouteSkeleton page={loadingPage} />
		{:else}
			{#key page.url.pathname}
				<div class="route-content" class:analytics-enter={page.route.id === '/analytics'}>
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
