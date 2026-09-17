<script lang="ts">
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { goto, invalidateAll } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { AreaChart } from '$lib/components/ui/area-chart';
	import { DateRangePicker } from '$lib/components/ui/date-range-picker';
	import { parseDate } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import { Pagination } from '$lib/components/ui/pagination';
	import { Button } from '$lib/components/ui/button';
	import Globe2 from '@lucide/svelte/icons/globe-2';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	let clicksLoading = $state(false);
	const chartData = $derived.by(() => {
		let total = 0;
		return (data.traffic?.dailyStats ?? [])
			.toSorted((a, b) => a.date.localeCompare(b.date))
			.map((d) => ({
				label: new Intl.DateTimeFormat('en-US', {
					month: 'short',
					day: 'numeric',
					timeZone: 'UTC'
				}).format(new Date(d.date)),
				value: (total += d.clicks)
			}));
	});
	const comparisonData = $derived.by(() => {
		let total = 0;
		return (data.comparison?.dailyStats ?? [])
			.toSorted((a, b) => a.date.localeCompare(b.date))
			.map((d) => ({ label: d.date, value: (total += d.clicks) }));
	});
	const topReferrers = $derived((data.traffic?.referrers ?? []).slice(0, 5));
	const topTrafficSource = $derived(topReferrers[0]?.referrer ?? 'No source yet');

	const range = $derived({ start: parseDate(data.from), end: parseDate(data.to) });
	const clickRange = $derived(
		data.clickRange
			? { start: parseDate(data.clickRange.from), end: parseDate(data.clickRange.to) }
			: undefined
	);
	async function changePage(next: number) {
		clicksLoading = true;
		const search = new SvelteURLSearchParams(page.url.searchParams);
		search.set('page', String(next));
		try {
			await goto(resolve(`/analytics?${search}`), { noScroll: true, keepFocus: true });
		} finally {
			clicksLoading = false;
		}
	}
	function applyRange(selection: {
		value: DateRange;
		compare: boolean;
		compareMode: 'previous-period' | 'previous-year';
	}) {
		if (!selection.value.start || !selection.value.end) return;
		const search = new SvelteURLSearchParams({
			from: selection.value.start.toString(),
			to: selection.value.end.toString()
		});
		const currentPage = page.url.searchParams.get('page');
		if (currentPage !== null) search.set('page', currentPage);
		for (const key of ['logFrom', 'logTo']) {
			const value = page.url.searchParams.get(key);
			if (value !== null) search.set(key, value);
		}
		if (selection.compare) {
			search.set('compare', 'true');
			search.set('compareMode', selection.compareMode);
		}
		void goto(resolve(`/analytics?${search}`), { noScroll: true, keepFocus: true });
	}
	function applyClickRange(selection: { value: DateRange }) {
		if (!selection.value.start || !selection.value.end) return;
		const search = new SvelteURLSearchParams(page.url.searchParams);
		search.set('logFrom', selection.value.start.toString());
		search.set('logTo', selection.value.end.toString());
		search.delete('page');
		void goto(resolve(`/analytics?${search}`), { noScroll: true, keepFocus: true });
	}
	function clearClickRange() {
		const search = new SvelteURLSearchParams(page.url.searchParams);
		search.delete('logFrom');
		search.delete('logTo');
		search.delete('page');
		void goto(resolve(`/analytics?${search}`), { noScroll: true, keepFocus: true });
	}
	function timestamp(value: string) {
		return Number.isFinite(Date.parse(value))
			? new Date(value).toLocaleString('en-US', { timeZone: 'UTC' })
			: 'Unknown';
	}
</script>

<svelte:head><title>Link Analytics | Linkpluse</title></svelte:head>
<div class="space-y-6" aria-busy={!!navigating.to}>
	<section class="space-y-6" aria-labelledby="traffic-title">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h2 id="traffic-title" class="text-2xl font-semibold tracking-tight">Traffic Overview</h2>
			<DateRangePicker
				value={range}
				compare={data.compare}
				compareMode={data.compareMode}
				onapply={applyRange}
			/>
		</div>
		<div class="grid items-stretch gap-8 lg:grid-cols-[minmax(0,2.08fr)_minmax(0,1fr)]">
			<Card class="min-w-0 gap-0 border-primary/10 bg-linear-to-br from-card to-primary/5 py-0"
				><CardContent class="p-6 pb-3 sm:px-8 sm:pt-8">
					<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 class="text-xl font-semibold tracking-tight">Cumulative Click Performance</h3>
							<p class="mt-1 text-xs text-muted-foreground">
								Running total over the selected period
							</p>
						</div>
						<div class="text-right">
							<p class="text-xs font-medium text-muted-foreground">Total clicks</p>
							<p class="font-mono text-2xl font-semibold">
								{(data.traffic?.total ?? 0).toLocaleString()}
							</p>
						</div>
					</div>
					{#if data.loadError}<p role="alert" class="py-12 text-destructive">{data.loadError}</p>
						<Button variant="outline" onclick={() => invalidateAll()}>Try again</Button>
					{:else}<div class="[--chart-color:#c4baff] [--chart-fill-opacity:0.38]">
							<AreaChart
								data={chartData}
								{comparisonData}
								height={310}
								showPoints="sparse"
								showTooltip
								seriesLabel="Total clicks"
							/>
							<div
								class="mt-3 flex items-center justify-center gap-5 text-xs font-medium text-muted-foreground"
							>
								<span class="flex items-center gap-2"
									><span class="size-2.5 rounded-sm bg-primary"></span>Total clicks</span
								>{#if comparisonData.length}<span class="flex items-center gap-2"
										><span class="size-2.5 rounded-sm bg-primary/30"></span>Comparison</span
									>{/if}
							</div>
						</div>
						{#if data.traffic?.total === 0}<p class="text-sm text-muted-foreground">
								No clicks in this period.
							</p>{/if}
						{#if data.compare && data.comparisonRange}<div class="sr-only">
								<span>Selected period: {data.from} – {data.to}</span><span
									>Dashed line: {data.comparisonRange.from} – {data.comparisonRange.to}</span
								>
							</div>{/if}
						{#if data.comparisonError}<p role="alert" class="mt-3 text-sm text-destructive">
								{data.comparisonError}
							</p>{/if}
						<div class="sr-only">
							<p>Daily counts</p>
							<ul class="mt-2 space-y-1">
								{#each data.traffic?.dailyStats ?? [] as point, i (point.date)}<li>
										{point.date}: {point.clicks} clicks{#if data.compare && data.comparison?.dailyStats[i]}
											· {data.comparison.dailyStats[i].date}: {data.comparison.dailyStats[i].clicks} comparison
											clicks{/if}
									</li>{/each}
							</ul>
						</div>
					{/if}
				</CardContent></Card
			>
			<Card class="flex min-w-0 flex-col border-primary/10 bg-linear-to-br from-card to-primary/5">
				<CardHeader class="flex items-start justify-between">
					<div>
						<CardTitle class="text-xl">Referrer Channels</CardTitle>
						<p class="mt-1 text-xs text-muted-foreground">Traffic origin and share</p>
					</div>
					<Globe2 class="size-4 text-primary" />
				</CardHeader>
				<CardContent class="flex flex-1 flex-col">
					{#if data.loadError}
						<p class="text-sm text-muted-foreground">
							Referrers are unavailable. Retry the traffic overview.
						</p>
					{:else}
						<ul class="space-y-4">
							{#each topReferrers as item (item.referrer)}
								<li>
									<div class="flex items-center justify-between gap-3 text-xs">
										<span class="flex min-w-0 items-center gap-2 font-medium"
											><Globe2 class="size-3.5 shrink-0 text-primary" /><span
												class="truncate"
												title={item.referrer}>{item.referrer}</span
											></span
										>
										<span class="flex shrink-0 items-center gap-2 font-mono"
											>{item.count.toLocaleString()}<span
												class="w-8 text-right text-muted-foreground"
												>{Math.round(
													(item.count / Math.max(data.traffic?.total ?? 0, 1)) * 100
												)}%</span
											></span
										>
									</div>
									<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
										<div
											class="h-full rounded-full bg-primary/65"
											style:width={`${Math.min(100, (item.count / Math.max(data.traffic?.total ?? 0, 1)) * 100)}%`}
										></div>
									</div>
								</li>
							{:else}<li class="text-sm text-muted-foreground">
									No referrers in this period.
								</li>{/each}
						</ul>
						<div
							class="mt-auto flex items-center justify-between border-t border-border pt-5 text-xs"
						>
							<span class="text-muted-foreground">Top traffic source</span><strong
								class="max-w-40 truncate text-primary"
								title={topTrafficSource}>{topTrafficSource}</strong
							>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</section>
	<section class="space-y-4" aria-labelledby="click-log-title">
		<div class="flex flex-wrap items-end justify-between gap-3">
			<div>
				<h2 id="click-log-title" class="text-lg font-semibold">Click Log</h2>
				<p class="mt-1 text-xs text-muted-foreground">
					All links · {data.clickRange
						? `${data.clickRange.from} to ${data.clickRange.to}`
						: 'all dates'}
				</p>
			</div>
			<DateRangePicker
				value={clickRange}
				showCompare={false}
				onapply={applyClickRange}
				onclear={clearClickRange}
			/>
		</div>
		<Card
			><CardContent>
				{#if data.clicksError}<p role="alert" class="text-destructive">{data.clicksError}</p>
					<Button class="mt-3" variant="outline" onclick={() => invalidateAll()}
						>Retry click log</Button
					>
				{:else if data.clicks}
					<div class="overflow-x-auto">
						<table class="w-full text-left text-xs">
							<thead class="bg-muted text-muted-foreground"
								><tr
									>{#each ['Timestamp', 'Short code', 'IP address', 'Browser / Device', 'Referrer'] as heading (heading)}<th
											class="px-4 py-3 font-medium"
											scope="col">{heading}</th
										>{/each}</tr
								></thead
							><tbody
								>{#each data.clicks.clicks as click, i (i)}<tr class="border-b border-border"
										><td class="px-4 py-4 whitespace-nowrap">{timestamp(click.clickedAt)}</td><td
											class="px-4 py-4 font-mono">{click.shortCode || '—'}</td
										><td class="px-4 py-4 font-mono">{click.ipAddress}</td><td class="px-4 py-4"
											>{click.browser} / {click.deviceType}</td
										><td class="max-w-64 truncate px-4 py-4" title={click.referrer}
											>{click.referrer}</td
										></tr
									>{:else}<tr
										><td colspan="5" class="py-10 text-center text-muted-foreground"
											>No clicks to display.</td
										></tr
									>{/each}</tbody
							>
						</table>
					</div>
					<div class="mt-4">
						<Pagination
							loading={clicksLoading}
							page={data.clicks.page}
							totalItems={data.clicks.total}
							itemsPerPage={data.clicks.perPage}
							onpagechange={changePage}
						/>
					</div>
				{/if}
			</CardContent></Card
		>
	</section>
</div>
