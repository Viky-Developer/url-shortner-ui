<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	export const dialogVariants = tv({
		base: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
	});

	export type DialogProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	let { class: className, children, ref = $bindable(null), ...restProps }: DialogProps = $props();
</script>

<div bind:this={ref} class={cn(dialogVariants(), className)} {...restProps}>
	<div class="rounded-xl border bg-white p-6 shadow-lg">
		{@render children?.()}
	</div>
</div>
