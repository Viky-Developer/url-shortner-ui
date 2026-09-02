<script lang="ts">
	import {
		CalendarDate,
		type DateValue,
		DateFormatter,
		today,
		getLocalTimeZone,
		startOfMonth,
		startOfYear
	} from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';

	let {
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		...restProps
	}: {
		value?: DateRange;
		placeholder?: DateValue;
		class?: string;
	} = $props();

	type Preset = {
		label: string;
		start: CalendarDate;
		end: CalendarDate;
	};

	let open = $state(false);
	let compare = $state(false);
	let compareMode = $state<'previous-period' | 'previous-year' | 'custom'>('previous-period');

	const shortFormatter = new DateFormatter('en-US', { month: 'short', day: 'numeric' });
	const yearFormatter = new DateFormatter('en-US', { year: 'numeric' });

	function toCalendarDate(v: DateValue | CalendarDate): CalendarDate {
		return v instanceof CalendarDate ? v : new CalendarDate(v.year, v.month, v.day);
	}

	function addDays(cd: CalendarDate, days: number): CalendarDate {
		const d = cd.toDate(getLocalTimeZone());
		d.setDate(d.getDate() + days);
		return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
	}

	function addMonths(cd: CalendarDate, months: number): CalendarDate {
		const d = cd.toDate(getLocalTimeZone());
		d.setMonth(d.getMonth() + months);
		return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
	}

	const zone = getLocalTimeZone();

	function formatShort(cd: CalendarDate): string {
		return shortFormatter.format(cd.toDate(zone));
	}

	function formatDisplay(range?: DateRange): string {
		if (!range?.start) return 'Pick a date range';
		const start = toCalendarDate(range.start);
		const end = range.end ? toCalendarDate(range.end) : undefined;
		if (!end) return formatShort(start);
		return `${formatShort(start)} - ${formatShort(end)}, ${yearFormatter.format(end.toDate(zone))}`;
	}

	const todayDate = $derived(today(zone));

	const presets: Preset[] = $derived([
		{ label: 'Last 7 days', start: addDays(todayDate, -6), end: todayDate },
		{ label: 'Last 30 days', start: addDays(todayDate, -29), end: todayDate },
		{ label: 'Last 3 months', start: addMonths(todayDate, -3), end: todayDate },
		{ label: 'Year to date', start: startOfYear(todayDate), end: todayDate }
	]);

	function isActive(preset: Preset): boolean {
		return !!(
			value?.start &&
			value?.end &&
			toCalendarDate(value.start).compare(preset.start) === 0 &&
			toCalendarDate(value.end).compare(preset.end) === 0
		);
	}

	function applyPreset(preset: Preset) {
		value = { start: preset.start, end: preset.end };
		placeholder = preset.end;
		open = false;
	}

	$effect(() => {
		if (!placeholder) placeholder = startOfMonth(todayDate);
	});
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<button
				{...props}
				{...restProps}
				class={cn(
					'text-on-surface inline-flex items-center gap-2 rounded-lg border border-border bg-surface-container px-3 py-1.5 text-sm transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
					className
				)}
			>
				<svg
					class="text-on-surface-variant size-4"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M8 2v4" />
					<path d="M16 2v4" />
					<rect width="18" height="18" x="3" y="4" rx="2" />
					<path d="M3 10h18" />
				</svg>
				<span>{formatDisplay(value)}</span>
				<svg
					class="text-on-surface-variant size-4"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>
		{/snippet}
	</PopoverTrigger>

	<PopoverContent class="w-auto p-0" align="start" sideOffset={8}>
		<div
			class="shadow-overlay flex flex-col overflow-hidden rounded-xl border border-border bg-popover"
		>
			<div class="flex">
				<div class="w-44 shrink-0 border-r border-border bg-surface-container-low p-2">
					{#each presets as preset (preset.label)}
						<button
							class={cn(
								'block w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
								isActive(preset) && 'bg-primary-container text-on-primary-container'
							)}
							onclick={() => applyPreset(preset)}
						>
							{preset.label}
						</button>
					{/each}
				</div>

				<div class="min-w-0 flex-1 p-2">
					<RangeCalendar bind:value bind:placeholder numberOfMonths={2} />
				</div>
			</div>

			<div
				class="flex items-center justify-between gap-3 border-t border-border bg-surface-container-low p-4"
			>
				<div class="flex items-center gap-3">
					<label class="text-on-surface flex cursor-pointer items-center gap-2 text-sm select-none">
						<input type="checkbox" bind:checked={compare} class="sr-only" />
						<span
							class={cn(
								'relative inline-flex h-4 w-8 items-center rounded-full transition-colors',
								compare ? 'bg-primary' : 'bg-surface-container-highest'
							)}
						>
							<span
								class={cn(
									'absolute top-0.5 left-0.5 h-3 w-3 rounded-full transition-transform',
									compare ? 'translate-x-4 bg-white' : 'bg-on-surface-variant'
								)}
							></span>
						</span>
						<span>Compare</span>
					</label>
					<span class={cn('flex items-center gap-2', !compare && 'pointer-events-none opacity-50')}>
						<span class="text-on-surface-variant">to</span>
						<select
							bind:value={compareMode}
							disabled={!compare}
							class="text-on-surface rounded-md border border-border bg-surface-container px-2 py-1 text-sm focus:ring-2 focus:ring-ring focus:outline-none disabled:pointer-events-none disabled:opacity-100"
						>
							<option value="previous-period">Previous period</option>
							<option value="previous-year">Previous year</option>
							<option value="custom">Custom</option>
						</select>
					</span>
				</div>

				<div class="flex items-center gap-2">
					<Button variant="ghost" class="h-8 px-4" onclick={() => (open = false)}>Cancel</Button>
					<Button
						class="bg-primary-container text-on-primary-container hover:bg-inverse-primary h-8 px-4 shadow-sm"
						onclick={() => (open = false)}
					>
						Apply
					</Button>
				</div>
			</div>
		</div>
	</PopoverContent>
</Popover>
