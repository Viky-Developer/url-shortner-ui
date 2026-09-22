<script lang="ts">
	let { class: className, ...rest } = $props();
	const gradientId = $props.id();
	const pulseGradientId = `${gradientId}-pulse`;
	const glowId = `${gradientId}-glow`;
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 512 512"
	class={className}
	aria-hidden="true"
	{...rest}
>
	<defs>
		<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" stop-color="#4f46e5" />
			<stop offset="60%" stop-color="#4338ca" />
			<stop offset="100%" stop-color="#312e81" />
		</linearGradient>
		<linearGradient id={pulseGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
			<stop offset="0%" stop-color="#a5b4fc" />
			<stop offset="45%" stop-color="#38bdf8" />
			<stop offset="55%" stop-color="#ffffff" />
			<stop offset="100%" stop-color="#818cf8" />
		</linearGradient>
		<filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
			<feGaussianBlur stdDeviation="12" result="blur" />
			<feComposite in="SourceGraphic" in2="blur" operator="over" />
		</filter>
	</defs>
	<rect width="512" height="512" rx="128" fill={`url(#${gradientId})`} />
	<circle
		cx="256"
		cy="256"
		r="192"
		stroke="#818cf8"
		stroke-width="1.5"
		stroke-opacity="0.2"
		stroke-dasharray="6 8"
		fill="none"
	/>
	<circle
		cx="256"
		cy="256"
		r="144"
		stroke="#818cf8"
		stroke-width="1"
		stroke-opacity="0.15"
		fill="none"
	/>
	<path
		d="M 224 196 H 180 C 146.863 196 120 222.863 120 256 C 120 289.137 146.863 316 180 316 H 224"
		fill="none"
		stroke="#ffffff"
		stroke-width="32"
		stroke-linecap="round"
	/>
	<path
		d="M 288 196 H 332 C 365.137 196 392 222.863 392 256 C 392 289.137 365.137 316 332 316 H 288"
		fill="none"
		stroke="#ffffff"
		stroke-width="32"
		stroke-linecap="round"
	/>
	<path
		d="M 166 256 H 214 L 238 180 L 274 332 L 298 256 H 346"
		fill="none"
		stroke="#38bdf8"
		stroke-width="36"
		stroke-linecap="round"
		stroke-linejoin="round"
		opacity="0.35"
		filter={`url(#${glowId})`}
	/>
	<path
		d="M 166 256 H 214 L 238 180 L 274 332 L 298 256 H 346"
		fill="none"
		stroke={`url(#${pulseGradientId})`}
		stroke-width="24"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<circle cx="238" cy="180" r="9" fill="#ffffff" />
	<circle cx="238" cy="180" r="4" fill="#38bdf8" />
	<circle cx="274" cy="332" r="9" fill="#ffffff" />
	<circle cx="274" cy="332" r="4" fill="#38bdf8" />
	<circle cx="166" cy="256" r="7" fill="#c7d2fe" />
	<circle cx="346" cy="256" r="7" fill="#c7d2fe" />
</svg>
