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
		class: className
	}: {
		data: DataPoint[];
		comparisonData?: DataPoint[];
		height?: number;
		class?: string;
	} = $props();

	const padding = { top: 10, bottom: 30, left: 0, right: 0 };
	const svgWidth = 800;
	const svgHeight = $derived(height);

	const allValues = $derived([...data.map((d) => d.value), ...comparisonData.map((d) => d.value)]);
	const maxVal = $derived(Math.max(...allValues, 1));
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

	const xLabels = $derived(
		data.filter((_, i) => {
			if (data.length <= 5) return true;
			const step = Math.ceil(data.length / 5);
			return i % step === 0 || i === data.length - 1;
		})
	);

	const xLabelPositions = $derived(
		xLabels.map((d) => {
			const origIdx = data.indexOf(d);
			return { label: d.label, x: xScale(origIdx, data.length) };
		})
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
			{mainPoints}
		/>

		<div
			class="text-on-surface-variant/60 absolute right-0 bottom-0 left-0 flex justify-between font-mono text-[10px]"
		>
			{#each xLabelPositions as xl (xl.label)}
				<span>{xl.label}</span>
			{/each}
		</div>
	</div>
</div>
