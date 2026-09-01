<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLLabelAttributes } from 'svelte/elements';

	export const labelVariants = tv({
		base: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
	});

	export type LabelProps = WithElementRef<HTMLLabelAttributes>;
</script>

<script lang="ts">
	let { class: className, children, ref = $bindable(null), ...restProps }: LabelProps = $props();
</script>

<label bind:this={ref} class={cn(labelVariants(), className)} {...restProps}>
	{@render children?.()}
</label>
