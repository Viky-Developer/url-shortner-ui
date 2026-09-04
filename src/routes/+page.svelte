<script lang="ts">
	import { ArrowRight, CircleCheck, LinkIcon, LoaderCircle } from '$lib/components/ui/icons';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	let submitting = $state(false);
	const totalClicks = $derived(data.urls.reduce((total, url) => total + url.clicks, 0));
	const activeLinks = $derived(data.urls.filter((url) => url.status === 'active').length);
	const number = (value: number) =>
		new Intl.NumberFormat('en', {
			notation: value >= 10_000 ? 'compact' : 'standard',
			maximumFractionDigits: 1
		}).format(value);
	function date(value: string | undefined): string {
		if (!value) return '—';
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? '—'
			: new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(parsed);
	}
	function shortLabel(shortURL: string | undefined, code: string): string {
		if (!shortURL) return code;
		try {
			const url = new URL(shortURL);
			return `${url.host}${url.pathname}`;
		} catch {
			return shortURL;
		}
	}
</script>

<svelte:head
	><title>Dashboard | Linkflow</title><meta
		name="description"
		content="Create and manage your shortened URLs."
	/></svelte:head
>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
	<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="URL summary">
		<article class="shadow-micro rounded-xl border border-border bg-card p-5">
			<p class="text-label-caps font-semibold tracking-wider text-muted-foreground uppercase">
				Total URLs
			</p>
			<p class="mt-3 text-3xl font-semibold tracking-tight">{number(data.urls.length)}</p>
			<div class="mt-4 h-0.5 bg-muted"><div class="h-full w-2/3 bg-primary"></div></div>
		</article>
		<article class="shadow-micro rounded-xl border border-border bg-card p-5">
			<p class="text-label-caps font-semibold tracking-wider text-muted-foreground uppercase">
				Total Clicks
			</p>
			<p class="mt-3 text-3xl font-semibold tracking-tight">{number(totalClicks)}</p>
			<div class="mt-4 flex h-5 items-end gap-1" aria-hidden="true">
				{#each [35, 55, 42, 75, 58, 90, 48, 70] as height (height)}<span
						class="flex-1 rounded-t-sm bg-primary/60"
						style:height={`${height}%`}
					></span>{/each}
			</div>
		</article>
		<article
			class="shadow-micro rounded-xl border border-border bg-card p-5 sm:col-span-2 xl:col-span-1"
		>
			<p class="text-label-caps font-semibold tracking-wider text-muted-foreground uppercase">
				Active Links
			</p>
			<div class="mt-3 flex items-baseline gap-2">
				<p class="text-3xl font-semibold tracking-tight">{number(activeLinks)}</p>
				<p class="text-body-sm text-muted-foreground">/ {number(data.urls.length)}</p>
			</div>
			<div class="mt-4 flex gap-1" aria-hidden="true">
				{#each [0, 1, 2, 3, 4] as segment (segment)}<span
						class={[
							'h-2 flex-1 first:rounded-l-full last:rounded-r-full',
							segment < Math.ceil((activeLinks / Math.max(data.urls.length, 1)) * 5)
								? 'bg-success'
								: 'bg-muted'
						]}
					></span>{/each}
			</div>
		</article>
	</section>

	<section
		class="shadow-micro relative overflow-hidden rounded-xl border border-border bg-card p-6 sm:p-8"
	>
		<form
			method="POST"
			action="?/create"
			class="relative mx-auto flex max-w-3xl flex-col items-center gap-4"
			onsubmit={() => (submitting = true)}
		>
			<h1 class="text-2xl font-semibold tracking-tight">Quick Shorten</h1>
			<div
				class="shadow-micro flex w-full flex-col gap-2 rounded-lg bg-background p-1 focus-within:ring-2 focus-within:ring-ring sm:flex-row"
			>
				<label for="originalURL" class="sr-only">Long URL</label>
				<input
					id="originalURL"
					name="originalURL"
					type="url"
					required
					placeholder="Paste your long URL here..."
					value={form?.values?.originalURL ?? ''}
					class="min-h-11 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground/60"
				/>
				<button
					type="submit"
					disabled={submitting}
					class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
				>
					{#if submitting}<LoaderCircle class="size-4 animate-spin" />{:else}<LinkIcon
							class="size-4"
						/>{/if}{submitting ? 'Shortening…' : 'Shorten'}
				</button>
			</div>
			<details class="w-full rounded-lg border border-border bg-background/60 p-3 text-sm">
				<summary class="cursor-pointer font-medium text-muted-foreground"
					>Optional link details</summary
				>
				<div class="mt-4 grid gap-4 sm:grid-cols-2">
					<label class="grid gap-1.5"
						>Custom code<input
							name="customCode"
							value={form?.values?.customCode ?? ''}
							class="h-10 rounded-md border border-input bg-card px-3 font-mono outline-none focus:ring-2 focus:ring-ring"
							placeholder="campaign-2026"
						/></label
					>
					<label class="grid gap-1.5"
						>Title<input
							name="title"
							value={form?.values?.title ?? ''}
							class="h-10 rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring"
						/></label
					>
					<label class="grid gap-1.5 sm:col-span-2"
						>Description<textarea
							name="description"
							rows="2"
							class="rounded-md border border-input bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
							>{form?.values?.description ?? ''}</textarea
						></label
					>
					<label class="grid gap-1.5"
						>Expires at<input
							name="expiresAt"
							type="datetime-local"
							value={form?.values?.expiresAt ?? ''}
							class="h-10 rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring"
						/></label
					>
				</div>
			</details>
			{#if form?.message}<p
					role="status"
					class={[
						'w-full rounded-md px-3 py-2 text-sm',
						form.success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
					]}
				>
					{form.message}
				</p>{/if}
		</form>
	</section>

	<section class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-semibold tracking-tight">Recent URLs</h2>
			<span
				class="inline-flex items-center gap-1 text-label-caps font-semibold tracking-wide text-primary uppercase"
				>View all <ArrowRight class="size-4" /></span
			>
		</div>
		{#if data.loadError}
			<div
				class="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"
				role="alert"
			>
				{data.loadError}
			</div>
		{:else if data.urls.length === 0}
			<div class="rounded-xl border border-dashed border-border bg-card p-10 text-center">
				<LinkIcon class="mx-auto size-8 text-muted-foreground" />
				<h3 class="mt-3 font-semibold">No shortened URLs yet</h3>
				<p class="mt-1 text-sm text-muted-foreground">Paste your first URL above to get started.</p>
			</div>
		{:else}
			<div class="shadow-micro overflow-x-auto rounded-xl border border-border bg-card">
				<table class="w-full min-w-[820px] border-collapse text-left text-sm">
					<thead
						><tr
							class="border-b border-border bg-muted/30 text-label-caps tracking-wider text-muted-foreground uppercase"
							><th class="px-5 py-4 font-medium">Title / Original URL</th><th
								class="px-5 py-4 font-medium">Short Code</th
							><th class="px-5 py-4 text-right font-medium">Clicks</th><th
								class="px-5 py-4 font-medium">Status</th
							><th class="px-5 py-4 font-medium">Health</th><th
								class="px-5 py-4 text-right font-medium">Created</th
							></tr
						></thead
					>
					<tbody class="divide-y divide-border"
						>{#each data.urls.slice(0, 8) as url (url.id)}<tr
								class="transition-colors hover:bg-muted/35"
							>
								<td class="max-w-[330px] px-5 py-4"
									><p class="truncate font-medium">{url.title || 'Untitled link'}</p>
									<p class="mt-1 truncate text-xs text-muted-foreground">{url.originalURL}</p></td
								>
								<td class="px-5 py-4"
									><span class="rounded bg-primary/5 px-2 py-1 font-mono text-xs text-primary"
										>{shortLabel(url.shortURL, url.shortCode)}</span
									></td
								>
								<td class="px-5 py-4 text-right font-mono">{number(url.clicks)}</td>
								<td class="px-5 py-4"
									><span
										class={[
											'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize',
											url.status === 'active'
												? 'bg-success/10 text-success'
												: 'bg-muted text-muted-foreground'
										]}
										><span
											class={[
												'size-1.5 rounded-full',
												url.status === 'active' ? 'bg-success' : 'bg-muted-foreground'
											]}
										></span>{url.status}</span
									></td
								>
								<td class="px-5 py-4"
									><span
										class={[
											'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize',
											url.health === 'healthy'
												? 'bg-success/10 text-success'
												: 'bg-muted text-muted-foreground'
										]}><CircleCheck class="size-3.5" />{url.health}</span
									></td
								>
								<td class="px-5 py-4 text-right text-muted-foreground">{date(url.createdAt)}</td>
							</tr>{/each}</tbody
					>
				</table>
			</div>
		{/if}
	</section>
</div>
