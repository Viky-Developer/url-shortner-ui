<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { BrandLogo } from '$lib/components/ui/icons';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';

	const notFound = $derived(page.status === 404);
	const signedIn = $derived(Boolean(page.data.user));
	const networkFailure = $derived(
		/failed to fetch|fetch failed|network ?error|load failed/i.test(page.error?.message ?? '')
	);
	const heading = $derived(
		notFound
			? 'This page slipped away'
			: networkFailure
				? 'The Linkpluse service is unavailable'
				: 'Something interrupted the signal'
	);
	const description = $derived(
		notFound
			? 'The link may be outdated, mistyped, or moved to a new location.'
			: networkFailure
				? 'We cannot connect to the server right now. Please wait a moment and try again.'
				: 'Linkpluse could not finish loading this page. Your data is safe—try the request again.'
	);
</script>

<svelte:head>
	<title>{page.status} | Linkpluse</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main
	class="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 py-12"
>
	<div
		class="pointer-events-none absolute -top-40 left-1/2 size-120 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
	></div>
	<section
		class="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card p-7 text-center shadow-xl sm:p-12"
		aria-labelledby="fallback-title"
	>
		<div
			class="mx-auto flex size-16 items-center justify-center rounded-2xl shadow-lg shadow-primary/20"
		>
			<BrandLogo class="size-16" />
		</div>
		<p class="mt-8 font-mono text-sm font-semibold tracking-[0.2em] text-primary uppercase">
			Error {page.status}
		</p>
		<h1
			id="fallback-title"
			class="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
		>
			{heading}
		</h1>
		<p class="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>

		{#if page.error?.message && !notFound && !networkFailure}
			<p
				class="mx-auto mt-5 max-w-md rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground"
			>
				{page.error.message}
			</p>
		{/if}

		<div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
			{#if signedIn}
				<a
					href={resolve('/dashboard')}
					class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					<ArrowLeft class="size-4" /> Back to dashboard
				</a>
			{:else}
				<a
					href={resolve('/login')}
					class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					<ArrowLeft class="size-4" /> Go to sign in
				</a>
			{/if}
			<button
				type="button"
				onclick={() => window.location.reload()}
				class="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				<RotateCcw class="size-4" /> Try again
			</button>
		</div>
	</section>
</main>
