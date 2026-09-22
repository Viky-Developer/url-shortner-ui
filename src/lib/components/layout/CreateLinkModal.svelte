<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { base } from '$app/paths';
	import { DatePicker } from '$lib/components/ui/datepicker';
	import { LoaderCircle, X } from '$lib/components/ui/icons';
	import { closeCreateLink, createLinkOpen } from '$lib/state/create-link';
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { fade, scale } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import type { SubmitFunction } from '@sveltejs/kit';

	let originalURL = $state('');
	let expirationDate = $state<DateValue | undefined>();
	let expirationTime = $state('23:59');
	let submitting = $state(false);
	let errorMessage = $state('');

	function validURL(value: string): boolean {
		try {
			return ['http:', 'https:'].includes(new URL(value).protocol);
		} catch {
			return false;
		}
	}

	function close(): void {
		if (!submitting) closeCreateLink();
	}

	const enhanceCreate: SubmitFunction = ({ formData, cancel }) => {
		if (submitting || !validURL(originalURL)) {
			cancel();
			errorMessage = 'Enter a valid URL beginning with http:// or https://';
			return;
		}
		if (expirationDate) {
			const [hour, minute] = expirationTime.split(':').map(Number);
			formData.set(
				'expiresAt',
				new Date(
					expirationDate.year,
					expirationDate.month - 1,
					expirationDate.day,
					hour || 0,
					minute || 0
				).toISOString()
			);
		}
		submitting = true;
		const toastId = toast.loading('Creating your link…');
		return async ({ result }) => {
			submitting = false;
			if (result.type === 'success') {
				toast.success('Link created successfully.', { id: toastId });
				originalURL = '';
				expirationDate = undefined;
				closeCreateLink();
				await invalidateAll();
			} else {
				errorMessage =
					result.type === 'failure' && typeof result.data?.message === 'string'
						? result.data.message
						: 'Unable to create this link.';
				toast.error(errorMessage, { id: toastId });
			}
		};
	};
</script>

<svelte:window onkeydown={(event) => $createLinkOpen && event.key === 'Escape' && close()} />

{#if $createLinkOpen}
	<div
		transition:fade={{ duration: 160 }}
		class="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && close()}
	>
		<div
			transition:scale={{ duration: 200, start: 0.97 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="shared-create-title"
			class="shadow-overlay relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 sm:p-8"
		>
			<button
				type="button"
				onclick={close}
				aria-label="Close create link dialog"
				class="absolute top-3 right-3 inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
				><X class="size-5" /></button
			>
			<div class="mb-6 pr-10">
				<h2 id="shared-create-title" class="text-2xl font-semibold">Create link</h2>
				<p class="mt-1 text-sm text-muted-foreground">Add a shortened URL to your workspace.</p>
			</div>
			<form
				method="POST"
				action={`${base}/dashboard?/create`}
				use:enhance={enhanceCreate}
				class="grid gap-5"
			>
				<label class="grid gap-2 text-sm font-medium"
					>Original URL <input
						name="originalURL"
						type="url"
						required
						bind:value={originalURL}
						oninput={() => (errorMessage = '')}
						class="h-12 rounded-md border border-input bg-background px-4 font-normal outline-none focus:ring-2 focus:ring-ring"
					/></label
				>
				<div class="grid gap-5 sm:grid-cols-2">
					<label class="grid gap-2 text-sm font-medium"
						>Custom code <input
							name="customCode"
							class="h-12 rounded-md border border-input bg-background px-4 font-mono font-normal outline-none focus:ring-2 focus:ring-ring"
						/></label
					><label class="grid gap-2 text-sm font-medium"
						>Title <input
							name="title"
							class="h-12 rounded-md border border-input bg-background px-4 font-normal outline-none focus:ring-2 focus:ring-ring"
						/></label
					>
				</div>
				<div class="grid items-center gap-3 sm:grid-cols-[7rem_1fr_8rem]">
					<p class="text-sm font-medium">
						Expire on <span class="text-muted-foreground">(optional)</span>
					</p>
					<DatePicker
						bind:value={expirationDate}
						minValue={today(getLocalTimeZone())}
						class="h-12 w-full border-input bg-background px-4"
					/><input
						type="time"
						bind:value={expirationTime}
						aria-label="Expiration time"
						class="h-12 rounded-md border border-input bg-background px-4"
					/>
				</div>
				<label class="grid gap-2 text-sm font-medium"
					>Description <textarea
						name="description"
						rows="3"
						class="rounded-md border border-input bg-background p-4 font-normal outline-none focus:ring-2 focus:ring-ring"
					></textarea></label
				>
				{#if errorMessage}<p role="alert" class="text-sm text-destructive">{errorMessage}</p>{/if}
				<div class="flex justify-end gap-3 border-t border-border pt-5">
					<button
						type="button"
						onclick={close}
						class="h-10 cursor-pointer rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
						>Cancel</button
					><button
						type="submit"
						disabled={!originalURL.trim() || submitting}
						class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
						>{#if submitting}<LoaderCircle class="size-4 animate-spin" />{/if}{submitting
							? 'Creating…'
							: 'Create link'}</button
					>
				</div>
			</form>
		</div>
	</div>
{/if}
