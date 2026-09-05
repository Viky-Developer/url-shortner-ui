<script lang="ts">
	import { base, resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';
	import { enhance } from '$app/forms';
	import { DatePicker } from '$lib/components/ui/datepicker';
	import { Pagination } from '$lib/components/ui/pagination';
	import {
		CircleCheck,
		Copy,
		LinkIcon,
		LoaderCircle,
		Pencil,
		Trash2,
		X
	} from '$lib/components/ui/icons';
	import type { ShortURL, URLStatusCode } from '$lib/types/short-url';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { fade, scale } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type ModalStep = 'edit' | 'preview';
	type LinkFilter = 'all' | ShortURL['status'];
	type DeleteMode = 'soft' | 'hard';
	interface EditValues {
		originalURL: string;
		title: string;
		description: string;
		status: URLStatusCode;
	}

	let selected = $state<ShortURL | undefined>();
	let values = $state<EditValues>(emptyValues());
	let initialValues = $state<EditValues>(emptyValues());
	let initialExpiration = $state('');
	let modalStep = $state<ModalStep>('edit');
	let loadingURL = $state(false);
	let saving = $state(false);
	let deleting = $state(false);
	let modalError = $state('');
	let deleteError = $state('');
	let deleteTarget = $state<ShortURL | undefined>();
	let deleteMode = $state<DeleteMode>('soft');
	const filter = $derived(data.filter as LinkFilter);
	let expirationDate = $state<DateValue | undefined>();
	let expirationTime = $state('23:59');
	let statusOverrides = $state<Record<string, URLStatusCode>>({});
	let copiedField = $state('');
	const minimumExpirationDate = today(getLocalTimeZone());
	const filters: { value: LinkFilter; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Disabled' },
		{ value: 'expired', label: 'Expired' },
		{ value: 'deleted', label: 'Deleted' }
	];
	const filteredURLs = $derived(
		filter === 'all' ? data.urls : data.urls.filter((url) => statusFor(url) === filter)
	);
	const hasChanges = $derived(
		JSON.stringify(values) !== JSON.stringify(initialValues) ||
			(expirationISOString() ?? '') !== initialExpiration
	);
	const futureManualExpiration = $derived.by(() => {
		const expiration = expirationISOString();
		return values.status === 2 && expiration && Date.parse(expiration) > Date.now()
			? expiration
			: undefined;
	});

	function statusFor(url: ShortURL): ShortURL['status'] {
		const statusCode = statusOverrides[url.id] ?? url.statusCode;
		return statusCode === 1
			? 'active'
			: statusCode === 2
				? 'expired'
				: statusCode === 3
					? 'deleted'
					: 'inactive';
	}

	function emptyValues(): EditValues {
		return { originalURL: '', title: '', description: '', status: 1 };
	}

	function expirationDateValue(value: string | undefined): DateValue | undefined {
		if (!value) return undefined;
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? undefined
			: new CalendarDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
	}

	function expirationTimeValue(value: string | undefined): string {
		if (!value) return '23:59';
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? '23:59'
			: `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
	}

	function expirationISOString(): string | undefined {
		if (!expirationDate) return undefined;
		const [hour, minute] = expirationTime.split(':').map(Number);
		return new Date(
			expirationDate.year,
			expirationDate.month - 1,
			expirationDate.day,
			hour || 0,
			minute || 0
		).toISOString();
	}

	function date(value: string | undefined): string {
		if (!value) return 'Never';
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? 'Never'
			: new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
	}

	function shortLabel(url: ShortURL): string {
		if (!url.shortURL) return url.shortCode;
		try {
			const parsed = new URL(url.shortURL);
			return `${parsed.host}${parsed.pathname}`;
		} catch {
			return url.shortURL;
		}
	}

	async function copyURL(value: string, field: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(value);
			copiedField = field;
			toast.success('URL copied to clipboard.');
			setTimeout(() => {
				if (copiedField === field) copiedField = '';
			}, 1800);
		} catch {
			toast.error('Unable to copy this URL.');
		}
	}

	function responseMessage(payload: unknown, fallback: string): string {
		if (payload && typeof payload === 'object' && 'message' in payload) {
			const message = (payload as { message?: unknown }).message;
			if (typeof message === 'string') return message;
		}
		return fallback;
	}

	async function openEditor(id: string): Promise<void> {
		selected = undefined;
		values = emptyValues();
		initialValues = emptyValues();
		initialExpiration = '';
		expirationDate = undefined;
		expirationTime = '23:59';
		modalStep = 'edit';
		modalError = '';
		loadingURL = true;
		try {
			const response = await fetch(`${base}/my-links/${encodeURIComponent(id)}`);
			const payload: unknown = await response.json();
			if (!response.ok) throw new Error(responseMessage(payload, 'Unable to load this URL.'));
			const url = payload as ShortURL;
			selected = url;
			values = {
				originalURL: url.originalURL,
				title: url.title ?? '',
				description: url.description ?? '',
				status: url.statusCode
			};
			expirationDate = expirationDateValue(url.expiresAt);
			expirationTime = expirationTimeValue(url.expiresAt);
			initialValues = { ...values };
			initialExpiration = expirationISOString() ?? '';
		} catch (error) {
			modalError = error instanceof Error ? error.message : 'Unable to load this URL.';
			toast.error(modalError);
		} finally {
			loadingURL = false;
		}
	}

	function closeEditor(): void {
		if (saving) return;
		selected = undefined;
		modalError = '';
	}

	function requestDelete(url: ShortURL, mode: DeleteMode): void {
		deleteTarget = url;
		deleteMode = mode;
		deleteError = '';
	}

	function closeDelete(): void {
		if (deleting) return;
		deleteTarget = undefined;
		deleteError = '';
	}

	async function confirmDelete(): Promise<void> {
		if (!deleteTarget || deleting) return;
		deleting = true;
		deleteError = '';
		const permanent = deleteMode === 'hard';
		const toastId = toast.loading(permanent ? 'Permanently deleting link…' : 'Deleting link…');
		try {
			const response = await fetch(
				`${base}/my-links/${encodeURIComponent(deleteTarget.id)}${permanent ? '?mode=hard' : ''}`,
				{ method: 'DELETE' }
			);
			const payload: unknown = await response.json();
			if (!response.ok)
				throw new Error(
					responseMessage(
						payload,
						permanent ? 'Unable to permanently delete this URL.' : 'Unable to delete this URL.'
					)
				);
			toast.success(permanent ? 'Link permanently deleted.' : 'Link moved to Deleted.', {
				id: toastId
			});
			deleteTarget = undefined;
			// await invalidateAll();
		} catch (error) {
			deleteError = error instanceof Error ? error.message : 'Unable to delete this URL.';
			toast.error(deleteError, { id: toastId });
		} finally {
			deleting = false;
		}
	}

	function preview(event: SubmitEvent): void {
		event.preventDefault();
		if (!hasChanges) return;
		modalError = '';
		try {
			const url = new URL(values.originalURL);
			if (!['https:'].includes(url.protocol)) throw new Error();
		} catch {
			modalError = 'Enter a valid URL beginning with http:// or https://';
			return;
		}
		modalStep = 'preview';
	}

	// async function updateURL(): Promise<void> {
	// 	if (!selected || saving) return;
	// 	const selectedId = selected.id;
	// 	saving = true;
	// 	modalError = '';
	// 	const toastId = toast.loading('Updating your link…');
	// 	try {
	// 		const response = await fetch(`${base}/my-links/${encodeURIComponent(selected.id)}`, {
	// 			method: 'PATCH',
	// 			headers: { 'content-type': 'application/json' },
	// 			body: JSON.stringify({
	// 				originalURL: values.originalURL.trim(),
	// 				title: values.title.trim(),
	// 				description: values.description.trim(),
	// 				status: values.status,
	// 				...(expirationISOString() ? { expiresAt: expirationISOString() } : {})
	// 			})
	// 		});
	// 		const payload: unknown = await response.json();
	// 		if (!response.ok) throw new Error(responseMessage(payload, 'Unable to update this URL.'));
	// 		statusOverrides = { ...statusOverrides, [selectedId]: values.status };
	// 		toast.success('Link updated successfully.', { id: toastId });
	// 		selected = undefined;
	// 		// await invalidateAll();
	// 	} catch (error) {
	// 		modalError = error instanceof Error ? error.message : 'Unable to update this URL.';
	// 		toast.error(modalError, { id: toastId });
	// 	} finally {
	// 		saving = false;
	// 	}
	// }

	function changePage(page: number): void {
		const status = statusQuery(filter);
		void goto(resolve(`/my-links?page=${page}${status}`), {
			noScroll: true,
			keepFocus: true
		});
	}

	function changeFilter(nextFilter: LinkFilter): void {
		const status = statusQuery(nextFilter);
		void goto(resolve(`/my-links?page=1${status}`), { noScroll: true });
	}

	function statusQuery(value: LinkFilter): string {
		if (value === 'all') return '';
		return `&status=${value === 'inactive' ? 'disabled' : value}`;
	}
</script>

<svelte:head>
	<title>My Links | Linkflow</title>
	<meta name="description" content="Review and update your shortened URLs." />
</svelte:head>

<svelte:window
	onkeydown={(event) => {
		if (event.key !== 'Escape') return;
		if (deleteTarget) closeDelete();
		else if (selected) closeEditor();
	}}
/>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
	<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="URL totals">
		{#each [{ label: 'All URLs', value: data.counts.all, tone: 'bg-primary' }, { label: 'Active', value: data.counts.active, tone: 'bg-success' }, { label: 'Disabled', value: data.counts.disabled, tone: 'bg-muted-foreground' }, { label: 'Expired', value: data.counts.expired, tone: 'bg-warning' }, { label: 'Deleted', value: data.counts.deleted, tone: 'bg-destructive' }] as card (card.label)}
			<article class="shadow-micro rounded-xl border border-border bg-card p-5">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-label-caps font-semibold tracking-wider text-muted-foreground uppercase">
							{card.label}
						</p>
						<p class="mt-3 text-3xl font-semibold tracking-tight">
							{card.value === null ? '—' : card.value.toLocaleString()}
						</p>
					</div>
					<span class={['mt-1 size-2.5 rounded-full', card.tone]} aria-hidden="true"></span>
				</div>
				<div class="mt-4 h-0.5 bg-muted"><div class={['h-full w-2/3', card.tone]}></div></div>
			</article>
		{/each}
	</section>

	{#if data.loadError}
		<div
			class="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"
			role="alert"
		>
			{data.loadError}
		</div>
	{:else if data.urls.length === 0 && filter === 'all'}
		<div class="rounded-xl border border-dashed border-border bg-card p-12 text-center">
			<LinkIcon class="mx-auto size-9 text-muted-foreground" />
			<h2 class="mt-4 text-lg font-semibold">No links found</h2>
			<p class="mt-1 text-sm text-muted-foreground">Create a shortened URL to see it here.</p>
		</div>
	{:else}
		<div
			class="shadow-micro overflow-hidden rounded-xl border border-border bg-card"
			aria-label="My links"
		>
			<div class="border-b border-border px-5">
				<div class="flex gap-6 overflow-x-auto" role="tablist" aria-label="Filter URLs by status">
					{#each filters as item (item.value)}
						<button
							type="button"
							role="tab"
							aria-selected={filter === item.value}
							onclick={() => changeFilter(item.value)}
							class={[
								'relative h-12 shrink-0 cursor-pointer text-sm font-medium transition-colors',
								filter === item.value
									? 'text-primary'
									: 'text-muted-foreground hover:text-foreground'
							]}
						>
							{item.label}
							{#if filter === item.value}<span
									class="absolute right-0 bottom-0 left-0 h-0.5 bg-primary"
								></span>{/if}
						</button>
					{/each}
				</div>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[760px] border-collapse text-sm">
					<thead>
						<tr
							class="border-b border-border bg-muted/30 text-label-caps tracking-wider text-muted-foreground uppercase"
						>
							<th scope="col" class="px-5 py-4 text-left font-medium">Short URL</th>
							<th scope="col" class="px-5 py-4 text-left font-medium">Original URL</th>
							<th scope="col" class="px-5 py-4 text-center font-medium">Clicks</th>
							<th scope="col" class="px-5 py-4 text-center font-medium">Status</th>
							<th scope="col" class="px-5 py-4 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredURLs as url (url.id)}
							<tr class="transition-colors hover:bg-muted/35">
								<td class="max-w-64 px-5 py-5">
									<div class="flex items-center gap-2">
										<p class="min-w-0 truncate font-mono text-xs text-primary">{shortLabel(url)}</p>
										<button
											type="button"
											onclick={() => copyURL(url.shortURL || url.shortCode, `${url.id}-short`)}
											aria-label="Copy short URL"
											title="Copy short URL"
											class="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
										>
											{#if copiedField === `${url.id}-short`}<CircleCheck
													class="size-4 text-success"
												/>{:else}<Copy class="size-4" />{/if}
										</button>
									</div>
									<p class="mt-2 truncate text-sm font-medium">{url.title || 'Untitled link'}</p>
								</td>
								<td class="max-w-80 px-5 py-5">
									<div class="flex items-center gap-2">
										<p class="min-w-0 truncate font-medium" title={url.originalURL}>
											{url.originalURL}
										</p>
										<button
											type="button"
											onclick={() => copyURL(url.originalURL, `${url.id}-original`)}
											aria-label="Copy original URL"
											title="Copy original URL"
											class="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
										>
											{#if copiedField === `${url.id}-original`}<CircleCheck
													class="size-4 text-success"
												/>{:else}<Copy class="size-4" />{/if}
										</button>
									</div>
									<p class="mt-2 truncate text-xs text-muted-foreground">
										{url.description || 'No description'}
									</p>
								</td>
								<td class="px-5 py-4 text-center font-mono"
									><a
										class="text-primary underline-offset-4 hover:underline"
										href={resolve('/analytics')}
										aria-label={`View analytics for ${url.title || url.shortCode}`}
										>{url.clicks.toLocaleString()}</a
									></td
								>
								<td class="px-5 py-4 text-center">
									<span
										class={[
											'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
											statusFor(url) === 'active'
												? 'bg-success/10 text-success'
												: statusFor(url) === 'deleted'
													? 'bg-destructive/10 text-destructive'
													: 'bg-muted text-muted-foreground'
										]}>{statusFor(url) === 'inactive' ? 'Disabled' : statusFor(url)}</span
									>
								</td>
								<td class="px-5 py-4 text-right">
									<div class="flex justify-end gap-2">
										<a
											href={resolve('/analytics')}
											class="inline-flex h-9 items-center rounded-md border border-border px-3 font-medium text-primary hover:bg-muted"
											>Analytics</a
										>
										<button
											type="button"
											disabled={['expired', 'deleted'].includes(statusFor(url))}
											onclick={() => openEditor(url.id)}
											title={['expired', 'deleted'].includes(statusFor(url))
												? 'Expired and deleted URLs cannot be changed.'
												: 'Edit URL'}
											class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border px-3 font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
										>
											<Pencil class="size-4" /> Edit
										</button>
										{#if statusFor(url) === 'deleted'}
											<button
												type="button"
												onclick={() => requestDelete(url, 'hard')}
												class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-destructive/40 px-3 font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none"
											>
												<Trash2 class="size-4" /> Delete forever
											</button>
										{:else}
											<button
												type="button"
												onclick={() => requestDelete(url, 'soft')}
												class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border px-3 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
											>
												<Trash2 class="size-4" /> Delete
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
						{#if filteredURLs.length === 0}
							<tr
								><td colspan="5" class="px-5 py-10 text-center text-muted-foreground"
									>No {filters.find((item) => item.value === filter)?.label.toLowerCase()} URLs on this
									page.</td
								></tr
							>
						{/if}
					</tbody>
				</table>
			</div>
			<div class="border-t border-border p-4">
				<Pagination
					loading={navigating.to?.url.pathname === resolve('/my-links')}
					page={data.page}
					totalItems={data.total}
					itemsPerPage={data.perPage}
					onpagechange={changePage}
				/>
			</div>
		</div>
	{/if}
</div>

{#if selected || loadingURL || modalError}
	<div
		transition:fade={{ duration: 160 }}
		class="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-3 backdrop-blur-sm sm:p-6"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && closeEditor()}
	>
		<div
			transition:scale={{ duration: 200, start: 0.97 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="edit-link-title"
			class="shadow-overlay relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-5 sm:p-8"
		>
			<button
				type="button"
				onclick={closeEditor}
				aria-label="Close update link dialog"
				class="absolute top-3 right-3 inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				<X class="size-5" />
			</button>

			<div class="mb-6 pr-10">
				<p class="text-label-caps font-semibold tracking-wider text-primary uppercase">
					{modalStep === 'edit' ? 'Step 1 of 2' : 'Step 2 of 2'}
				</p>
				<h2 id="edit-link-title" class="mt-1 text-2xl font-semibold tracking-tight">
					{modalStep === 'edit' ? 'Update link' : 'Preview changes'}
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{modalStep === 'edit'
						? 'Fresh data is loaded before you make changes.'
						: 'Confirm these values before updating the server.'}
				</p>
			</div>

			{#if loadingURL}
				<div class="flex min-h-48 items-center justify-center gap-3 text-muted-foreground">
					<LoaderCircle class="size-5 animate-spin" /> Loading link…
				</div>
			{:else if !selected}
				<div
					class="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
					role="alert"
				>
					{modalError || 'Unable to load this URL.'}
				</div>
			{:else if modalStep === 'edit'}
				<form class="grid gap-5" onsubmit={preview}>
					<label class="grid gap-2 text-sm font-medium">
						Original URL
						<input
							required
							type="url"
							bind:value={values.originalURL}
							class="h-12 rounded-md border border-input bg-background px-4 font-normal outline-none focus:ring-2 focus:ring-ring"
						/>
					</label>
					<div class="grid gap-5 sm:grid-cols-2">
						<label class="grid gap-2 text-sm font-medium">
							Title
							<input
								bind:value={values.title}
								class="h-12 rounded-md border border-input bg-background px-4 font-normal outline-none focus:ring-2 focus:ring-ring"
							/>
						</label>
						<label class="grid gap-2 text-sm font-medium">
							Status
							<select
								bind:value={values.status}
								class="h-12 rounded-md border border-input bg-background px-4 font-normal outline-none focus:ring-2 focus:ring-ring"
							>
								<option value={1}>Active</option><option value={0}>Disabled</option><option
									value={2}>Expired</option
								><option value={3}>Deleted</option>
							</select>
						</label>
					</div>
					<div
						class="grid items-center gap-3 sm:grid-cols-[minmax(7rem,0.65fr)_minmax(0,1fr)_8rem]"
					>
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
								id="updateExpirationTime"
								type="time"
								bind:value={expirationTime}
								aria-label="Expiration time"
								onclick={(event) => event.currentTarget.showPicker?.()}
								class="h-12 w-full rounded-md border border-input bg-background px-4 text-sm text-foreground scheme-light transition-all outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 dark:border-border dark:bg-card dark:scheme-dark"
							/>
						</div>
					</div>
					{#if futureManualExpiration}
						<p
							class="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground"
							role="status"
						>
							This URL is scheduled to expire on {date(futureManualExpiration)} and has not expired by
							date yet. You can still mark it as Expired now.
						</p>
					{/if}
					<label class="grid gap-2 text-sm font-medium">
						Description
						<textarea
							rows="4"
							bind:value={values.description}
							class="rounded-md border border-input bg-background p-4 font-normal outline-none focus:ring-2 focus:ring-ring"
						></textarea>
					</label>
					{#if modalError}<p class="text-sm text-destructive" role="alert">{modalError}</p>{/if}
					<div class="flex justify-end gap-3 border-t border-border pt-5">
						<button
							type="button"
							onclick={closeEditor}
							class="h-10 cursor-pointer rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
							>Cancel</button
						>
						{#if hasChanges}
							<button
								type="submit"
								class="h-10 cursor-pointer rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
								>Preview changes</button
							>
						{/if}
					</div>
				</form>
			{:else}
				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						saving = true;
						modalError = '';
						const toastId = toast.loading('Updating your link…');
						const selectedId = selected!.id;
						const savedStatus = values.status;
						return async ({ result, update }) => {
							if (result.type === 'success') {
								statusOverrides = { ...statusOverrides, [selectedId]: savedStatus };
								toast.success('Link updated successfully.', { id: toastId });
								selected = undefined;
								await update();
							} else {
								const message =
									result.type === 'failure' && typeof result.data?.message === 'string'
										? result.data.message
										: 'Unable to update this URL.';
								modalError = message;
								toast.error(message, { id: toastId });
							}
							saving = false;
						};
					}}
					class="grid gap-5"
				>
					<input type="hidden" name="id" value={selected?.id} />
					<input type="hidden" name="originalURL" value={values.originalURL.trim()} />
					<input type="hidden" name="title" value={values.title.trim()} />
					<input type="hidden" name="description" value={values.description.trim()} />
					<input type="hidden" name="status" value={values.status} />
					{#if expirationISOString()}
						<input type="hidden" name="expiresAt" value={expirationISOString()} />
					{/if}
					<dl class="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<dt class="text-xs font-medium text-muted-foreground uppercase">Original URL</dt>
							<dd class="mt-1 text-sm break-all">{values.originalURL}</dd>
						</div>
						<div>
							<dt class="text-xs font-medium text-muted-foreground uppercase">Title</dt>
							<dd class="mt-1 text-sm">{values.title || 'Untitled'}</dd>
						</div>
						<div>
							<dt class="text-xs font-medium text-muted-foreground uppercase">Status</dt>
							<dd class="mt-1 text-sm">
								{['Disabled', 'Active', 'Expired', 'Deleted'][values.status]}
							</dd>
						</div>
						<div>
							<dt class="text-xs font-medium text-muted-foreground uppercase">Expiration</dt>
							<dd class="mt-1 text-sm">{date(expirationISOString())}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-xs font-medium text-muted-foreground uppercase">Description</dt>
							<dd class="mt-1 text-sm whitespace-pre-wrap">
								{values.description || 'No description'}
							</dd>
						</div>
					</dl>
					{#if modalError}<p class="text-sm text-destructive" role="alert">{modalError}</p>{/if}
					<div
						class="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end"
					>
						<button
							type="button"
							disabled={saving}
							onclick={() => (modalStep = 'edit')}
							class="h-10 cursor-pointer rounded-md border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
							>Back to edit</button
						>
						<button
							type="submit"
							disabled={saving}
							class="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{#if saving}<LoaderCircle class="size-4 animate-spin" />{/if} Confirm update
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

{#if deleteTarget}
	<div
		transition:fade={{ duration: 160 }}
		class="fixed inset-0 z-80 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && closeDelete()}
	>
		<div
			transition:scale={{ duration: 180, start: 0.97 }}
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="delete-link-title"
			aria-describedby="delete-link-description"
			class="shadow-overlay relative w-full max-w-lg rounded-xl border border-border bg-card p-6 sm:p-8"
		>
			<button
				type="button"
				onclick={closeDelete}
				aria-label="Close delete confirmation"
				class="absolute top-3 right-3 inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				<X class="size-5" />
			</button>

			<div
				class="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive"
			>
				<Trash2 class="size-5" />
			</div>
			<h2 id="delete-link-title" class="mt-4 pr-10 text-xl font-semibold tracking-tight">
				{deleteMode === 'hard' ? 'Permanently delete this URL?' : 'Move this URL to Deleted?'}
			</h2>
			<p id="delete-link-description" class="mt-2 text-sm leading-6 text-muted-foreground">
				{#if deleteMode === 'hard'}
					This hard delete permanently removes <strong class="text-foreground"
						>{deleteTarget.title || deleteTarget.shortCode}</strong
					> and its stored data. It cannot be retrieved or undone.
				{:else}
					This soft delete disables <strong class="text-foreground"
						>{deleteTarget.title || deleteTarget.shortCode}</strong
					> and moves it to the Deleted view. Its data remains available until you permanently delete
					it.
				{/if}
			</p>

			{#if deleteError}
				<p
					class="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
					role="alert"
				>
					{deleteError}
				</p>
			{/if}

			<div
				class="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end"
			>
				<button
					type="button"
					disabled={deleting}
					onclick={closeDelete}
					class="h-10 cursor-pointer rounded-md border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					disabled={deleting}
					onclick={confirmDelete}
					class="text-destructive-foreground inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-destructive px-5 text-sm font-semibold hover:bg-destructive/90 disabled:opacity-50"
				>
					{#if deleting}<LoaderCircle class="size-4 animate-spin" />{/if}
					{deleteMode === 'hard' ? 'Delete forever' : 'Move to Deleted'}
				</button>
			</div>
		</div>
	</div>
{/if}
