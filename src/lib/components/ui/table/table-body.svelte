<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	export const tableBodyVariants = tv({
		base: '[&_tr:last-child]:border-0'
	});

	export type TableBodyProps = WithElementRef<
		HTMLAttributes<HTMLTableSectionElement>,
		HTMLTableSectionElement
	>;
</script>

<script lang="ts">
	let {
		class: className,
		children,
		ref = $bindable(null),
		...restProps
	}: TableBodyProps = $props();
</script>

<tbody bind:this={ref} class={cn(tableBodyVariants(), className)} {...restProps}>
	{@render children?.()}
</tbody>
