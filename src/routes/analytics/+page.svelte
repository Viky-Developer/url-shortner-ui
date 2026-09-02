<script lang="ts">
	import { CalendarDate } from '@internationalized/date';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { DateRangePicker } from '$lib/components/ui/date-range-picker';
	import { StatCard } from '$lib/components/ui/stat-card';
	import { AreaChart } from '$lib/components/ui/area-chart';
	import { ProgressBar } from '$lib/components/ui/progress-bar';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	let comparisonMode = $state(false);

	let primaryRange = $state({
		start: new CalendarDate(2023, 10, 1),
		end: new CalendarDate(2023, 10, 30)
	});
	let primaryPlaceholder = $state(new CalendarDate(2023, 10, 30));
	let comparisonPlaceholder = $state(new CalendarDate(2023, 9, 30));

	const chartData = [
		{ label: 'Oct 1', value: 200 },
		{ label: 'Oct 2', value: 320 },
		{ label: 'Oct 3', value: 280 },
		{ label: 'Oct 4', value: 450 },
		{ label: 'Oct 5', value: 380 },
		{ label: 'Oct 6', value: 520 },
		{ label: 'Oct 7', value: 490 },
		{ label: 'Oct 8', value: 600 },
		{ label: 'Oct 9', value: 550 },
		{ label: 'Oct 10', value: 480 },
		{ label: 'Oct 11', value: 620 },
		{ label: 'Oct 12', value: 700 },
		{ label: 'Oct 13', value: 680 },
		{ label: 'Oct 14', value: 750 },
		{ label: 'Oct 15', value: 800 }
	];

	const comparisonChartData = [
		{ label: 'Oct 1', value: 180 },
		{ label: 'Oct 2', value: 260 },
		{ label: 'Oct 3', value: 240 },
		{ label: 'Oct 4', value: 380 },
		{ label: 'Oct 5', value: 340 },
		{ label: 'Oct 6', value: 420 },
		{ label: 'Oct 7', value: 400 },
		{ label: 'Oct 8', value: 500 },
		{ label: 'Oct 9', value: 460 },
		{ label: 'Oct 10', value: 410 },
		{ label: 'Oct 11', value: 520 },
		{ label: 'Oct 12', value: 600 },
		{ label: 'Oct 13', value: 560 },
		{ label: 'Oct 14', value: 640 },
		{ label: 'Oct 15', value: 700 }
	];

	const referrers = [
		{ label: 'Twitter', count: 4201, percentage: 45, color: '#1DA1F2' },
		{ label: 'LinkedIn', count: 2845, percentage: 30, color: '#0A66C2' },
		{ label: 'Direct', count: 1532, percentage: 15, color: '#918fa1' },
		{ label: 'Reddit', count: 804, percentage: 8, color: '#FF4500' }
	];
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Link Analytics</h1>
		<Button variant="outline" onclick={() => (comparisonMode = !comparisonMode)}>
			{comparisonMode ? 'Disable Comparison' : 'Enable Comparison'}
		</Button>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Date Range Settings</CardTitle>
		</CardHeader>
		<CardContent class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="space-y-2">
				<Label>Primary Range</Label>
				<DateRangePicker bind:value={primaryRange} bind:placeholder={primaryPlaceholder} />
			</div>
			{#if comparisonMode}
				<div class="space-y-2">
					<Label>Comparison Range</Label>
					<DateRangePicker bind:placeholder={comparisonPlaceholder} />
				</div>
			{/if}
		</CardContent>
	</Card>

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
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<Card class="lg:col-span-2">
			<CardContent>
				<h3 class="text-on-surface-variant mb-6 text-label-caps uppercase">Daily Clicks</h3>
				<AreaChart
					data={chartData}
					comparisonData={comparisonMode ? comparisonChartData : []}
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

	<Card>
		<CardHeader>
			<CardTitle>Performance Breakdown</CardTitle>
		</CardHeader>
		<CardContent>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Metric</TableHead>
						<TableHead>Primary Range</TableHead>
						{#if comparisonMode}
							<TableHead>Comparison Range</TableHead>
							<TableHead>Change</TableHead>
						{/if}
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell>Total Clicks</TableCell>
						<TableCell>1,234</TableCell>
						{#if comparisonMode}
							<TableCell>987</TableCell>
							<TableCell><Badge variant="active">+25%</Badge></TableCell>
						{/if}
					</TableRow>
					<TableRow>
						<TableCell>Unique Visitors</TableCell>
						<TableCell>850</TableCell>
						{#if comparisonMode}
							<TableCell>900</TableCell>
							<TableCell><Badge variant="destructive">-5.5%</Badge></TableCell>
						{/if}
					</TableRow>
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
