<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		label,
		value,
		change,
		variant = 'default',
		class: className
	}: {
		label: string;
		value: string | number;
		change?: { value: string; positive: boolean };
		variant?: 'default' | 'primary';
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		'flex flex-col justify-between rounded-xl p-6',
		variant === 'primary'
			? 'bg-primary-container text-on-primary-container relative overflow-hidden shadow-md'
			: 'text-on-surface border border-border bg-surface-container-highest shadow-sm',
		className
	)}
>
	{#if variant === 'primary'}
		<div class="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
	{/if}

	<span
		class={cn(
			'uppercase',
			variant === 'primary'
				? 'text-on-primary-container/80 text-label-caps'
				: 'text-on-surface-variant text-label-caps'
		)}
	>
		{label}
	</span>

	<div class="mt-4 flex items-baseline gap-2">
		<span
			class={cn(
				'leading-none tracking-tight',
				variant === 'primary' ? 'text-[48px] text-white' : 'text-[48px]'
			)}
		>
			{value}
		</span>

		{#if change}
			{@const isPositive = change.positive}
			<span
				class={cn(
					'flex items-center gap-0.5 rounded px-1.5 py-0.5 text-label-caps',
					variant === 'primary'
						? isPositive
							? 'text-tertiary-fixed bg-white/10'
							: 'text-error-container bg-white/10'
						: isPositive
							? 'bg-success/10 text-success'
							: 'bg-destructive/10 text-destructive'
				)}
			>
				{isPositive ? '↑' : '↓'}
				{change.value}
			</span>
			<span
				class={cn(
					'text-[10px]',
					variant === 'primary' ? 'text-white/60' : 'text-on-surface-variant/60'
				)}
			>
				vs. prev. period
			</span>
		{/if}
	</div>
</div>
