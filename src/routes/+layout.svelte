<script lang="ts">
	import './layout.css';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import { CreateLinkModal, RouteSkeleton, Sidebar, TopBar } from '$lib/components/layout';
	import { Button } from '$lib/components/ui/button';
	import Clock3 from '@lucide/svelte/icons/clock-3';
	import LogOut from '@lucide/svelte/icons/log-out';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { toast, Toaster } from 'svelte-sonner';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	let sidebarOpen = $state(false);
	let desktopSidebarOpen = $state(true);
	let restoringAccount = $state(false);

	const restoreAccount: SubmitFunction = () => {
		restoringAccount = true;
		return async ({ result, update }) => {
			try {
				if (
					result.type === 'success' &&
					typeof result.data?.success === 'string' &&
					'redirectTo' in result.data &&
					typeof result.data.redirectTo === 'string'
				) {
					toast.success(result.data.success);
					window.location.assign(result.data.redirectTo);
					return;
				}

				await update();
				if (result.type === 'failure' && typeof result.data?.error === 'string') {
					toast.error(result.data.error);
				} else if (result.type === 'error') {
					toast.error('Unable to restore your account. Please try again.');
				}
			} finally {
				restoringAccount = false;
			}
		};
	};

	function toggleSidebar() {
		if (window.matchMedia('(min-width: 768px)').matches) {
			desktopSidebarOpen = !desktopSidebarOpen;
		} else {
			sidebarOpen = true;
		}
	}
	const isAuthRoute = $derived(['/login', '/signup'].includes(page.url.pathname));
	const pendingDeletion = $derived(data.user?.status?.toUpperCase() === 'PENDING_DELETION');

	$effect(() => {
		const authRoute = isAuthRoute;
		const root = document.documentElement;
		root.classList.remove('theme-changing');

		if (authRoute) {
			root.classList.remove('dark');
			return;
		}

		const savedTheme = localStorage.getItem('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		root.classList.toggle('dark', savedTheme ? savedTheme === 'dark' : prefersDark);
	});

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
		{#if pendingDeletion}
			<section class="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-10">
				<div
					class="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-10"
				>
					<span
						class="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300"
					>
						<Clock3 class="size-7" aria-hidden="true" />
					</span>
					<span
						class="mt-5 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-300"
					>
						<TriangleAlert class="size-3.5" aria-hidden="true" /> Pending deletion
					</span>
					<h1 class="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
						Account Deletion Pending
					</h1>
					<p class="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
						Your account is currently in a grace period. All account sections are paused and will
						remain unavailable until you restore the account.
					</p>
					<div class="mt-8 grid gap-4 border-t border-border pt-8 text-left sm:grid-cols-2">
						<div class="rounded-xl border border-border bg-background p-5">
							<span
								class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
							>
								<RotateCcw class="size-4" aria-hidden="true" />
							</span>
							<h2 class="mt-4 font-semibold text-foreground">Restore Account</h2>
							<p class="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">
								Cancel the deletion process and immediately restore access to your account and data.
							</p>
							<form
								method="POST"
								action={`${resolve('/settings')}?/cancelDeletion`}
								class="mt-4"
								use:enhance={restoreAccount}
							>
								<Button type="submit" class="w-full" disabled={restoringAccount}>
									{restoringAccount ? 'Restoring…' : 'Cancel Deletion'}
								</Button>
							</form>
						</div>
						<div class="rounded-xl border border-border bg-background p-5">
							<span
								class="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"
							>
								<LogOut class="size-4" aria-hidden="true" />
							</span>
							<h2 class="mt-4 font-semibold text-foreground">Sign Out</h2>
							<p class="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">
								Leave your account in the pending deletion state and return to the login screen.
							</p>
							<form method="POST" action={resolve('/logout')} class="mt-4">
								<Button type="submit" variant="outline" class="w-full">Log Out</Button>
							</form>
						</div>
					</div>
					<p class="mt-8 text-xs text-muted-foreground">Need assistance? Contact Support</p>
				</div>
			</section>
		{:else if loadingPage}
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
