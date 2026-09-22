<script lang="ts">
	import { CalendarDate } from '@internationalized/date';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { DatePicker } from '$lib/components/ui/datepicker';
	import { DateRangePicker } from '$lib/components/ui/date-range-picker';
	import { Dialog } from '$lib/components/ui/dialog';
	import { StatCard } from '$lib/components/ui/stat-card';
	import { AreaChart } from '$lib/components/ui/area-chart';
	import { ProgressBar } from '$lib/components/ui/progress-bar';
	import { Pagination } from '$lib/components/ui/pagination';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';

	let dateValue = $state(new CalendarDate(2025, 3, 15));
	let datePlaceholder = $state(new CalendarDate(2025, 3, 15));
	let rangeValue = $state({
		start: new CalendarDate(2025, 3, 1),
		end: new CalendarDate(2025, 3, 14)
	});
	let rangePlaceholder = $state(new CalendarDate(2025, 3, 14));

	let dialogOpen = $state(false);
	let name = $state('');
	let showComparison = $state(false);
	let tablePage = $state(1);

	const chartData = [
		{ label: 'Mon', value: 120 },
		{ label: 'Tue', value: 180 },
		{ label: 'Wed', value: 150 },
		{ label: 'Thu', value: 280 },
		{ label: 'Fri', value: 340 },
		{ label: 'Sat', value: 290 },
		{ label: 'Sun', value: 420 }
	];

	const comparisonChartData = [
		{ label: 'Mon', value: 90 },
		{ label: 'Tue', value: 140 },
		{ label: 'Wed', value: 130 },
		{ label: 'Thu', value: 220 },
		{ label: 'Fri', value: 280 },
		{ label: 'Sat', value: 250 },
		{ label: 'Sun', value: 360 }
	];

	const referrers = [
		{ label: 'Twitter', count: 4201, percentage: 45, color: '#1DA1F2' },
		{ label: 'LinkedIn', count: 2845, percentage: 30, color: '#0A66C2' },
		{ label: 'Direct', count: 1532, percentage: 15, color: '#918fa1' },
		{ label: 'Reddit', count: 804, percentage: 8, color: '#FF4500' }
	];
</script>

<div class="mx-auto max-w-5xl space-y-10 p-4">
	<header class="space-y-2">
		<h1 class="text-3xl font-bold tracking-tight">Component Showcase</h1>
		<p class="text-muted-foreground">
			Interactive demo of the reusable shadcn-svelte components used across the app.
		</p>
	</header>

	<!-- Stat Cards -->
	<section class="space-y-4">
		<h2 class="text-xl font-semibold">Stat Cards</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<StatCard
				label="Total Clicks"
				value="12,482"
				variant="primary"
				change={{ value: '14%', positive: true }}
			/>
			<StatCard
				label="Unique Visitors"
				value="8,901"
				variant="default"
				change={{ value: '8.2%', positive: true }}
			/>
			<StatCard
				label="Bounce Rate"
				value="32.1%"
				variant="default"
				change={{ value: '3.1%', positive: false }}
			/>
			<StatCard
				label="Avg. Session"
				value="4m 32s"
				variant="primary"
				change={{ value: '12%', positive: true }}
			/>
		</div>
	</section>

	<!-- Area Chart & Progress Bars -->
	<section class="space-y-4">
		<h2 class="text-xl font-semibold">Charts &amp; Progress Bars</h2>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<Card class="lg:col-span-2">
				<CardContent>
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-on-surface-variant text-label-caps uppercase">Traffic Overview</h3>
						<Button variant="outline" size="sm" onclick={() => (showComparison = !showComparison)}>
							{showComparison ? 'Hide' : 'Show'} Comparison
						</Button>
					</div>
					<AreaChart
						data={chartData}
						comparisonData={showComparison ? comparisonChartData : []}
						height={240}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<h3 class="text-on-surface-variant mb-6 text-label-caps uppercase">Top Referrers</h3>
					<div class="flex flex-col gap-5">
						{#each referrers as ref (ref.label)}
							<ProgressBar
								label={ref.label}
								count={ref.count.toLocaleString()}
								percentage={ref.percentage}
								color={ref.color}
							/>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>
	</section>

	<!-- Date Pickers -->
	<section class="space-y-4">
		<h2 class="text-xl font-semibold">Date Pickers</h2>
		<div class="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Single DatePicker</CardTitle>
					<CardDescription>Select a single date.</CardDescription>
				</CardHeader>
				<CardContent>
					<DatePicker bind:value={dateValue} bind:placeholder={datePlaceholder} />
					<p class="mt-3 text-sm text-muted-foreground">
						Selected: {dateValue?.toString() ?? 'none'}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Date Range Picker</CardTitle>
					<CardDescription>
						Presets + dual-range calendar + comparison toggle (matches Link Analytics design).
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DateRangePicker bind:value={rangeValue} bind:placeholder={rangePlaceholder} />
					<p class="mt-3 text-sm text-muted-foreground">
						Start: {rangeValue?.start?.toString() ?? 'none'} · End:
						{rangeValue?.end?.toString() ?? 'none'}
					</p>
				</CardContent>
			</Card>
		</div>
	</section>

	<!-- Buttons -->
	<section class="space-y-4">
		<h2 class="text-xl font-semibold">Buttons</h2>
		<Card>
			<CardContent class="flex flex-wrap items-center gap-3">
				<Button>Default</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="destructive">Destructive</Button>
				<Button variant="link">Link</Button>
				<Button size="sm">Small</Button>
				<Button size="lg">Large</Button>
				<Button disabled>Disabled</Button>
			</CardContent>
		</Card>
	</section>

	<!-- Badges -->
	<section class="space-y-4">
		<h2 class="text-xl font-semibold">Badges</h2>
		<Card>
			<CardContent class="flex flex-wrap items-center gap-3">
				<Badge>Default</Badge>
				<Badge variant="secondary">Secondary</Badge>
				<Badge variant="destructive">Destructive</Badge>
				<Badge variant="outline">Outline</Badge>
				<Badge variant="active">Active</Badge>
				<Badge variant="expired">Expired</Badge>
			</CardContent>
		</Card>
	</section>

	<!-- Form inputs -->
	<section class="space-y-4">
		<h2 class="text-xl font-semibold">Form Inputs</h2>
		<Card>
			<CardContent class="max-w-md space-y-4">
				<div class="space-y-1.5">
					<Label for="name">Name</Label>
					<Input id="name" type="text" bind:value={name} placeholder="Enter your name" />
				</div>
				<div class="space-y-1.5">
					<Label for="email">Email</Label>
					<Input id="email" type="email" placeholder="you@example.com" disabled />
				</div>
				<div class="space-y-1.5">
					<Label for="long">Long URL</Label>
					<Input
						id="long"
						type="text"
						defaultValue="https://example.com/very/long/path?utm_source=twitter"
					/>
				</div>
				<p class="text-sm text-muted-foreground">Name value: {name || '(empty)'}</p>
			</CardContent>
		</Card>
	</section>

	<!-- Table -->
	<section class="space-y-4">
		<h2 class="text-xl font-semibold">Table</h2>
		<Card>
			<CardContent class="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Short Link</TableHead>
							<TableHead>Destination</TableHead>
							<TableHead class="text-right">Clicks</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell class="font-medium">short.io/x7y9Z2</TableCell>
							<TableCell>example.com/very/long/destination</TableCell>
							<TableCell class="text-right">12,482</TableCell>
							<TableCell><Badge variant="active">Active</Badge></TableCell>
						</TableRow>
						<TableRow>
							<TableCell class="font-medium">short.io/aB12cD</TableCell>
							<TableCell>news.site.com/article/4721</TableCell>
							<TableCell class="text-right">8,901</TableCell>
							<TableCell><Badge variant="active">Active</Badge></TableCell>
						</TableRow>
						<TableRow>
							<TableCell class="font-medium">short.io/qR34eF</TableCell>
							<TableCell>shop.store.com/promo/sale</TableCell>
							<TableCell class="text-right">3,204</TableCell>
							<TableCell><Badge variant="expired">Expired</Badge></TableCell>
						</TableRow>
					</TableBody>
				</Table>
				<div class="border-t border-border px-4 py-3">
					<Pagination bind:page={tablePage} totalItems={47} itemsPerPage={10} />
				</div>
			</CardContent>
		</Card>
	</section>

	<!-- Skeleton -->
	<section class="space-y-4">
		<h2 class="text-xl font-semibold">Skeleton Loaders</h2>
		<Card>
			<CardContent class="space-y-3">
				<Skeleton class="h-5 w-2/3" />
				<Skeleton class="h-5 w-1/2" />
				<Skeleton class="h-28 w-full" />
				<div class="flex gap-3">
					<Skeleton class="h-10 w-10 rounded-full" />
					<Skeleton class="h-10 w-full" />
				</div>
			</CardContent>
		</Card>
	</section>

	<!-- Dialog -->
	<section class="space-y-4">
		<h2 class="text-xl font-semibold">Dialog</h2>
		<Card>
			<CardContent>
				<Button onclick={() => (dialogOpen = true)}>Open Dialog</Button>
			</CardContent>
		</Card>
	</section>
</div>

{#if dialogOpen}
	<Dialog>
		<h2 class="text-lg font-semibold">Delete link?</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			This will permanently remove <span class="font-medium">short.io/x7y9Z2</span> and all of its analytics.
			This action cannot be undone.
		</p>
		<div class="mt-6 flex justify-end gap-3">
			<Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
			<Button variant="destructive" onclick={() => (dialogOpen = false)}>Delete</Button>
		</div>
	</Dialog>
{/if}
