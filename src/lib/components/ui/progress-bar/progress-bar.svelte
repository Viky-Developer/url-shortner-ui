<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		label,
		count,
		percentage,
		color,
		class: className
	}: {
		label: string;
		count: string | number;
		percentage: number;
		color: string;
		class?: string;
	} = $props();
</script>

<div class={cn('flex flex-col gap-2', className)}>
	<div class="flex items-center justify-between text-sm">
		<span class="flex items-center gap-2">
			<span class="h-2 w-2 rounded-full" style:background-color={color}></span>
			{label}
		</span>
		<span class="font-mono text-code-base">{count}</span>
	</div>
	<div class="h-2 w-full overflow-hidden rounded-full bg-surface-container">
		<div
			class="h-full rounded-full transition-all duration-500"
			style:width="{Math.min(percentage, 100)}%"
			style:background-color={color}
		></div>
	</div>
</div>
