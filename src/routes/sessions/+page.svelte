<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { LockKeyhole, LogOut, LoaderCircle } from '$lib/components/ui/icons';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import Globe from '@lucide/svelte/icons/globe';
	import Clock from '@lucide/svelte/icons/clock';
	import { Dialog } from 'bits-ui';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
	let refreshing = $state(false);
	let confirmation = $state<'revokeOthers' | 'revokeAll' | null>(null);
	let refreshError = $state('');
	const sessions = $derived(
		[...data.sessions].sort(
			(a, b) => Number(b.id === data.currentSessionId) - Number(a.id === data.currentSessionId)
		)
	);
	const otherCount = $derived(
		sessions.filter((session) => session.id !== data.currentSessionId).length
	);
	const submitting: SubmitFunction = ({ cancel }) => {
		if (busy || refreshing) {
			cancel();
			return;
		}
		busy = true;
		return async ({ update }) => {
			try {
				await update();
			} finally {
				busy = false;
				confirmation = null;
			}
		};
	};
	function date(value: string) {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? 'Not available'
			: new Intl.DateTimeFormat('en', {
					dateStyle: 'medium',
					timeStyle: 'short',
					timeZone: 'UTC'
				}).format(parsed) + ' UTC';
	}
	async function refresh() {
		refreshing = true;
		refreshError = '';
		try {
			await invalidateAll();
		} catch {
			refreshError = 'Unable to refresh sessions. Please try again.';
		} finally {
			refreshing = false;
		}
	}
</script>

<svelte:head
	><title>Sessions · Linkflow</title><meta
		name="description"
		content="Review your signed-in devices and manage account sessions."
	/></svelte:head
>

<section class="mx-auto max-w-6xl space-y-6" aria-busy={busy || refreshing}>
	<div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
		<div>
			<h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
				<LockKeyhole class="size-6 text-primary" /> Active sessions
			</h1>
			<p class="mt-2 max-w-xl text-sm text-muted-foreground">
				Review devices signed in to your account. Revoke access from devices you no longer use or
				recognize.
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button variant="outline" disabled={busy || refreshing} onclick={refresh}
				>{#if refreshing}<LoaderCircle class="size-4 animate-spin" />{/if}Refresh</Button
			>
			<Button
				variant="outline"
				disabled={busy || refreshing || !!data.loadError || otherCount === 0}
				onclick={() => (confirmation = 'revokeOthers')}>Revoke other sessions</Button
			>
		</div>
	</div>

	{#if form?.error || refreshError}<div
			role="alert"
			class="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
		>
			{form?.error || refreshError}
		</div>{/if}
	{#if form?.success}<div
			role="status"
			class="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"
		>
			{form.success}
		</div>{/if}

	{#if data.loadError}
		<div role="alert" class="rounded-xl border border-destructive/30 bg-card p-8 text-center">
			<h2 class="font-semibold">Sessions couldn't be loaded</h2>
			<p class="my-3 text-sm text-muted-foreground">{data.loadError}</p>
			<Button variant="outline" onclick={refresh} disabled={refreshing}>Try again</Button>
		</div>
	{:else if sessions.length === 0}
		<div class="rounded-xl border bg-card p-12 text-center">
			<Monitor class="mx-auto mb-4 size-8 text-muted-foreground" />
			<h2 class="font-semibold">No sessions found</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				Refresh to check for recently signed-in devices.
			</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border bg-card">
			<div class="flex items-center justify-between border-b px-5 py-4">
				<h2 class="text-sm font-semibold">Your devices</h2>
				<span class="text-xs text-muted-foreground"
					>{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}</span
				>
			</div>
			<ul class="divide-y">
				{#each sessions as session (session.id)}
					{@const current = session.id === data.currentSessionId}
					<li class="flex flex-wrap items-start gap-4 p-5 sm:flex-nowrap sm:items-center">
						<div
							class={[
								'flex size-11 shrink-0 items-center justify-center rounded-lg',
								current ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
							]}
						>
							{#if /mobile|phone|tablet/i.test(session.deviceType || session.deviceName || '')}<Smartphone
									class="size-5"
								/>{:else}<Monitor class="size-5" />{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="text-sm font-medium break-words">
									{session.deviceName || session.deviceType || 'Unknown device'}
								</h3>
								{#if current}<span
										class="rounded bg-primary/10 px-2 py-1 text-[10px] font-semibold tracking-wide text-primary uppercase"
										>Current session</span
									>{/if}
							</div>
							<div class="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
								<span class="inline-flex items-center gap-1.5"
									><Globe class="size-3.5" />{[session.city, session.country]
										.filter(Boolean)
										.join(', ') || 'Location unavailable'}</span
								>
								<span class="font-mono break-all">{session.ipAddress || 'IP unavailable'}</span>
								<span class="inline-flex items-center gap-1.5"
									><Clock class="size-3.5 shrink-0" />Last active: {date(
										session.lastActiveAt
									)}</span
								>
							</div>
							<p class="mt-2 text-xs text-muted-foreground">
								Signed in: {date(session.loggedInAt)}
							</p>
						</div>
						{#if current}<span class="text-xs text-muted-foreground">This device</span>{:else}
							<form method="POST" action="?/revoke" use:enhance={submitting}>
								<input type="hidden" name="id" value={session.id} /><Button
									type="submit"
									variant="ghost"
									class="text-destructive"
									disabled={busy || refreshing}
									aria-label={`Revoke session for ${session.deviceName || 'unknown device'}`}
									>Revoke</Button
								>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div
		class="flex flex-col justify-between gap-4 rounded-xl border border-destructive/20 bg-card p-5 sm:flex-row sm:items-center"
	>
		<div>
			<h2 class="text-sm font-semibold">Sign out everywhere</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Revoke all sessions, including this device. You'll need to sign in again.
			</p>
		</div>
		<Button
			variant="destructive"
			disabled={busy || refreshing}
			onclick={() => (confirmation = 'revokeAll')}
			><LogOut class="size-4" /> Revoke all sessions</Button
		>
	</div>
	{#if busy}<p role="status" class="flex items-center gap-2 text-sm text-muted-foreground">
			<LoaderCircle class="size-4 animate-spin" />Updating sessions…
		</p>{/if}
	<p class="text-xs text-muted-foreground">
		Don't recognize a device? Revoke its session to remove access to your account.
	</p>
</section>

<Dialog.Root
	open={confirmation !== null}
	onOpenChange={(open) => {
		if (!open && !busy) confirmation = null;
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl"
			onEscapeKeydown={(event) => {
				if (busy) event.preventDefault();
			}}
			onInteractOutside={(event) => {
				if (busy) event.preventDefault();
			}}
		>
			<Dialog.Title class="text-lg font-semibold"
				>{confirmation === 'revokeAll'
					? 'Revoke all sessions?'
					: 'Revoke other sessions?'}</Dialog.Title
			>
			<Dialog.Description class="mt-2 text-sm text-muted-foreground"
				>{confirmation === 'revokeAll'
					? 'Every device, including this one, will be signed out. You will return to the sign-in page.'
					: 'All other devices will lose access. This device will remain signed in.'}</Dialog.Description
			>
			<form
				method="POST"
				action={confirmation === 'revokeAll'
					? `${resolve('/sessions')}?/revokeAll`
					: `${resolve('/sessions')}?/revokeOthers`}
				use:enhance={submitting}
				class="mt-6 flex justify-end gap-2"
			>
				<Button variant="outline" disabled={busy} onclick={() => (confirmation = null)}
					>Cancel</Button
				>
				<Button type="submit" variant="destructive" disabled={busy}
					>{#if busy}<LoaderCircle class="size-4 animate-spin" />{/if}{confirmation === 'revokeAll'
						? 'Revoke all sessions'
						: 'Revoke other sessions'}</Button
				>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
