<script lang="ts">
	import AreaChartGraphic from './area-chart-graphic.svelte';
	import { cn } from '$lib/utils.js';

	type DataPoint = {
		label: string;
		value: number;
	};

	let {
		data = [],
		comparisonData = [],
		height = 240,
		showPoints = true,
		showTooltip = false,
		seriesLabel = 'Value',
		class: className
	}: {
		data: DataPoint[];
		comparisonData?: DataPoint[];
		height?: number;
		showPoints?: boolean | 'sparse';
		showTooltip?: boolean;
		seriesLabel?: string;
		class?: string;
	} = $props();

	const padding = { top: 10, bottom: 30, left: 0, right: 0 };
	const svgWidth = 800;
	const svgHeight = $derived(height);

	const allValues = $derived([...data.map((d) => d.value), ...comparisonData.map((d) => d.value)]);
	const maxVal = $derived(Math.max(...allValues, 1) * 1.2);
	const chartHeight = $derived(svgHeight - padding.top - padding.bottom);

	function yScale(val: number): number {
		return padding.top + chartHeight - (val / maxVal) * chartHeight;
	}

	function xScale(index: number, total: number): number {
		if (total <= 1) return svgWidth / 2;
		return (index / (total - 1)) * svgWidth;
	}

	function buildLinePath(points: { x: number; y: number }[]): string {
		if (points.length === 0) return '';
		if (points.length === 1) return `M${points[0].x},${points[0].y}`;

		let d = `M${points[0].x},${points[0].y}`;
		for (let i = 1; i < points.length; i++) {
			const prev = points[i - 1];
			const curr = points[i];
			const cpx1 = prev.x + (curr.x - prev.x) / 3;
			const cpy1 = prev.y;
			const cpx2 = prev.x + (2 * (curr.x - prev.x)) / 3;
			const cpy2 = curr.y;
			d += ` C${cpx1},${cpy1} ${cpx2},${cpy2} ${curr.x},${curr.y}`;
		}
		return d;
	}

	const mainPoints = $derived(
		data.map((d, i) => ({ x: xScale(i, data.length), y: yScale(d.value) }))
	);

	const comparisonPoints = $derived(
		comparisonData.map((d, i) => ({
			x: xScale(i, comparisonData.length),
			y: yScale(d.value)
		}))
	);

	const mainLine = $derived(buildLinePath(mainPoints));
	const comparisonLine = $derived(buildLinePath(comparisonPoints));
	const areaPath = $derived(
		mainLine
			? `${mainLine} L${mainPoints[mainPoints.length - 1].x},${svgHeight - padding.bottom} L${mainPoints[0].x},${svgHeight - padding.bottom} Z`
			: ''
	);

	const gridLines = $derived([0, 0.25, 0.5, 0.75, 1].map((frac) => yScale(frac * maxVal)));

	const xLabelPositions = $derived(
		Array.from({ length: Math.min(data.length, 5) }, (_, i) => {
			const index = Math.round((i * (data.length - 1)) / Math.max(Math.min(data.length, 5) - 1, 1));
			return { label: data[index].label, x: xScale(index, data.length) };
		})
	);
	const visiblePoints = $derived(
		showPoints === 'sparse'
			? mainPoints.filter(
					(_, i) =>
						i === mainPoints.length - 1 ||
						(i > 0 && i % Math.max(1, Math.round(mainPoints.length / 3)) === 0)
				)
			: showPoints || mainPoints.length === 1
				? mainPoints
				: []
	);
</script>

<div class={cn('w-full', className)}>
	<div class="relative" style="height: {height + 30}px">
		<AreaChartGraphic
			width={svgWidth}
			height={svgHeight}
			paddingBottom={padding.bottom}
			{gridLines}
			{comparisonLine}
			{mainLine}
			{areaPath}
			mainPoints={visiblePoints}
		/>

		{#if showTooltip}
			{#each mainPoints as point, i (`${data[i].label}-${i}`)}
				<button
					type="button"
					class="group absolute top-0 z-10 cursor-crosshair focus-visible:bg-primary/5 focus-visible:outline-none"
					style:left={`${(i / Math.max(data.length, 1)) * 100}%`}
					style:width={`${100 / Math.max(data.length, 1)}%`}
					style:height={`${height}px`}
					aria-label={`${data[i].label}: ${data[i].value.toLocaleString()} ${seriesLabel}`}
				>
					<span
						class="absolute top-0 bottom-7 left-1/2 border-l border-dashed border-primary/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
					></span>
					<span
						class="absolute left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-0 ring-4 ring-primary/15 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
						style:top={`${point.y}px`}
					></span>
					<span
						class={[
							'pointer-events-none absolute z-20 hidden min-w-36 -translate-y-[calc(100%+0.5rem)] rounded-lg border border-border bg-popover p-3 text-left text-popover-foreground shadow-lg group-hover:block group-focus-visible:block',
							i === 0 ? 'left-0' : i === data.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'
						]}
						style:top={`${point.y}px`}
					>
						<span class="block text-xs font-semibold">{data[i].label}</span>
						<span class="mt-2 flex items-center justify-between gap-4 text-xs">
							<span class="flex items-center gap-1.5 text-muted-foreground"
								><span class="size-2 rounded-full bg-primary"></span>{seriesLabel}</span
							>
							<span class="font-mono font-semibold">{data[i].value.toLocaleString()}</span>
						</span>
					</span>
				</button>
			{/each}
		{/if}

		<div
			class="text-on-surface-variant absolute right-0 bottom-0 left-0 flex justify-between font-mono text-[10px]"
		>
			{#each xLabelPositions as xl, i (i)}
				<span
					class="absolute"
					style:left={`${(xl.x / svgWidth) * 100}%`}
					style:transform={`translateX(${i === 0 ? 0 : i === xLabelPositions.length - 1 ? -100 : -50}%)`}
					>{xl.label}</span
				>
			{/each}
		</div>
	</div>
</div>
