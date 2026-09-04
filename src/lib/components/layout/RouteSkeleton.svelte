<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';

	let { page }: { page: 'dashboard' | 'my-links' } = $props();
</script>

<div
	class="mx-auto flex w-full max-w-7xl flex-col gap-6"
	aria-label="Loading page"
	aria-busy="true"
>
	{#if page === 'dashboard'}
		<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each [0, 1, 2] as card (card)}
				<div class="rounded-xl border border-border bg-card p-5">
					<Skeleton class="h-3 w-24" />
					<Skeleton class="mt-4 h-9 w-20" />
					<Skeleton class="mt-4 h-2 w-full" />
				</div>
			{/each}
		</section>

		<section class="rounded-xl border border-border bg-card p-6 sm:p-8">
			<Skeleton class="mx-auto h-8 w-44" />
			<Skeleton class="mx-auto mt-5 h-12 max-w-3xl" />
		</section>
	{:else}
		<header class="flex items-end justify-between gap-4">
			<div class="space-y-3">
				<Skeleton class="h-9 w-36" />
				<Skeleton class="h-4 w-64 max-w-full" />
			</div>
			<Skeleton class="h-11 w-40" />
		</header>

		<section class="grid grid-cols-2 gap-3 lg:grid-cols-5">
			{#each [0, 1, 2, 3, 4] as card (card)}
				<div class="rounded-xl border border-border bg-card p-4">
					<Skeleton class="h-3 w-16" />
					<Skeleton class="mt-3 h-8 w-12" />
				</div>
			{/each}
		</section>

		<section class="overflow-hidden rounded-xl border border-border bg-card">
			<div class="flex gap-6 border-b border-border p-4">
				{#each [0, 1, 2, 3, 4] as tab (tab)}
					<Skeleton class="h-4 w-14" />
				{/each}
			</div>
			<div class="space-y-4 p-5">
				{#each [0, 1, 2, 3, 4, 5, 6] as row (row)}
					<div class="grid grid-cols-5 items-center gap-5">
						<Skeleton class="h-5 w-full" />
						<Skeleton class="col-span-2 h-5 w-full" />
						<Skeleton class="h-5 w-20" />
						<Skeleton class="h-8 w-full" />
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>
