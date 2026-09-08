<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { BrandLogo, LoaderCircle, LogOut } from '$lib/components/ui/icons';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import ServerOff from '@lucide/svelte/icons/server-off';

	let retrying = $state(false);

	async function retry(): Promise<void> {
		retrying = true;
		try {
			await invalidateAll();
		} finally {
			retrying = false;
		}
	}
</script>

<section
	class="relative mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-7xl place-items-center overflow-hidden rounded-2xl border border-border bg-card px-5 py-12"
	aria-labelledby="service-unavailable-title"
	aria-live="polite"
>
	<div
		class="pointer-events-none absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
	></div>
	<div class="relative max-w-xl text-center">
		<div
			class="mx-auto flex size-16 items-center justify-center rounded-2xl shadow-lg shadow-primary/20"
		>
			<BrandLogo class="size-16" />
		</div>
		<div
			class="mx-auto mt-7 flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300"
		>
			<ServerOff class="size-3.5" /> Server unavailable
		</div>
		<h1
			id="service-unavailable-title"
			class="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
		>
			We can't reach Linkpluse right now
		</h1>
		<p class="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
			The application is running, but the data service is not responding. Your account and links are
			safe. Try again when the connection is restored.
		</p>
		<div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
			<Button class="h-10 px-5" onclick={retry} disabled={retrying}>
				{#if retrying}<LoaderCircle class="animate-spin" />{:else}<RotateCcw />{/if}
				{retrying ? 'Checking connection…' : 'Try again'}
			</Button>
			<form method="POST" action={resolve('/logout')}>
				<Button type="submit" variant="outline" class="h-10 w-full px-5 sm:w-auto">
					<LogOut /> Sign out
				</Button>
			</form>
		</div>
		<p class="mt-5 text-xs text-muted-foreground">
			No data is shown while the service status is uncertain.
		</p>
	</div>
</section>
