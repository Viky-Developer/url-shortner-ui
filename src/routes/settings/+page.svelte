<script lang="ts">
	import { enhance } from '$app/forms';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Moon from '@lucide/svelte/icons/moon';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import UserRound from '@lucide/svelte/icons/user-round';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';
	import { toast } from 'svelte-sonner';
	import type { PageProps, SubmitFunction } from './$types';

	let { data }: PageProps = $props();
	let scheduling = $state(false);
	let restoring = $state(false);
	let confirmingDeletion = $state(false);
	let changingPassword = $state(false);
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	const passwordPattern = '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,55}';
	const newPasswordValid = $derived(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,55}$/.test(newPassword));
	const passwordsMatch = $derived(newPassword === confirmPassword);
	const passwordIsDifferent = $derived(currentPassword !== newPassword);
	const passwordFormValid = $derived(
		currentPassword.length > 0 &&
			newPasswordValid &&
			confirmPassword.length > 0 &&
			passwordsMatch &&
			passwordIsDifferent
	);
	const pendingDeletion = $derived(data.user?.status?.toUpperCase() === 'PENDING_DELETION');

	function accountAction(setBusy: (busy: boolean) => void, fallback: string): SubmitFunction {
		return () => {
			setBusy(true);
			return async ({ result, update }) => {
				try {
					await update();
					if (result.type === 'success' && typeof result.data?.success === 'string') {
						toast.success(result.data.success);
					} else if (result.type === 'failure' && typeof result.data?.error === 'string') {
						toast.error(result.data.error);
					} else if (result.type === 'error') {
						toast.error(fallback);
					}
				} finally {
					setBusy(false);
				}
			};
		};
	}

	const scheduleDeletion: SubmitFunction = () => {
		scheduling = true;
		return async ({ result, update }) => {
			try {
				if (
					result.type === 'success' &&
					typeof result.data?.success === 'string' &&
					'redirectTo' in result.data &&
					typeof result.data.redirectTo === 'string'
				) {
					const redirectTo = result.data.redirectTo;
					const delay =
						'redirectDelayMs' in result.data && typeof result.data.redirectDelayMs === 'number'
							? result.data.redirectDelayMs
							: 2000;
					toast.success(result.data.success, { duration: delay });
					setTimeout(() => window.location.assign(redirectTo), delay);
					return;
				}

				await update();
				if (result.type === 'failure' && typeof result.data?.error === 'string') {
					toast.error(result.data.error);
				} else if (result.type === 'error') {
					toast.error('Unable to schedule account deletion. Please try again.');
				}
			} finally {
				scheduling = false;
			}
		};
	};
	const restoreAccount = accountAction(
		(value) => (restoring = value),
		'Unable to restore your account. Please try again.'
	);
</script>

<svelte:head>
	<title>Account Settings | Linkflow</title>
	<meta name="description" content="Manage your Linkflow account and security preferences." />
</svelte:head>

<section class="mx-auto max-w-3xl space-y-6" aria-labelledby="settings-heading">
	<header>
		<h1 id="settings-heading" class="text-2xl font-semibold tracking-tight text-foreground">
			Account Settings
		</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Manage your security preferences and profile details.
		</p>
	</header>

	{#if data.user?.changeSuggested === true}
		<div
			class="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300"
			role="status"
		>
			<CircleAlert class="mt-0.5 size-5 shrink-0" />
			<div>
				<h2 class="text-sm font-semibold">Password update recommended</h2>
				<p class="mt-1 text-xs leading-5 opacity-80">
					Keep your account secure by changing your password regularly.
				</p>
			</div>
		</div>
	{/if}

	<section class="rounded-xl border border-border bg-card p-6" aria-labelledby="profile-heading">
		<div class="flex items-start justify-between gap-4">
			<div class="flex gap-3">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
					><UserRound class="size-4" /></span
				>
				<div>
					<h2 id="profile-heading" class="font-semibold text-foreground">Profile Information</h2>
					<p class="mt-1 text-xs text-muted-foreground">Your account identity</p>
				</div>
			</div>
			<span
				class="rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase"
				>Read only</span
			>
		</div>
		<dl class="mt-5 grid gap-4">
			<div>
				<dt class="text-xs font-medium text-muted-foreground">Display name</dt>
				<dd
					class="mt-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-foreground"
				>
					{data.user?.displayName ?? 'User'}
				</dd>
			</div>
			<div>
				<dt class="text-xs font-medium text-muted-foreground">Email address</dt>
				<dd
					class="mt-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-foreground"
				>
					{data.user?.email ?? 'Not available'}
				</dd>
			</div>
		</dl>
	</section>

	<section class="rounded-xl border border-border bg-card p-6" aria-labelledby="appearance-heading">
		<div class="flex items-center justify-between gap-5">
			<div class="flex gap-3">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
					><Moon class="size-4" /></span
				>
				<div>
					<h2 id="appearance-heading" class="font-semibold text-foreground">Appearance</h2>
					<p class="mt-1 text-xs text-muted-foreground">Switch between light and dark themes.</p>
				</div>
			</div>
			<ThemeToggle class="shrink-0" />
		</div>
	</section>

	<section class="rounded-xl border border-border bg-card p-6" aria-labelledby="password-heading">
		<div class="flex gap-3">
			<span
				class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
				><KeyRound class="size-4" /></span
			>
			<div>
				<h2 id="password-heading" class="font-semibold text-foreground">Change Password</h2>
				<p class="mt-1 text-xs text-muted-foreground">
					Choose a unique password you do not use elsewhere.
				</p>
			</div>
		</div>
		<form
			method="POST"
			action="?/changePassword"
			use:enhance={() => {
				changingPassword = true;
				return async ({ result, update }) => {
					await update({ reset: result.type === 'success' });
					if (result.type === 'success') {
						currentPassword = '';
						newPassword = '';
						confirmPassword = '';
						if (typeof result.data?.success === 'string') toast.success(result.data.success);
					} else if (result.type === 'failure' && typeof result.data?.error === 'string') {
						toast.error(result.data.error);
					} else if (result.type === 'error') {
						toast.error('Unable to change your password. Please try again.');
					}
					changingPassword = false;
				};
			}}
		>
			<div class="mt-5 grid gap-4">
				<label class="grid gap-1.5 text-xs font-medium text-muted-foreground">
					Current password
					<span class="relative">
						<input
							type={showCurrentPassword ? 'text' : 'password'}
							name="currentPassword"
							autocomplete="current-password"
							required
							bind:value={currentPassword}
							placeholder="Enter your current password"
							class="h-10 w-full rounded-lg border border-input bg-background px-3 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground"
							onclick={() => (showCurrentPassword = !showCurrentPassword)}
							aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
						>
							{#if showCurrentPassword}<EyeOff class="size-4" />{:else}<Eye class="size-4" />{/if}
						</button>
					</span>
				</label>
				<label class="grid gap-1.5 text-xs font-medium text-muted-foreground">
					New password
					<span class="relative">
						<input
							type={showNewPassword ? 'text' : 'password'}
							name="newPassword"
							autocomplete="new-password"
							required
							minlength="8"
							maxlength="55"
							pattern={passwordPattern}
							bind:value={newPassword}
							aria-invalid={newPassword.length > 0 && (!newPasswordValid || !passwordIsDifferent)}
							placeholder="Enter a new password"
							class="h-10 w-full rounded-lg border border-input bg-background px-3 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground"
							onclick={() => (showNewPassword = !showNewPassword)}
							aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
						>
							{#if showNewPassword}<EyeOff class="size-4" />{:else}<Eye class="size-4" />{/if}
						</button>
					</span>
				</label>
				{#if newPassword.length > 0 && !newPasswordValid}
					<p class="text-xs text-destructive">
						Use 8–55 characters with uppercase, lowercase, and a number.
					</p>
				{:else if newPassword.length > 0 && !passwordIsDifferent}
					<p class="text-xs text-destructive">
						New password must be different from your current password.
					</p>
				{/if}
				<label class="grid gap-1.5 text-xs font-medium text-muted-foreground">
					Confirm new password
					<span class="relative">
						<input
							type={showConfirmPassword ? 'text' : 'password'}
							name="confirmPassword"
							autocomplete="new-password"
							required
							minlength="8"
							maxlength="55"
							pattern={passwordPattern}
							bind:value={confirmPassword}
							aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
							placeholder="Confirm your new password"
							class="h-10 w-full rounded-lg border border-input bg-background px-3 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground"
							onclick={() => (showConfirmPassword = !showConfirmPassword)}
							aria-label={showConfirmPassword
								? 'Hide password confirmation'
								: 'Show password confirmation'}
						>
							{#if showConfirmPassword}<EyeOff class="size-4" />{:else}<Eye class="size-4" />{/if}
						</button>
					</span>
				</label>
				{#if confirmPassword.length > 0 && !passwordsMatch}
					<p class="text-xs text-destructive">New password and confirmation do not match.</p>
				{/if}
			</div>
			<div class="mt-5 flex justify-end border-t border-border pt-5">
				<button
					type="submit"
					disabled={!passwordFormValid || changingPassword}
					class="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if changingPassword}<LoaderCircle class="size-4 animate-spin" />{/if}
					{changingPassword ? 'Saving…' : 'Save changes'}
				</button>
			</div>
		</form>
	</section>

	<section
		class="rounded-xl border border-destructive/30 bg-destructive/3 p-6"
		aria-labelledby="danger-heading"
	>
		<div class="flex gap-3">
			<span
				class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
				><Trash2 class="size-4" /></span
			>
			<div>
				<h2 id="danger-heading" class="font-semibold text-destructive">Danger Zone</h2>
				<p class="mt-1 text-xs text-muted-foreground">Irreversible actions for your account.</p>
			</div>
		</div>
		<div class="mt-5 rounded-lg border border-destructive/20 bg-background/60 p-4">
			{#if pendingDeletion}
				<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<h3 class="text-sm font-medium text-foreground">Deletion scheduled</h3>
						<p class="mt-1 text-xs leading-5 text-muted-foreground">
							Your account will be deleted after the 30-day grace period. Restore it to keep your
							data.
						</p>
					</div>
					<form method="POST" action="?/cancelDeletion" use:enhance={restoreAccount}>
						<button
							type="submit"
							disabled={restoring}
							class="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
							>{#if restoring}<LoaderCircle class="size-4 animate-spin" />{:else}<RotateCcw
									class="size-4"
								/>{/if}{restoring ? 'Restoring…' : 'Restore account'}</button
						>
					</form>
				</div>
			{:else}
				<div class="space-y-4">
					<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
						<div class="max-w-md">
							<h3 class="text-sm font-medium text-foreground">Delete account</h3>
							<p class="mt-1 text-xs leading-5 text-muted-foreground">
								This starts a 30-day grace period. Your account is not deleted immediately and can
								be restored during that time.
							</p>
						</div>
						{#if !confirmingDeletion}
							<button
								type="button"
								onclick={() => (confirmingDeletion = true)}
								class="text-destructive-foreground inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium"
								><Trash2 class="size-4" />Delete account</button
							>
						{/if}
					</div>
					{#if confirmingDeletion}
						<form
							method="POST"
							action="?/scheduleDeletion"
							class="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
							use:enhance={scheduleDeletion}
						>
							<p class="text-sm text-foreground">
								To confirm deletion, type <strong>delete my account</strong> in the box below.
							</p>
							<label
								for="delete-confirmation"
								class="mt-3 block text-xs font-medium text-muted-foreground"
								>Confirmation phrase</label
							><input
								id="delete-confirmation"
								name="confirmation"
								required
								pattern="delete my account"
								autocomplete="off"
								placeholder="delete my account"
								class="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-destructive focus-visible:ring-3 focus-visible:ring-destructive/20"
							/>
							<div class="mt-4 flex justify-end gap-3">
								<button
									type="button"
									onclick={() => (confirmingDeletion = false)}
									class="h-9 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
									>Cancel</button
								><button
									type="submit"
									disabled={scheduling}
									class="text-destructive-foreground inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium disabled:opacity-50"
									>{#if scheduling}<LoaderCircle class="size-4 animate-spin" />{:else}<Trash2
											class="size-4"
										/>{/if}{scheduling ? 'Scheduling…' : 'Confirm deletion'}</button
								>
							</div>
						</form>
					{/if}
				</div>
			{/if}
		</div>
	</section>
</section>
