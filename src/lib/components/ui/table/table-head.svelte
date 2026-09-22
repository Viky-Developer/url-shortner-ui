<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	export const tableHeadVariants = tv({
		base: 'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'
	});

	export type TableHeadProps = WithElementRef<
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
	}: TableHeadProps = $props();
</script>

<th bind:this={ref} class={cn(tableHeadVariants(), className)} {...restProps}>
	{@render children?.()}
</th>
