<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { DateRangePicker } from '$lib/components/ui/date-range-picker';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
    import { Button } from '$lib/components/ui/button';

	let comparisonMode = $state(false);
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
		<CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="space-y-2">
				<Label>Primary Range</Label>
				<DateRangePicker />
			</div>
			{#if comparisonMode}
				<div class="space-y-2">
					<Label>Comparison Range</Label>
					<DateRangePicker />
				</div>
			{/if}
		</CardContent>
	</Card>

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
