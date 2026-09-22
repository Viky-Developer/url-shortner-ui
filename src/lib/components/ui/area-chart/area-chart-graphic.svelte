<script lang="ts">
	const gradientId = $props.id();
	type Point = { x: number; y: number };

	let {
		width,
		height,
		paddingBottom,
		gridLines,
		comparisonLine,
		mainLine,
		areaPath,
		mainPoints
	}: {
		width: number;
		height: number;
		paddingBottom: number;
		gridLines: number[];
		comparisonLine: string;
		mainLine: string;
		areaPath: string;
		mainPoints: Point[];
	} = $props();
</script>

<svg
	class="h-full w-full overflow-visible"
	preserveAspectRatio="none"
	viewBox="0 0 {width} {height}"
>
	<defs>
		<linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
			<stop
				offset="0%"
				stop-color="var(--chart-color, var(--primary))"
				stop-opacity="var(--chart-fill-opacity, 0.2)"
			></stop>
			<stop offset="100%" stop-color="var(--chart-color, var(--primary))" stop-opacity="0"></stop>
		</linearGradient>
	</defs>

	{#each gridLines as y, i (i)}
		<line
			class="text-outline-variant/30"
			stroke="currentColor"
			stroke-dasharray="4 4"
			x1="0"
			x2={width}
			y1={y}
			y2={y}
		></line>
	{/each}
	<line
		class="text-outline-variant/50"
		stroke="currentColor"
		x1="0"
		x2={width}
		y1={height - paddingBottom}
		y2={height - paddingBottom}
	></line>

	{#if comparisonLine}
		<path
			class="text-primary/30"
			d={comparisonLine}
			fill="none"
			stroke="currentColor"
			stroke-dasharray="4 4"
			stroke-width="2"
		></path>
	{/if}

	{#if mainLine}
		<path
			style:color="var(--chart-color, var(--primary))"
			d={mainLine}
			fill="none"
			stroke="currentColor"
			stroke-width="3"
		></path>
		<path d={areaPath} fill={`url(#${gradientId})`}></path>
	{/if}

	{#each mainPoints as point (point.x)}
		<circle
			style:color="var(--chart-color, var(--primary))"
			cx={point.x}
			cy={point.y}
			fill="currentColor"
			r="4"
		></circle>
	{/each}
</svg>
