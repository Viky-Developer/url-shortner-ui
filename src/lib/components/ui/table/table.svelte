<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLTableAttributes } from 'svelte/elements';

	export const tableVariants = tv({
		base: 'w-full caption-bottom text-sm'
	});

	export type TableProps = WithElementRef<HTMLTableAttributes, HTMLTableElement>;
</script>

<script lang="ts">
	let { ref = $bindable(null), class: className, children, ...restProps }: TableProps = $props();
</script>

<div class="relative w-full overflow-auto">
	<table bind:this={ref} class={cn(tableVariants(), className)} {...restProps}>
		{@render children?.()}
	</table>
</div>
