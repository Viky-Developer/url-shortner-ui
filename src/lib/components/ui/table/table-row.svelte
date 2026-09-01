<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	export const tableRowVariants = tv({
		base: 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
	});

	export type TableRowProps = WithElementRef<
		HTMLAttributes<HTMLTableRowElement>,
		HTMLTableRowElement
	>;
</script>

<script lang="ts">
	let { class: className, children, ref = $bindable(null), ...restProps }: TableRowProps = $props();
</script>

<tr bind:this={ref} class={cn(tableRowVariants(), className)} {...restProps}>
	{@render children?.()}
</tr>
