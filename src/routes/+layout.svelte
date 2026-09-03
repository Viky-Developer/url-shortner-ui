<script lang="ts">
	import './layout.css';
	import { Sidebar, TopBar } from '$lib/components/layout';

	let { children } = $props();
	let sidebarOpen = $state(false);
</script>

<TopBar onmenuclick={() => (sidebarOpen = true)} />
<Sidebar open={sidebarOpen} onclose={() => (sidebarOpen = false)} />

<main class="min-h-screen space-y-8 p-4 pt-4 md:ml-60 md:p-8">
	{@render children()}
</main>
