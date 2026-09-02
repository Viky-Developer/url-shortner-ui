<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLInputAttributes } from 'svelte/elements';

	export const inputVariants = tv({
		base: 'flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50'
	});

	export type InputProps = WithElementRef<HTMLInputAttributes, HTMLInputElement>;
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(),
		...restProps
	}: InputProps = $props();
</script>

<input bind:this={ref} bind:value class={cn(inputVariants(), className)} {...restProps} />
