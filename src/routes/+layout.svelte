<script lang="ts">
	import './layout.css';
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Label } from '$lib/components/ui/label';
	import {
		Table,
		TableHeader,
		TableRow,
		TableHead,
		TableBody,
		TableCell
	} from '$lib/components/ui/table';
	import { DatePicker } from '$lib/components/ui/datepicker';
	import { DateRangePicker } from '$lib/components/ui/date-range-picker';

	let { children } = $props();
</script>

<main class="space-y-8 p-4">
	<!-- Card & Input & Label Example -->
	<div class="mx-auto max-w-md">
		<Card>
			<CardHeader>
				<CardTitle>Shorten a Link</CardTitle>
				<CardDescription>Enter your long URL to get a short link.</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<div class="space-y-2">
					<Label for="url-input">Destination URL</Label>
					<Input id="url-input" placeholder="https://example.com/very-long-url" />
				</div>
				<div class="space-y-2">
					<Label for="expiry-date">Expiry Date</Label>
					<DatePicker id="expiry-date" />
				</div>
				<div class="space-y-2">
					<Label for="expiry-range">Active Range</Label>
					<DateRangePicker id="expiry-range" />
				</div>
				<Button>Shorten</Button>
			</CardContent>
		</Card>
	</div>

	<!-- Badges & Skeletons Example -->
	<div class="mx-auto max-w-md space-y-4 rounded-xl border p-4">
		<h2 class="text-lg font-bold">Status & Skeleton Demos</h2>
		<div class="flex gap-2">
			<Badge variant="active">Active</Badge>
			<Badge variant="expired">Expired</Badge>
			<Badge variant="secondary">Draft</Badge>
			<Badge variant="destructive">Destructive</Badge>
		</div>
		<div class="space-y-2">
			<Skeleton class="h-4 w-[250px]" />
			<Skeleton class="h-4 w-[200px]" />
		</div>
	</div>

	<!-- Table Example -->
	<div class="mx-auto max-w-xl rounded-xl border p-4">
		<h2 class="mb-4 text-lg font-bold">Table Demo</h2>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Short Link</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Clicks</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell class="font-mono">short.io/xyz</TableCell>
					<TableCell><Badge variant="active">Active</Badge></TableCell>
					<TableCell>142</TableCell>
				</TableRow>
				<TableRow>
					<TableCell class="font-mono">short.io/abc</TableCell>
					<TableCell><Badge variant="expired">Expired</Badge></TableCell>
					<TableCell>89</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	</div>

	{@render children()}
</main>
