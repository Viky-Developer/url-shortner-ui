<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { AreaChart } from '$lib/components/ui/area-chart';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { DateRangePicker } from '$lib/components/ui/date-range-picker';
	import { Pagination } from '$lib/components/ui/pagination';
	import { parseDate } from '@internationalized/date';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ChartNoAxesColumn from '@lucide/svelte/icons/chart-no-axes-column';
	import MousePointerClick from '@lucide/svelte/icons/mouse-pointer-click';
	import Users from '@lucide/svelte/icons/users';
	import Globe2 from '@lucide/svelte/icons/globe-2';
	import Mail from '@lucide/svelte/icons/mail';
	import type { DateRange } from 'bits-ui';
	import { SvelteMap, SvelteURLSearchParams } from 'svelte/reactivity';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let changingPage = $state(false);
	const range = $derived(
		data.from && data.to ? { start: parseDate(data.from), end: parseDate(data.to) } : undefined
	);
	const chartData = $derived(
		(data.analytics?.dailyStats ?? []).map((point) => ({
			label: new Intl.DateTimeFormat('en-US', {
				month: 'short',
				day: 'numeric',
				timeZone: 'UTC'
			}).format(new Date(point.date)),
			value: point.clicks
		}))
	);
	const totalClicks = $derived(data.analytics?.stats.totalClicks ?? 0);
	const uniqueVisitors = $derived(data.analytics?.stats.uniqueVisitors ?? 0);
	const clicksPerVisitor = $derived(
		uniqueVisitors > 0 ? (totalClicks / uniqueVisitors).toFixed(1) : '0.0'
	);
	const topReferrers = $derived((data.analytics?.referrers ?? []).slice(0, 6));
	const topTrafficSource = $derived(
		topReferrers.length > 0 ? channelName(topReferrers[0].referrer) : 'No source yet'
	);
	const topBrowsers = $derived.by(() => grouped('browser'));
	const topDevices = $derived.by(() => grouped('deviceType'));

	function grouped(field: 'browser' | 'deviceType') {
		const counts = new SvelteMap<string, number>();
		for (const click of data.clicks?.clicks ?? []) {
			const label = click[field] || 'Unknown';
			counts.set(label, (counts.get(label) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
	}

	function channelName(referrer: string): string {
		if (!referrer.trim()) return 'Direct / Email';
		try {
			return new URL(referrer).hostname.replace(/^www\./, '');
		} catch {
			return referrer;
		}
	}

	function applyRange(selection: { value: DateRange }) {
		if (!selection.value.start || !selection.value.end) return;
		const search = new SvelteURLSearchParams({
			from: selection.value.start.toString(),
			to: selection.value.end.toString()
		});
		void goto(resolve(`/my-links/${data.url?.id ?? ''}/analytics?${search}`), {
			noScroll: true,
			keepFocus: true
		});
	}

	async function changePage(next: number) {
		changingPage = true;
		const search = new SvelteURLSearchParams(page.url.searchParams);
		search.set('page', String(next));
		try {
			await goto(resolve(`/my-links/${data.url?.id ?? ''}/analytics?${search}`), {
				noScroll: true,
				keepFocus: true
			});
		} finally {
			changingPage = false;
		}
	}

	function timestamp(value: string) {
		return Number.isFinite(Date.parse(value))
			? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
			: 'Unknown';
	}
</script>

<svelte:head>
	<title>{data.url?.title || data.url?.shortCode || 'URL'} Analytics | Linkflow</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<Button variant="ghost" onclick={() => history.back()}><ArrowLeft /> Back to links</Button>
		{#if range}<DateRangePicker value={range} showCompare={false} onapply={applyRange} />{/if}
	</div>

	{#if data.urlError}
		<Card
			><CardContent class="py-12 text-center">
				<p class="text-destructive" role="alert">{data.urlError}</p>
				<Button class="mt-4" variant="outline" onclick={() => invalidateAll()}>Try again</Button>
			</CardContent></Card
		>
	{:else if data.url}
		<Card class="overflow-hidden border-primary/20 bg-linear-to-br from-card to-primary/5">
			<CardContent class="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<h1 class="truncate text-2xl font-semibold tracking-tight">
							{data.url.title || data.url.shortCode}
						</h1>
						<Badge variant={data.url.status === 'active' ? 'default' : 'secondary'}>
							{data.url.status}
						</Badge>
					</div>
					<p class="mt-2 truncate font-mono text-sm text-primary">
						{data.url.shortURL || data.url.shortCode}
					</p>
					<p
						class="mt-1 max-w-3xl truncate text-sm text-muted-foreground"
						title={data.url.originalURL}
					>
						{data.url.originalURL}
					</p>
				</div>
				<span class="group relative inline-flex">
					<Button
						href={data.url.shortURL}
						target="_blank"
						rel="noreferrer"
						variant="outline"
						disabled={data.url.status !== 'active'}
						class={data.url.status === 'active'
							? undefined
							: 'cursor-not-allowed border-muted bg-muted/50 text-muted-foreground opacity-60'}
						aria-describedby={data.url.status === 'active' ? undefined : 'open-link-disabled'}
						aria-label={data.url.status === 'active'
							? 'Open shortened link'
							: `Open link unavailable because this link is ${data.url.status}`}>Open link</Button
					>
					{#if data.url.status !== 'active'}
						<span
							id="open-link-disabled"
							role="tooltip"
							class="pointer-events-none absolute right-0 bottom-full z-20 mb-2 hidden w-max max-w-64 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg group-hover:block"
						>
							This link is {data.url.status}. Only active links can be opened.
						</span>
					{/if}
				</span>
			</CardContent>
		</Card>

		{#if data.analyticsError}
			<Card
				><CardContent class="py-10">
					<p class="text-destructive" role="alert">{data.analyticsError}</p>
					<Button class="mt-4" variant="outline" onclick={() => invalidateAll()}
						>Retry analytics</Button
					>
				</CardContent></Card
			>
		{:else}
			<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="URL analytics totals">
				{#each [{ label: 'Total clicks', value: totalClicks.toLocaleString(), icon: MousePointerClick }, { label: 'Unique visitors', value: uniqueVisitors.toLocaleString(), icon: Users }, { label: 'Clicks per visitor', value: clicksPerVisitor, icon: ChartNoAxesColumn }, { label: 'Tracked days', value: String(data.analytics?.dailyStats.length ?? 0), icon: ChartNoAxesColumn }] as stat (stat.label)}
					<Card
						><CardContent class="flex items-start justify-between p-5">
							<div>
								<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
									{stat.label}
								</p>
								<p class="mt-3 text-3xl font-semibold tracking-tight">{stat.value}</p>
							</div>
							<span
								class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
								><stat.icon class="size-4" /></span
							>
						</CardContent></Card
					>
				{/each}
			</section>

			<section class="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
				<Card class="border-primary/10 bg-linear-to-br from-card to-primary/5">
					<CardHeader class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<CardTitle class="text-xl">Click &amp; Visitor Performance</CardTitle>
							<p class="mt-1 text-xs text-muted-foreground">
								Daily click volume over the selected period
							</p>
						</div>
						<div class="flex flex-wrap gap-4 text-xs font-medium">
							<span class="flex items-center gap-2"
								><span class="size-2.5 rounded-sm bg-primary"></span>Total Clicks
								<strong class="font-mono">{totalClicks.toLocaleString()}</strong></span
							>
							<span class="flex items-center gap-2"
								><span class="size-2.5 rounded-sm bg-primary/55"></span>Unique Visitors
								<strong class="font-mono">{uniqueVisitors.toLocaleString()}</strong></span
							>
						</div>
					</CardHeader>
					<CardContent class="pt-2">
						{#if chartData.length}<div class="[--chart-color:#6658f5] [--chart-fill-opacity:0.22]">
								<AreaChart
									data={chartData}
									height={300}
									showPoints="sparse"
									showTooltip
									seriesLabel="clicks"
								/>
							</div>{:else}<p class="py-24 text-center text-sm text-muted-foreground">
								No clicks in this period.
							</p>{/if}
					</CardContent>
				</Card>
				<Card class="flex flex-col border-primary/10 bg-linear-to-br from-card to-primary/5">
					<CardHeader class="flex items-start justify-between">
						<div>
							<CardTitle class="text-xl">Referrer Channels</CardTitle>
							<p class="mt-1 text-xs text-muted-foreground">Traffic origin and share</p>
						</div>
						<Globe2 class="size-4 text-primary" />
					</CardHeader>
					<CardContent class="flex flex-1 flex-col"
						><ul class="space-y-4">
							{#each topReferrers as item (item.referrer)}
								<li>
									<div class="flex items-center justify-between gap-3 text-xs">
										<span class="flex min-w-0 items-center gap-2 font-medium">
											{#if item.referrer.trim()}<Globe2
													class="size-3.5 shrink-0 text-primary"
												/>{:else}<Mail class="size-3.5 shrink-0 text-primary" />{/if}
											<span class="truncate" title={item.referrer || 'Direct / Email'}
												>{channelName(item.referrer)}</span
											>
										</span>
										<span class="flex shrink-0 items-center gap-2 font-mono">
											{item.count.toLocaleString()}
											<span class="w-8 text-right text-muted-foreground"
												>{Math.round((item.count / Math.max(totalClicks, 1)) * 100)}%</span
											>
										</span>
									</div>
									<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10">
										<div
											class="h-full rounded-full bg-primary transition-[width] duration-500"
											style:width={`${Math.min(100, (item.count / Math.max(totalClicks, 1)) * 100)}%`}
										></div>
									</div>
								</li>
							{:else}<li class="py-8 text-center text-sm text-muted-foreground">
									No referrer data.
								</li>{/each}
						</ul>
						<div
							class="mt-auto flex items-center justify-between border-t border-border pt-5 text-xs"
						>
							<span class="text-muted-foreground">Top traffic source</span>
							<strong class="max-w-40 truncate text-primary">{topTrafficSource}</strong>
						</div></CardContent
					>
				</Card>
			</section>

			<section class="grid gap-6 lg:grid-cols-2">
				{#each [{ title: 'Top browsers', rows: topBrowsers }, { title: 'Devices', rows: topDevices }] as group (group.title)}
					<Card
						><CardHeader><CardTitle>{group.title}</CardTitle></CardHeader><CardContent>
							<ul class="divide-y divide-border">
								{#each group.rows as row (row[0])}<li class="flex justify-between py-3 text-sm">
										<span>{row[0]}</span><span class="font-mono">{row[1]}</span>
									</li>{:else}<li class="text-sm text-muted-foreground">
										No data available.
									</li>{/each}
							</ul>
						</CardContent></Card
					>
				{/each}
			</section>
		{/if}

		<Card>
			<CardHeader><CardTitle>Recent click activity</CardTitle></CardHeader>
			<CardContent>
				{#if data.clicksError}<p class="text-destructive" role="alert">{data.clicksError}</p>
				{:else if data.clicks}
					<div class="overflow-x-auto">
						<table class="w-full min-w-180 text-left text-sm">
							<thead
								class="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase"
								><tr
									>{#each ['Clicked at', 'IP address', 'Browser', 'Device', 'Referrer'] as heading (heading)}<th
											class="px-4 py-3 font-medium">{heading}</th
										>{/each}</tr
								></thead
							>
							<tbody class="divide-y divide-border"
								>{#each data.clicks.clicks as click (click.id)}<tr
										><td class="px-4 py-4 whitespace-nowrap">{timestamp(click.clickedAt)}</td><td
											class="px-4 py-4 font-mono text-xs">{click.ipAddress}</td
										><td class="px-4 py-4">{click.browser}</td><td class="px-4 py-4"
											>{click.deviceType}</td
										><td class="max-w-64 truncate px-4 py-4" title={click.referrer}
											>{click.referrer}</td
										></tr
									>{:else}<tr
										><td colspan="5" class="px-4 py-10 text-center text-muted-foreground"
											>No click activity in this period.</td
										></tr
									>{/each}</tbody
							>
						</table>
					</div>
					<div class="mt-4">
						<Pagination
							loading={changingPage}
							page={data.clicks.page}
							totalItems={data.clicks.total}
							itemsPerPage={data.clicks.perPage}
							onpagechange={changePage}
						/>
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
