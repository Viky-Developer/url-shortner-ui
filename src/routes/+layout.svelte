<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { Sidebar, TopBar } from '$lib/components/layout';
	import { Toaster } from 'svelte-sonner';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	let sidebarOpen = $state(false);
	const isAuthRoute = $derived(page.url.pathname === '/signup');
</script>

{#if isAuthRoute}
	{@render children()}
{:else}
	<TopBar onmenuclick={() => (sidebarOpen = true)} />
	<Sidebar user={data.user} open={sidebarOpen} onclose={() => (sidebarOpen = false)} />

	<main class="min-h-screen space-y-8 p-4 pt-4 md:ml-60 md:p-8">
		{@render children()}
	</main>
{/if}

<Toaster
	position="top-right"
	richColors
	toastOptions={{ style: 'min-height: 64px; padding: 16px 18px;' }}
/>
