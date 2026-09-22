<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { LoaderCircle, Plus, ShieldCheck, Trash2, Wrench, X } from '$lib/components/ui/icons';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { toast } from 'svelte-sonner';
	import { Dialog } from 'bits-ui';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let dialog = $state<'domain' | 'ipRange' | null>(null);
	let busy = $state(false);
	let deleting = $state<string | null>(null);
	let maintenanceAction = $state<string | null>(null);
	let fieldErrors = $state<Record<string, string>>({});
	let domain = $state('');
	let reason = $state('');
	let cidr = $state('');
	let description = $state('');
	type MaintenanceKey = 'sessions' | 'passwordHistory';
	let maintenanceDays = $state<Record<MaintenanceKey, string>>({
		sessions: '30',
		passwordHistory: '90'
	});
	const formReady = $derived(
		dialog === 'domain'
			? domain.trim().length > 0
			: dialog === 'ipRange' && cidr.trim().length > 0 && description.trim().length > 0
	);
	const buttonMotion =
		'transition-transform duration-200 ease-out hover:scale-[1.03] active:scale-95 disabled:hover:scale-100 disabled:active:scale-100';
	const actionButton = `${buttonMotion} h-9 px-4`;
	const maintenanceItems: {
		key: MaintenanceKey;
		title: string;
		text: string;
		defaultDays: string;
		button: string;
		action: string;
	}[] = [
		{
			key: 'sessions',
			title: 'Purge Old Sessions',
			text: 'Remove inactive user sessions older than a specified number of days.',
			defaultDays: '30',
			button: 'Purge Sessions',
			action: '?/purgeSessions'
		},
		{
			key: 'passwordHistory',
			title: 'Purge Password History',
			text: 'Clear old password hashes retained for security policies.',
			defaultDays: '90',
			button: 'Purge History',
			action: '?/purgePasswordHistory'
		}
	];

	function maintenanceReady(item: (typeof maintenanceItems)[number]): boolean {
		const value = maintenanceDays[item.key].trim();
		return /^\d+$/.test(value) && Number(value) > 0 && value !== item.defaultDays;
	}

	function updateMaintenanceDays(key: MaintenanceKey, event: Event): void {
		maintenanceDays = {
			...maintenanceDays,
			[key]: (event.currentTarget as HTMLInputElement).value
		};
	}

	function validIPAddress(value: string): boolean {
		if (value.includes(':')) {
			try {
				const parsed = new URL(`http://[${value}]/`);
				return parsed.hostname.startsWith('[') && parsed.hostname.endsWith(']');
			} catch {
				return false;
			}
		}

		const octets = value.split('.');
		return (
			octets.length === 4 &&
			octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
		);
	}

	function validDomainOrIPAddress(value: string): boolean {
		if (validIPAddress(value)) return true;
		return (
			value.length <= 253 &&
			/^(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value)
		);
	}

	function validCIDR(value: string): boolean {
		const [address, prefix, extra] = value.split('/');
		if (extra !== undefined || !address || !/^\d+$/.test(prefix || '')) return false;
		const size = Number(prefix);
		if (address.includes(':')) return size >= 0 && size <= 128 && /^[0-9a-f:]+$/i.test(address);
		const octets = address.split('.');
		return (
			size >= 0 &&
			size <= 32 &&
			octets.length === 4 &&
			octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
		);
	}

	function validateCreate(action: string, formData: FormData): boolean {
		fieldErrors = {};
		if (action.includes('createDomain')) {
			const domain = String(formData.get('domain') || '').trim();
			if (!domain) fieldErrors.domain = 'Enter a domain or IP address to block.';
			else if (!validDomainOrIPAddress(domain))
				fieldErrors.domain =
					'Enter a valid domain or IP address, such as example.com or 192.0.2.1.';
		}
		if (action.includes('createIPRange')) {
			const cidr = String(formData.get('cidr') || '').trim();
			const description = String(formData.get('description') || '').trim();
			if (!cidr) fieldErrors.cidr = 'Enter an IP range in CIDR notation.';
			else if (!validCIDR(cidr))
				fieldErrors.cidr = 'Enter a valid CIDR, such as 192.0.2.0/24 or 2001:db8::/32.';
			if (!description) fieldErrors.description = 'Enter a description for this IP range.';
		}
		return Object.keys(fieldErrors).length === 0;
	}

	function resetDialogFields(): void {
		domain = '';
		reason = '';
		cidr = '';
		description = '';
	}

	function setDialog(value: 'domain' | 'ipRange' | null): void {
		if (busy) return;
		fieldErrors = {};
		if (value === null) resetDialogFields();
		dialog = value;
	}

	const submit: SubmitFunction = ({ cancel, formElement, formData }) => {
		if (busy) {
			cancel();
			return;
		}
		const action = formElement.getAttribute('action') || '';
		if (!validateCreate(action, formData)) {
			cancel();
			return;
		}
		busy = true;
		if (action.includes('delete')) deleting = action;
		if (action.includes('purge')) maintenanceAction = action;
		const maintenanceToastId = action.includes('purge')
			? toast.loading('Running maintenance cleanup…')
			: undefined;
		return async ({ result, update }) => {
			try {
				if (result.type === 'success' && typeof result.data?.success === 'string') {
					toast.success(result.data.success, { id: maintenanceToastId });
					resetDialogFields();
					dialog = null;
					await update({ reset: true, invalidateAll: true });
				} else if (result.type === 'failure' && typeof result.data?.error === 'string') {
					toast.error(result.data.error, { id: maintenanceToastId });
				} else if (result.type === 'error') {
					toast.error('Unable to update the block list. Please try again.', {
						id: maintenanceToastId
					});
				} else {
					if (maintenanceToastId) toast.dismiss(maintenanceToastId);
					await update();
				}
			} finally {
				busy = false;
				deleting = null;
				maintenanceAction = null;
			}
		};
	};

	function date(value: string): string {
		if (!value) return '—';
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? value
			: new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(parsed);
	}
</script>

<svelte:head>
	<title>Admin Control Panel | Linkpluse</title>
	<meta name="description" content="Manage platform security and maintenance settings." />
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-6" aria-busy={busy}>
	<section class="grid gap-6 xl:grid-cols-2" aria-label="Security block lists">
		<Card class="overflow-hidden">
			<CardHeader class="flex items-center justify-between border-b border-border">
				<CardTitle class="text-lg">Blocked Domains</CardTitle>
				<Button class={actionButton} onclick={() => setDialog('domain')} disabled={busy}>
					<Plus /> Add Domain
				</Button>
			</CardHeader>
			<CardContent class="p-0">
				{#if data.domainsError}
					<p class="p-6 text-sm text-destructive" role="alert">{data.domainsError}</p>
				{:else if data.domains.length === 0}
					<p class="p-8 text-center text-sm text-muted-foreground">No blocked domains.</p>
				{:else}
					<div class="admin-scrollbar max-h-124 overflow-y-auto overscroll-contain">
						<Table>
							<TableHeader class="sticky top-0 z-10 bg-card"
								><TableRow
									><TableHead>Domain</TableHead><TableHead>Reason</TableHead><TableHead
										>Date</TableHead
									><TableHead class="text-right">Actions</TableHead></TableRow
								></TableHeader
							>
							<TableBody>
								{#each data.domains as item (item.id)}
									<TableRow>
										<TableCell class="font-medium">{item.domain}</TableCell>
										<TableCell>{item.reason || '—'}</TableCell>
										<TableCell>{date(item.createdAt)}</TableCell>
										<TableCell class="text-right">
											<form method="POST" action="?/deleteDomain" use:enhance={submit}>
												<input type="hidden" name="id" value={item.id} />
												<Button
													class={buttonMotion}
													type="submit"
													variant="ghost"
													size="icon"
													disabled={busy}
													aria-label={`Unblock ${item.domain}`}
													title="Unblock domain"
												>
													{#if deleting === '?/deleteDomain'}<LoaderCircle
															class="animate-spin"
														/>{:else}<Trash2 class="text-destructive" />{/if}
												</Button>
											</form>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			</CardContent>
		</Card>

		<Card class="overflow-hidden">
			<CardHeader class="flex items-center justify-between border-b border-border">
				<CardTitle class="text-lg">Blocked IP Ranges (CIDR)</CardTitle>
				<Button class={actionButton} onclick={() => setDialog('ipRange')} disabled={busy}>
					<Plus /> Add IP Range
				</Button>
			</CardHeader>
			<CardContent class="p-0">
				{#if data.ipRangesError}
					<p class="p-6 text-sm text-destructive" role="alert">{data.ipRangesError}</p>
				{:else if data.ipRanges.length === 0}
					<p class="p-8 text-center text-sm text-muted-foreground">No blocked IP ranges.</p>
				{:else}
					<div class="admin-scrollbar max-h-124 overflow-y-auto overscroll-contain">
						<Table>
							<TableHeader class="sticky top-0 z-10 bg-card"
								><TableRow
									><TableHead>IP range / CIDR</TableHead><TableHead>Description</TableHead
									><TableHead class="text-right">Actions</TableHead></TableRow
								></TableHeader
							>
							<TableBody>
								{#each data.ipRanges as item (item.id)}
									<TableRow>
										<TableCell class="font-mono text-xs font-medium">{item.cidr}</TableCell>
										<TableCell>{item.description}</TableCell>
										<TableCell class="text-right">
											<form method="POST" action="?/deleteIPRange" use:enhance={submit}>
												<input type="hidden" name="id" value={item.id} />
												<Button
													class={buttonMotion}
													type="submit"
													variant="ghost"
													size="icon"
													disabled={busy}
													aria-label={`Unblock ${item.cidr}`}
													title="Unblock IP range"
												>
													{#if deleting === '?/deleteIPRange'}<LoaderCircle
															class="animate-spin"
														/>{:else}<Trash2 class="text-destructive" />{/if}
												</Button>
											</form>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			</CardContent>
		</Card>
	</section>

	<Card>
		<CardHeader
			><div class="flex items-start gap-3">
				<span
					class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500"
					><Wrench class="size-5" /></span
				>
				<div>
					<CardTitle class="text-xl">System Maintenance</CardTitle>
					<p class="mt-1 text-sm text-muted-foreground">
						Permanently remove retained security data older than the selected period.
					</p>
				</div>
			</div></CardHeader
		>
		<CardContent class="grid gap-4 lg:grid-cols-2">
			{#each maintenanceItems as item (item.key)}
				<div class="rounded-xl border border-border bg-background/40 p-5">
					<div class="flex gap-3">
						<ShieldCheck class="mt-0.5 size-5 shrink-0 text-primary" />
						<div>
							<h2 class="font-semibold">{item.title}</h2>
							<p class="mt-1 text-sm text-muted-foreground">{item.text}</p>
						</div>
					</div>
					<form method="POST" action={item.action} use:enhance={submit} class="mt-5 flex gap-2">
						<Input
							name="days"
							type="number"
							min="1"
							step="1"
							value={maintenanceDays[item.key]}
							oninput={(event) => updateMaintenanceDays(item.key, event)}
							required
							aria-label={`${item.title} retention in days`}
						/><Button
							class={[actionButton, maintenanceReady(item) && 'maintenance-ready shadow-sm']}
							type="submit"
							disabled={busy || !maintenanceReady(item)}
							variant={maintenanceReady(item) ? 'default' : 'secondary'}
							title={maintenanceReady(item)
								? `${item.button} using the new retention period`
								: `Change the default ${item.defaultDays}-day value to enable this action`}
							>{#if maintenanceAction === item.action}<LoaderCircle
									class="animate-spin"
								/>{/if}{item.button}</Button
						>
					</form>
					<p class="mt-2 text-xs text-muted-foreground" aria-live="polite">
						{maintenanceReady(item)
							? 'New value detected — the maintenance action is ready.'
							: `Change ${item.defaultDays} to a new retention period to enable the button.`}
					</p>
				</div>
			{/each}
		</CardContent>
	</Card>
</div>

<Dialog.Root
	open={dialog !== null}
	onOpenChange={(open) => {
		if (!open) setDialog(null);
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-80 bg-black/55 backdrop-blur-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
		/>
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-81 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-6 text-foreground shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
			onEscapeKeydown={(event) => busy && event.preventDefault()}
			onInteractOutside={(event) => busy && event.preventDefault()}
		>
			<div class="flex items-start justify-between gap-4">
				<div>
					<Dialog.Title id="admin-dialog-title" class="text-lg font-semibold">
						{dialog === 'domain' ? 'Block a domain or IP address' : 'Block an IP range'}
					</Dialog.Title>
					<Dialog.Description class="mt-1 text-sm text-muted-foreground">
						{dialog === 'domain'
							? 'Prevent links to a domain or a specific IP address.'
							: 'Prevent traffic from a CIDR range.'}
					</Dialog.Description>
				</div>
				<Button
					class={buttonMotion}
					variant="ghost"
					size="icon"
					onclick={() => setDialog(null)}
					aria-label="Close dialog"><X /></Button
				>
			</div>
			<form
				method="POST"
				novalidate
				action={dialog === 'domain' ? '?/createDomain' : '?/createIPRange'}
				use:enhance={submit}
				class="mt-6 space-y-4"
			>
				{#if dialog === 'domain'}
					<div class="space-y-2">
						<Label for="domain">Domain or IP address</Label><Input
							id="domain"
							name="domain"
							bind:value={domain}
							placeholder="example.com or 192.0.2.1"
							autocomplete="off"
							aria-invalid={!!fieldErrors.domain}
							aria-describedby={fieldErrors.domain ? 'domain-error' : undefined}
							required
						/>
						{#if fieldErrors.domain}<p
								id="domain-error"
								class="text-xs text-destructive"
								role="alert"
							>
								{fieldErrors.domain}
							</p>{/if}
					</div>
					<div class="space-y-2">
						<Label for="reason">Reason <span class="text-muted-foreground">(optional)</span></Label
						><Input
							id="reason"
							name="reason"
							bind:value={reason}
							placeholder="Phishing or spam"
							autocomplete="off"
						/>
					</div>
				{:else}
					<div class="space-y-2">
						<Label for="cidr">IP range / CIDR</Label><Input
							id="cidr"
							name="cidr"
							bind:value={cidr}
							placeholder="192.0.2.0/24"
							autocomplete="off"
							aria-invalid={!!fieldErrors.cidr}
							aria-describedby={fieldErrors.cidr ? 'cidr-error' : undefined}
							required
						/>
						{#if fieldErrors.cidr}<p id="cidr-error" class="text-xs text-destructive" role="alert">
								{fieldErrors.cidr}
							</p>{/if}
					</div>
					<div class="space-y-2">
						<Label for="description">Description</Label><Input
							id="description"
							name="description"
							bind:value={description}
							placeholder="Known abuse source"
							autocomplete="off"
							aria-invalid={!!fieldErrors.description}
							aria-describedby={fieldErrors.description ? 'description-error' : undefined}
							required
						/>
						{#if fieldErrors.description}<p
								id="description-error"
								class="text-xs text-destructive"
								role="alert"
							>
								{fieldErrors.description}
							</p>{/if}
					</div>
				{/if}
				<div class="flex justify-end gap-2 pt-2">
					<Button
						class={actionButton}
						type="button"
						variant="outline"
						onclick={() => setDialog(null)}
						disabled={busy}>Cancel</Button
					><Button class={actionButton} type="submit" disabled={!formReady || busy}
						>{#if busy}<LoaderCircle class="animate-spin" />{/if}{dialog === 'domain'
							? 'Block entry'
							: 'Block IP range'}</Button
					>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	@keyframes maintenance-ready {
		0%,
		100% {
			box-shadow: 0 0 0 0 color-mix(in oklab, var(--primary) 38%, transparent);
		}
		50% {
			box-shadow: 0 0 0 5px transparent;
		}
	}

	:global(.maintenance-ready) {
		animation: maintenance-ready 900ms ease-out 2;
	}

	@media (min-width: 1024px) {
		.admin-scrollbar {
			scrollbar-color: color-mix(in oklab, var(--primary) 55%, var(--muted)) transparent;
			scrollbar-width: thin;
			scrollbar-gutter: stable;
		}

		.admin-scrollbar::-webkit-scrollbar {
			width: 10px;
		}

		.admin-scrollbar::-webkit-scrollbar-track {
			background: transparent;
		}

		.admin-scrollbar::-webkit-scrollbar-thumb {
			border: 3px solid transparent;
			border-radius: 999px;
			background: color-mix(in oklab, var(--primary) 55%, var(--muted));
			background-clip: padding-box;
		}

		.admin-scrollbar::-webkit-scrollbar-thumb:hover {
			background: var(--primary);
			background-clip: padding-box;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.maintenance-ready) {
			animation: none;
		}
	}
</style>
