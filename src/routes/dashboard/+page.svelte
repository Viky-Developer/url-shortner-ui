<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { DatePicker } from '$lib/components/ui/datepicker';
	import { ArrowRight, CircleCheck, LinkIcon, LoaderCircle } from '$lib/components/ui/icons';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { untrack } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import type { PageProps, SubmitFunction } from './$types';
	let { data, form }: PageProps = $props();
	const initialForm = untrack(() => form);
	let submitting = $state(false);
	let quickURL = $state('');
	let quickPreview = $state('');
	let quickURLError = $state('');
	let originalURL = $state(initialForm?.values?.originalURL ?? '');
	let originalURLError = $state('');
	let expirationDate = $state<DateValue | undefined>(dateValue(initialForm?.values?.expiresAt));
	let expirationTime = $state(timeValue(initialForm?.values?.expiresAt));
	const minimumExpirationDate = today(getLocalTimeZone());
	const createOpen = $derived(page.url.hash === '#create-link');
	const originalURLValid = $derived(validURL(originalURL));
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
	function dateValue(value: string | undefined): DateValue | undefined {
		if (!value) return undefined;
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? undefined
			: new CalendarDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
	}
	function timeValue(value: string | undefined): string {
		if (!value) return '23:59';
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? '23:59'
			: `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
	}
	function validURL(value: string): boolean {
		try {
			return ['https:'].includes(new URL(value).protocol);
		} catch {
			return false;
		}
	}
	function previewShortURL(event: SubmitEvent): void {
		event.preventDefault();
		if (!validURL(quickURL)) {
			quickPreview = '';
			quickURLError = 'Enter a valid URL beginning with https://';
			toast.error(quickURLError);
			return;
		}
		quickURLError = '';
		quickPreview = `short.io/${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;
	}
	function closeCreate(): void {
		void goto(resolve('/dashboard'), { replaceState: true, noScroll: true, keepFocus: true });
	}
	const enhanceCreate: SubmitFunction = ({ formData, cancel }) => {
		if (submitting) {
			cancel();
			return;
		}
		if (!originalURLValid) {
			cancel();
			originalURLError = 'Enter a valid URL beginning with https://';
			toast.error(originalURLError);
			return;
		}
		originalURLError = '';
		if (expirationDate) {
			const [hour, minute] = expirationTime.split(':').map(Number);
			const localExpiration = new Date(
				expirationDate.year,
				expirationDate.month - 1,
				expirationDate.day,
				hour || 0,
				minute || 0
			);
			formData.set('expiresAt', localExpiration.toISOString());
		} else formData.delete('expiresAt');
		submitting = true;
		const toastId = toast.loading('Creating your link…');
		return async ({ result, update }) => {
			const message =
				result.type === 'success'
					? 'Link created successfully.'
					: result.type === 'failure' && typeof result.data?.message === 'string'
						? result.data.message
						: 'Unable to create this link.';
			if (result.type === 'success') toast.success(message, { id: toastId });
			else toast.error(message, { id: toastId });
			await update({ reset: result.type === 'success', invalidateAll: result.type === 'success' });
			submitting = false;
			if (result.type === 'success') closeCreate();
		};
	};
</script>

<svelte:head
	><title>Dashboard | Linkflow</title><meta
		name="description"
		content="Create and manage your shortened URLs."
	/></svelte:head
>

<svelte:window onkeydown={(event) => createOpen && event.key === 'Escape' && closeCreate()} />

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
			class="relative mx-auto flex max-w-3xl flex-col items-center gap-4"
			onsubmit={previewShortURL}
			novalidate
		>
			<h1 class="text-2xl font-semibold tracking-tight">Quick Shorten</h1>
			<div
				class="shadow-micro flex w-full flex-col gap-2 rounded-lg border border-input bg-background p-1 transition-shadow has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring/40 sm:flex-row"
			>
				<label for="quickURL" class="sr-only">Long URL to preview</label>
				<input
					id="quickURL"
					type="url"
					required
					placeholder="Paste your long URL here..."
					bind:value={quickURL}
					oninput={() => (quickURLError = '')}
					aria-invalid={quickURLError ? 'true' : undefined}
					class="min-h-11 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground/60"
				/>
				<button
					type="submit"
					class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
				>
					<LinkIcon class="size-4" /> Shorten
				</button>
			</div>
			<p class="text-xs text-muted-foreground">
				Preview only — this does not create or save a link.
			</p>
			{#if quickPreview}<p
					role="status"
					class="rounded-md bg-primary/5 px-4 py-2 font-mono text-sm text-primary"
				>
					Example: {quickPreview}
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
				<table class="w-full min-w-[820px] border-collapse text-center text-sm">
					<thead
						><tr
							class="border-b border-border bg-muted/30 text-label-caps tracking-wider text-muted-foreground uppercase"
							><th class="px-5 py-4 text-left font-medium">Title / Original URL</th><th
								class="px-5 py-4 text-center font-medium">Short Code</th
							><th class="px-5 py-4 text-center font-medium">Clicks</th><th
								class="px-5 py-4 text-center font-medium">Status</th
							><th class="px-5 py-4 text-center font-medium">Health</th><th
								class="px-5 py-4 text-center font-medium">Created At</th
							></tr
						></thead
					>
					<tbody class="divide-y divide-border"
						>{#each data.urls.slice(0, 5) as url (url.id)}<tr
								class="transition-colors hover:bg-muted/35"
							>
								<td class="max-w-82.5 px-5 py-4 text-left"
									><p class="truncate font-medium">{url.title || 'Untitled link'}</p>
									<p class="mt-1 truncate text-xs text-muted-foreground">{url.originalURL}</p></td
								>
								<td class="px-5 py-4 text-center"
									><span class="rounded bg-primary/5 px-2 py-1 font-mono text-xs text-primary"
										>{shortLabel(url.shortURL, url.shortCode)}</span
									></td
								>
								<td class="px-5 py-4 text-center font-mono">{number(url.clicks)}</td>
								<td class="px-5 py-4 text-center"
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
								<td class="px-5 py-4 text-center"
									><span
										class={[
											'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize',
											url.health === 'healthy'
												? 'bg-success/10 text-success'
												: 'bg-muted text-muted-foreground'
										]}><CircleCheck class="size-3.5" />{url.health}</span
									></td
								>
								<td class="px-5 py-4 text-center text-muted-foreground">{date(url.createdAt)}</td>
							</tr>{/each}</tbody
					>
				</table>
			</div>
		{/if}
	</section>
</div>

{#if createOpen}
	<div
		transition:fade={{ duration: 180 }}
		class="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && closeCreate()}
	>
		<div
			transition:scale={{ duration: 220, start: 0.96 }}
			id="create-link"
			role="dialog"
			aria-modal="true"
			aria-labelledby="create-link-title"
			class="shadow-overlay max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 sm:p-8"
		>
			<div class="mb-6">
				<h2 id="create-link-title" class="text-2xl font-semibold tracking-tight">Create link</h2>
				<p class="mt-1 text-sm text-muted-foreground">Add a shortened URL to your workspace.</p>
			</div>

			<form
				method="POST"
				action="?/create#create-link"
				class="grid gap-5"
				use:enhance={enhanceCreate}
				novalidate
			>
				<div class="relative">
					<input
						id="originalURL"
						name="originalURL"
						type="url"
						required
						placeholder=" "
						bind:value={originalURL}
						oninput={() => (originalURLError = '')}
						aria-invalid={originalURLError ? 'true' : undefined}
						class="peer h-12 w-full rounded-md border border-input bg-background px-3 pt-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
					/>
					<label
						for="originalURL"
						class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 bg-background px-1 text-sm text-muted-foreground transition-all peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-foreground peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary"
						>Original URL <span class="text-destructive">*</span></label
					>
				</div>
				<div class="grid gap-5 sm:grid-cols-2">
					<div class="relative">
						<input
							id="customCode"
							name="customCode"
							value={form?.values?.customCode ?? ''}
							placeholder=" "
							class="peer h-12 w-full rounded-md border border-input bg-background px-3 pt-4 font-mono text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
						/>
						<label
							for="customCode"
							class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 bg-background px-1 text-sm text-muted-foreground transition-all peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-xs peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary"
							>Custom code (optional)</label
						>
					</div>
				</div>
				<div class="grid items-center gap-3 sm:grid-cols-[minmax(7rem,0.65fr)_minmax(0,1fr)_8rem]">
					<p class="text-sm font-medium text-foreground">
						Expire on <span class="text-muted-foreground">(optional)</span>
					</p>
					<DatePicker
						bind:value={expirationDate}
						minValue={minimumExpirationDate}
						class="h-12 w-full border-input bg-background px-4 text-foreground dark:border-border dark:bg-card"
					/>
					<div class="relative">
						<input
							id="expirationTime"
							name="expirationTime"
							type="time"
							bind:value={expirationTime}
							aria-label="Expiration time"
							onclick={(event) => event.currentTarget.showPicker?.()}
							class="h-12 w-full rounded-md border border-input bg-background px-4 text-sm text-foreground scheme-light transition-all outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 dark:border-border dark:bg-card dark:scheme-dark"
						/>
					</div>
				</div>
				<div class="relative">
					<input
						id="title"
						name="title"
						value={form?.values?.title ?? ''}
						placeholder=" "
						class="peer h-12 w-full rounded-md border border-input bg-background px-3 pt-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
					/>
					<label
						for="title"
						class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 bg-background px-1 text-sm text-muted-foreground transition-all peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-xs peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary"
						>Title (optional)</label
					>
				</div>
				<div class="relative">
					<textarea
						id="description"
						name="description"
						rows="3"
						placeholder=" "
						class="peer w-full rounded-md border border-input bg-background px-3 pt-5 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
						>{form?.values?.description ?? ''}</textarea
					>
					<label
						for="description"
						class="pointer-events-none absolute top-3 left-3 bg-background px-1 text-sm text-muted-foreground transition-all peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:text-xs peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary"
						>Description (optional)</label
					>
				</div>
				<div class="flex justify-end gap-3 border-t border-border pt-5">
					<button
						type="button"
						onclick={closeCreate}
						class="h-10 rounded-md border border-border px-4 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted active:translate-y-0 active:scale-95"
						>Cancel</button
					>
					<button
						type="submit"
						disabled={!originalURL.trim() || submitting}
						class="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md active:translate-y-0 active:scale-95 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
						>{#if submitting}<LoaderCircle class="size-4 animate-spin" />{/if}{submitting
							? 'Creating…'
							: 'Create link'}</button
					>
				</div>
			</form>
		</div>
	</div>
{/if}
