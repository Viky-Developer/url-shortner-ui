<script lang="ts">
	import {
		CalendarDate,
		type DateValue,
		DateFormatter,
		today,
		startOfMonth,
		startOfYear
	} from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import { Calendar, ChevronDown } from '$lib/components/ui/icons';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';
	let {
		value = $bindable(),
		placeholder = $bindable(),
		compare = false,
		compareMode = 'previous-period',
		showCompare = true,
		onapply,
		onclear,
		class: className
	}: {
		value?: DateRange;
		placeholder?: DateValue;
		compare?: boolean;
		compareMode?: 'previous-period' | 'previous-year';
		showCompare?: boolean;
		onapply?: (selection: {
			value: DateRange;
			compare: boolean;
			compareMode: 'previous-period' | 'previous-year';
		}) => void;
		onclear?: () => void;
		class?: string;
	} = $props();
	let open = $state(false);
	let viewportWidth = $state(1280);
	let draft = $state<DateRange>({ start: undefined, end: undefined });
	let draftPlaceholder = $state<DateValue>();
	let draftCompare = $state(false);
	let draftMode = $state<'previous-period' | 'previous-year'>('previous-period');
	const formatter = new DateFormatter('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
	function cd(date: DateValue) {
		return new CalendarDate(date.year, date.month, date.day);
	}
	function display(range?: DateRange) {
		if (!range?.start) return 'Pick a date range';
		const start = formatter.format(range.start.toDate('UTC'));
		if (!range.end) return start;
		return `${start}${range.start.year !== range.end.year ? `, ${range.start.year}` : ''} - ${formatter.format(range.end.toDate('UTC'))}, ${range.end.year}`;
	}
	function changeOpen(next: boolean) {
		if (next) {
			draft = { start: value?.start, end: value?.end };
			draftCompare = compare;
			draftMode = compareMode;
			draftPlaceholder = startOfMonth(value?.end ?? placeholder ?? today('UTC')).subtract({
				months: 1
			});
		}
		open = next;
	}
	const todayDate = $derived(today('UTC'));
	const presets = $derived([
		{ label: 'Last 7 days', start: todayDate.subtract({ days: 6 }), end: todayDate },
		{ label: 'Last 30 days', start: todayDate.subtract({ days: 29 }), end: todayDate },
		{ label: 'Last 3 months', start: todayDate.subtract({ months: 3 }), end: todayDate },
		{ label: 'Year to date', start: startOfYear(todayDate), end: todayDate }
	]);
	function apply() {
		if (!draft.start || !draft.end) return;
		value = { ...draft };
		placeholder = draftPlaceholder;
		onapply?.({ value, compare: draftCompare, compareMode: draftMode });
		open = false;
	}
	function clear() {
		value = undefined;
		onclear?.();
		open = false;
	}
</script>

<svelte:window bind:innerWidth={viewportWidth} />

<Popover {open} onOpenChange={changeOpen}>
	<PopoverTrigger>
		{#snippet child({ props })}
			<button
				{...props}
				class={cn(
					'inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
					className
				)}
			>
				<Calendar class="size-4" /><span>{display(value)}</span><ChevronDown
					class={cn('size-4 transition-transform', open && 'rotate-180')}
				/>
			</button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent
		class="w-[min(610px,calc(100vw-24px))] overflow-hidden rounded-lg border border-border p-0 shadow-xl dark:bg-[#27262f]"
		align="end"
		sideOffset={8}
	>
		<div class="flex flex-col sm:flex-row">
			<div
				class="flex shrink-0 flex-wrap gap-1 border-b border-border bg-muted/30 p-2 sm:w-[152px] sm:flex-col sm:border-r sm:border-b-0 dark:bg-[#1b1a23]"
			>
				{#each presets as preset (preset.label)}
					{@const active =
						draft.start &&
						draft.end &&
						cd(draft.start).compare(preset.start) === 0 &&
						cd(draft.end).compare(preset.end) === 0}
					<button
						class={cn(
							'rounded-md px-3 py-2 text-left text-[13px] transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
							active && 'bg-[#4f46e5] text-white hover:bg-[#4f46e5]'
						)}
						onclick={() => {
							draft = { start: preset.start, end: preset.end };
							draftPlaceholder = startOfMonth(preset.end).subtract({
								months: viewportWidth < 640 ? 0 : 1
							});
						}}>{preset.label}</button
					>
				{/each}
			</div>
			<div class="min-w-0 flex-1 overflow-x-auto p-2">
				<RangeCalendar
					bind:value={draft}
					bind:placeholder={draftPlaceholder}
					numberOfMonths={viewportWidth < 640 ? 1 : 2}
					disableDaysOutsideMonth
					class="w-full bg-transparent p-1 [--cell-size:28px] [&_[data-outside-month]]:invisible [&_[data-range-middle]]:bg-[#37336a] [&_[data-range-middle]]:text-[#e7e5ff] [&>div]:flex-row [&>div]:gap-3"
				/>
			</div>
		</div>
		<div
			class="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3 dark:bg-[#1b1a23]"
		>
			{#if showCompare}<div class="flex items-center gap-2 text-[13px]">
					<label class="flex cursor-pointer items-center gap-2">
						<input type="checkbox" bind:checked={draftCompare} class="peer sr-only" />
						<span
							class={cn(
								'relative h-4 w-8 rounded-full bg-muted-foreground/30 peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
								draftCompare && 'bg-[#4f46e5]'
							)}
							><span
								class={cn(
									'absolute top-0.5 left-0.5 size-3 rounded-full bg-[#c3c0ff] transition-transform',
									draftCompare && 'translate-x-4'
								)}
							></span></span
						>
						Compare
					</label>
					<span class="text-muted-foreground">to</span>
					<select
						aria-label="Comparison period"
						bind:value={draftMode}
						disabled={!draftCompare}
						class="min-w-0 rounded border border-border bg-transparent px-2 py-1 text-xs disabled:opacity-40"
					>
						<option value="previous-period">Previous period</option><option value="previous-year"
							>Previous year</option
						>
					</select>
				</div>{/if}
			<div class="ml-auto flex gap-2">
				{#if onclear && value}<Button variant="ghost" class="h-8 px-3 text-xs" onclick={clear}
						>Clear</Button
					>{/if}
				<Button variant="ghost" class="h-8 px-3 text-xs" onclick={() => (open = false)}
					>Cancel</Button
				><Button
					class="h-8 bg-[#4f46e5] px-4 text-xs text-white hover:bg-[#4338ca]"
					disabled={!draft.start || !draft.end}
					onclick={apply}>Apply</Button
				>
			</div>
		</div>
	</PopoverContent>
</Popover>
