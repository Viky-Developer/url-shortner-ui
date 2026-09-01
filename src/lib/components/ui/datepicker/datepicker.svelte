<script lang="ts">
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';

	let {
		value = $bindable(new CalendarDate(2025, 1, 1)),
		placeholder = $bindable(new CalendarDate(2025, 1, 1)),
		class: className,
	}: {
		value?: DateValue;
		placeholder?: DateValue;
		class?: string;
	} = $props();
</script>

<Popover>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class={cn('w-[240px] justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
				{...props}
			>
				{value ? value.toString() : 'Pick a date'}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-auto p-0">
		<Calendar bind:value bind:placeholder />
	</PopoverContent>
</Popover>
