<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		page = $bindable(1),
		totalItems = 0,
		itemsPerPage = 5,
		onpagechange
	}: {
		page?: number;
		totalItems?: number;
		itemsPerPage?: number;
		onpagechange?: (page: number) => void;
	} = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(totalItems / itemsPerPage)));
	const start = $derived((page - 1) * itemsPerPage + 1);
	const end = $derived(Math.min(page * itemsPerPage, totalItems));

	function setPage(p: number) {
		if (p < 1 || p > totalPages || p === page) return;
		onpagechange?.(p);
	}

	function visiblePages(): (number | '...')[] {
		const pages: (number | '...')[] = [];
		const total = totalPages;
		const current = page;

		if (total <= 7) {
			for (let i = 1; i <= total; i++) pages.push(i);
			return pages;
		}

		pages.push(1);

		if (current > 3) pages.push('...');

		const rangeStart = Math.max(2, current - 1);
		const rangeEnd = Math.min(total - 1, current + 1);

		for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

		if (current < total - 2) pages.push('...');

		pages.push(total);
		return pages;
	}
</script>

<div class="flex items-center justify-between">
	<span class="text-on-surface-variant text-sm">
		Showing {start} to {end} of {totalItems.toLocaleString()} entries
	</span>

	<div class="flex gap-1">
		<button
			class="text-on-surface-variant flex size-8 items-center justify-center rounded-md transition-colors hover:bg-surface-container disabled:opacity-50"
			disabled={page <= 1}
			onclick={() => setPage(page - 1)}
			aria-label="Previous page"
		>
			<svg
				class="size-4"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m15 18-6-6 6-6" />
			</svg>
		</button>

		{#each visiblePages() as pg, i (typeof pg === 'number' ? `n-${pg}` : `d-${i}`)}
			{#if pg === '...'}
				<span class="text-on-surface-variant flex size-8 items-center justify-center">...</span>
			{:else}
				<button
					class={cn(
						'flex size-8 items-center justify-center rounded-md text-sm transition-colors',
						pg === page
							? 'bg-primary-container text-on-primary-container shadow-sm'
							: 'text-on-surface hover:bg-surface-container'
					)}
					onclick={() => setPage(pg)}
				>
					{pg}
				</button>
			{/if}
		{/each}

		<button
			class="text-on-surface-variant flex size-8 items-center justify-center rounded-md transition-colors hover:bg-surface-container disabled:opacity-50"
			disabled={page >= totalPages}
			onclick={() => setPage(page + 1)}
			aria-label="Next page"
		>
			<svg
				class="size-4"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m9 18 6-6-6-6" />
			</svg>
		</button>
	</div>
</div>
