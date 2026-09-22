<script lang="ts">
	import { ChevronLeft, ChevronRight } from '$lib/components/ui/icons';
	import { cn } from '$lib/utils.js';

	let {
		page = $bindable(1),
		totalItems = 0,
		itemsPerPage = 5,
		loading = false,
		onpagechange
	}: {
		page?: number;
		totalItems?: number;
		itemsPerPage?: number;
		loading?: boolean;
		onpagechange?: (page: number) => void;
	} = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(totalItems / itemsPerPage)));
	const start = $derived(totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1);
	const end = $derived(Math.min(page * itemsPerPage, totalItems));

	function setPage(p: number) {
		if (loading || p < 1 || p > totalPages || p === page) return;
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

<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-busy={loading}>
	<span class="text-on-surface-variant text-sm">
		{#if loading}<span role="status">Loading page…</span>{:else}Showing {start} to {end} of {totalItems.toLocaleString()}
			entries{/if}
	</span>

	<div class="flex flex-wrap gap-1" aria-label="Table pagination">
		<button
			class="text-on-surface-variant flex size-8 items-center justify-center rounded-md transition-colors hover:bg-surface-container disabled:opacity-50"
			disabled={loading || page <= 1}
			onclick={() => setPage(page - 1)}
			aria-label="Previous page"
		>
			<ChevronLeft class="size-4" />
		</button>

		{#each visiblePages() as pg, i (typeof pg === 'number' ? `n-${pg}` : `d-${i}`)}
			{#if pg === '...'}
				<span class="text-on-surface-variant flex size-8 items-center justify-center">...</span>
			{:else}
				<button
					disabled={loading}
					aria-current={pg === page ? 'page' : undefined}
					aria-label={`Page ${pg}`}
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
			disabled={loading || page >= totalPages}
			onclick={() => setPage(page + 1)}
			aria-label="Next page"
		>
			<ChevronRight class="size-4" />
		</button>
	</div>
</div>
