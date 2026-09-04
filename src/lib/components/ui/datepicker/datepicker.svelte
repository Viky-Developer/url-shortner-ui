<script lang="ts">
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Calendar as CalendarIcon } from '$lib/components/ui/icons';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';

	let {
		value = $bindable<DateValue | undefined>(undefined),
		placeholder = $bindable(today(getLocalTimeZone())),
		minValue,
		class: className,
		...restProps
	}: {
		value?: DateValue;
		placeholder?: DateValue;
		minValue?: DateValue;
		class?: string;
	} = $props();
	const selectableYears = $derived(
		Array.from({ length: 5 }, (_, index) => (minValue?.year ?? placeholder.year) + index)
	);

	function displayDate(date: DateValue): string {
		return `${String(date.day).padStart(2, '0')}-${String(date.month).padStart(2, '0')}-${date.year}`;
	}
</script>

<Popover>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class={cn(
					'w-[240px] justify-start text-left font-normal',
					!value && 'text-muted-foreground',
					className
				)}
				{...props}
				{...restProps}
			>
				<CalendarIcon class="size-4 text-muted-foreground" />
				{value ? displayDate(value) : 'DD-MM-YYYY'}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-auto p-0">
		<Calendar
			type="single"
			bind:value
			bind:placeholder
			{minValue}
			captionLayout="dropdown"
			monthFormat="short"
			years={selectableYears}
		/>
	</PopoverContent>
</Popover>
