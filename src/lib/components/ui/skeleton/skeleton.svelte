<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	export const skeletonVariants = tv({
		base: 'animate-pulse rounded-md bg-zinc-100'
	});

	export type SkeletonProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	let { class: className, ref = $bindable(null), ...restProps }: SkeletonProps = $props();
</script>

<div bind:this={ref} class={cn(skeletonVariants(), className)} {...restProps}></div>
