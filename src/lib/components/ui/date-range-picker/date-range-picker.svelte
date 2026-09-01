<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	export const dateRangePickerVariants = tv({
		base: 'flex items-center gap-2'
	});

	export type DateRangePickerProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { DatePicker } from '$lib/components/ui/datepicker';

	let { class: className, ref = $bindable(null), ...restProps }: DateRangePickerProps = $props();
</script>

<div bind:this={ref} class={cn(dateRangePickerVariants(), className)} {...restProps}>
	<div class="flex-1">
		<DatePicker placeholder="Start Date" />
	</div>
	<div class="flex-1">
		<DatePicker placeholder="End Date" />
	</div>
</div>
