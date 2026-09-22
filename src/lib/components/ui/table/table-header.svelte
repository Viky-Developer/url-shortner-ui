<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	export const tableHeaderVariants = tv({
		base: '[&_tr]:border-b'
	});

	export type TableHeaderProps = WithElementRef<
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
	}: TableHeaderProps = $props();
</script>

<thead bind:this={ref} class={cn(tableHeaderVariants(), className)} {...restProps}>
	{@render children?.()}
</thead>
