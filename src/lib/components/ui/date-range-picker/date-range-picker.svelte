<script lang="ts">
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';
	import type { DateRange } from 'bits-ui';

	let {
		value = $bindable(),
		placeholder = $bindable(new CalendarDate(2025, 1, 1)),
		class: className,
		...restProps
	}: {
		value?: DateRange;
		placeholder?: DateValue;
		class?: string;
		[key: string]: any;
	} = $props();
</script>

<Popover>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class={cn('w-[300px] justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
				{...props}
				{...restProps}
			>
				{value?.start
					? `${value.start.toString()} - ${value.end?.toString() || ''}`
					: 'Pick a date range'}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-auto p-0">
		<RangeCalendar bind:value bind:placeholder />
	</PopoverContent>
</Popover>
