<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	export const tableCellVariants = tv({
		base: 'p-4 align-middle [&:has([role=checkbox])]:pr-0'
	});

	export type TableCellProps = WithElementRef<
		HTMLAttributes<HTMLTableCellElement>,
		HTMLTableCellElement
	>;
</script>

<script lang="ts">
	let {
		class: className,
		children,
		ref = $bindable(null),
		...restProps
	}: TableCellProps = $props();
</script>

<td bind:this={ref} class={cn(tableCellVariants(), className)} {...restProps}>
	{@render children?.()}
</td>
