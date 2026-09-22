<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import {
		ArrowRight,
		Circle,
		CircleCheck,
		Eye,
		EyeOff,
		LoaderCircle,
		LockKeyhole,
		Mail
	} from '$lib/components/ui/icons';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { PageProps, SubmitFunction } from './$types';

	let { form }: PageProps = $props();
	const initialForm = untrack(() => form);
	let email = $state(initialForm?.values?.email ?? '');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let emailFocused = $state(false);
	let emailTouched = $state(false);
	let newPasswordFocused = $state(false);
	let newPasswordTouched = $state(false);
	let confirmPasswordFocused = $state(false);
	let confirmPasswordTouched = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let submitting = $state(false);

	const emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email));
	const emailError = $derived(
		fieldError('email') ??
			(emailTouched && email.length > 0 && !emailValid
				? 'Please enter a valid email address.'
				: undefined)
	);
	const passwordChecks = $derived([
		{ label: 'At least 8 characters', valid: newPassword.length >= 8 },
		{
			label: 'Password is too long. Use no more than 55 characters.',
			valid: newPassword.length <= 55
		},
		{ label: '1 uppercase letter', valid: /[A-Z]/.test(newPassword) },
		{ label: '1 lowercase letter', valid: /[a-z]/.test(newPassword) },
		{ label: '1 number', valid: /[0-9]/.test(newPassword) }
	]);
	const passedChecks = $derived(passwordChecks.filter((check) => check.valid).length);
	const unmetPasswordChecks = $derived(passwordChecks.filter((check) => !check.valid));
	const passwordValid = $derived(passedChecks === passwordChecks.length);
	const passwordTooLong = $derived(newPassword.length > 55);
	const passwordsMatch = $derived(confirmPassword.length > 0 && newPassword === confirmPassword);
	const passwordProgress = $derived((passedChecks / passwordChecks.length) * 100);
	const formValid = $derived(emailValid && passwordValid && passwordsMatch);
	const formStarted = $derived(
		email.length > 0 || newPassword.length > 0 || confirmPassword.length > 0
	);
	const formProgress = $derived(
		(emailValid ? 34 : 0) + (passwordValid ? 33 : 0) + (passwordsMatch ? 33 : 0)
	);
	const newPasswordError = $derived(
		fieldError('newPassword') ??
			(newPasswordTouched && newPassword.length === 0 ? 'Please enter a new password.' : undefined)
	);
	const confirmPasswordError = $derived(
		fieldError('confirmPassword') ??
			(confirmPasswordTouched && confirmPassword.length === 0
				? 'Please confirm your new password.'
				: confirmPassword.length > 0 && !passwordsMatch
					? 'Passwords do not match.'
					: undefined)
	);
	const resetSucceeded = $derived(form?.success === true);

	function fieldError(name: 'email' | 'newPassword' | 'confirmPassword'): string | undefined {
		const errors = form?.errors as Record<string, unknown> | undefined;
		return typeof errors?.[name] === 'string' ? errors[name] : undefined;
	}

	const enhanceReset: SubmitFunction = ({ cancel }) => {
		if (!formValid || submitting) {
			cancel();
			return;
		}
		submitting = true;
		const toastId = toast.loading('Resetting your password...');
		return async ({ result, update }) => {
			try {
				await update({ reset: false });
				if (result.type === 'success') {
					toast.success('Password reset successfully.', { id: toastId });
					window.setTimeout(() => window.location.assign(resolve('/login')), 1200);
				} else {
					const message =
						result.type === 'failure' && typeof result.data?.message === 'string'
							? result.data.message
							: 'We could not reset your password. Please try again.';
					toast.error(message, { id: toastId });
				}
			} finally {
				submitting = false;
			}
		};
	};
</script>

<svelte:head>
	<title>Reset Password | Linkpluse</title>
	<meta name="description" content="Create a new password for your Linkpluse account." />
</svelte:head>

<main
	class="flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6"
>
	<section
		class="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-lg"
		aria-labelledby="forgot-password-heading"
	>
		{#if formStarted}
			<div
				class="absolute top-0 left-0 h-1 transition-[width,background-color] duration-300 ease-in-out"
				class:bg-emerald-500={formProgress === 100}
				class:bg-primary={formProgress < 100}
				style:width={`${formProgress}%`}
			></div>
		{/if}
		<div class="p-6 sm:p-8">
			<header class="mb-8 text-center">
				<div
					class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
				>
					<KeyRound class="size-6" aria-hidden="true" />
				</div>
				<h1 id="forgot-password-heading" class="mb-2 text-3xl font-semibold tracking-tight">
					Reset your password
				</h1>
				<p class="mx-auto max-w-xs text-sm leading-6 text-muted-foreground">
					Enter your registered email address and create your new password.
				</p>
			</header>

			{#if resetSucceeded}
				<div class="space-y-6 text-center" role="status">
					<div
						class="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800"
					>
						<CircleCheck class="mx-auto mb-3 size-7" aria-hidden="true" />
						<p>{form?.message}</p>
					</div>
					<a
						class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
						href={resolve('/login')}
						><ArrowLeft class="size-4" aria-hidden="true" /> Back to Log In</a
					>
				</div>
			{:else}
				<form method="POST" class="space-y-5" novalidate use:enhance={enhanceReset}>
					<div class="space-y-2">
						<div class="relative">
							<Mail
								class={[
									'absolute left-3 size-4.5 -translate-y-1/2 text-muted-foreground opacity-50 transition-[top] duration-200',
									emailFocused || email.length > 0 ? 'top-[60%]' : 'top-1/2'
								]}
								aria-hidden="true"
							/>
							<Input
								id="forgot-password-email"
								name="email"
								type="email"
								autocomplete="email"
								required
								bind:value={email}
								onfocus={() => {
									emailFocused = true;
									emailTouched = false;
								}}
								onblur={() => {
									emailFocused = false;
									emailTouched = true;
								}}
								aria-invalid={Boolean(emailError)}
								aria-describedby={emailError ? 'forgot-password-email-error' : undefined}
								class="h-12 rounded-lg border-input bg-background pt-4 pr-4 pb-1.5 pl-10 text-body-base text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive"
							/>
							<Label
								for="forgot-password-email"
								class={[
									'pointer-events-none absolute z-10 -translate-y-1/2 transition-all duration-200 ease-out',
									emailFocused || email.length > 0
										? `top-0 left-3 bg-background px-1 text-label-caps leading-4 font-semibold tracking-wide ${emailError ? 'text-destructive' : emailFocused ? 'text-primary' : 'text-muted-foreground'}`
										: 'top-1/2 left-10 text-body-base text-muted-foreground/70'
								]}>Email <span class="text-destructive" aria-hidden="true">*</span></Label
							>
						</div>
						{#if emailError}<p
								id="forgot-password-email-error"
								class="mt-1 text-body-sm text-destructive"
							>
								{emailError}
							</p>{/if}
					</div>

					<div class="space-y-2">
						<div class="relative">
							<LockKeyhole
								class={[
									'absolute left-3 size-4.5 -translate-y-1/2 text-muted-foreground opacity-50 transition-[top] duration-200',
									newPasswordFocused || newPassword.length > 0 ? 'top-[60%]' : 'top-1/2'
								]}
								aria-hidden="true"
							/>
							<Input
								id="new-password"
								name="newPassword"
								type={showNewPassword ? 'text' : 'password'}
								autocomplete="new-password"
								required
								bind:value={newPassword}
								onfocus={() => {
									newPasswordFocused = true;
									newPasswordTouched = false;
								}}
								onblur={() => {
									newPasswordFocused = false;
									newPasswordTouched = true;
								}}
								aria-invalid={Boolean(newPasswordError)}
								aria-describedby={newPasswordError ? 'new-password-error' : undefined}
								class="h-12 rounded-lg border-input bg-background pt-4 pr-10 pb-1.5 pl-10 font-mono text-code-base text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive"
							/>
							<Label
								for="new-password"
								class={[
									'pointer-events-none absolute z-10 -translate-y-1/2 transition-all duration-200 ease-out',
									newPasswordFocused || newPassword.length > 0
										? `top-0 left-3 bg-background px-1 text-label-caps leading-4 font-semibold tracking-wide ${newPasswordError ? 'text-destructive' : newPasswordFocused ? 'text-primary' : 'text-muted-foreground'}`
										: 'top-1/2 left-10 text-body-base text-muted-foreground/70'
								]}>New password <span class="text-destructive" aria-hidden="true">*</span></Label
							>
							<button
								type="button"
								class={[
									'absolute right-3 -translate-y-1/2 text-muted-foreground transition-[top,color] duration-200 hover:text-foreground',
									newPasswordFocused || newPassword.length > 0 ? 'top-[60%]' : 'top-1/2'
								]}
								onclick={() => (showNewPassword = !showNewPassword)}
								aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
								>{#if showNewPassword}<EyeOff class="size-4.5" />{:else}<Eye
										class="size-4.5"
									/>{/if}</button
							>
						</div>
						{#if newPassword.length > 0 && !passwordValid}
							<div id="new-password-rules" class="mt-3 space-y-2">
								<div
									class="h-1.5 overflow-hidden rounded-full bg-surface-container-highest"
									role="progressbar"
									aria-label="Password requirements completed"
									aria-valuemin="0"
									aria-valuemax="100"
									aria-valuenow={passwordProgress}
								>
									<div
										class="h-full transition-[width,background-color] duration-300"
										class:bg-red-500={passwordTooLong}
										class:bg-primary={!passwordTooLong}
										style:width={`${passwordProgress}%`}
									></div>
								</div>
								<div class="grid grid-cols-2 gap-x-2 gap-y-1 text-body-sm text-muted-foreground">
									{#each unmetPasswordChecks as check (check.label)}
										<div
											class="flex items-center gap-1.5 text-destructive transition-colors duration-200"
										>
											<Circle class="size-3.5" aria-hidden="true" />
											<span>{check.label}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
						{#if newPasswordError}<p id="new-password-error" class="text-body-sm text-destructive">
								{newPasswordError}
							</p>{/if}
					</div>

					<div class="space-y-2">
						<div class="relative">
							<LockKeyhole
								class={[
									'absolute left-3 size-4.5 -translate-y-1/2 text-muted-foreground opacity-50 transition-[top] duration-200',
									confirmPasswordFocused || confirmPassword.length > 0 ? 'top-[60%]' : 'top-1/2'
								]}
								aria-hidden="true"
							/>
							<Input
								id="confirm-password"
								name="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								autocomplete="off"
								data-1p-ignore
								data-lpignore="true"
								required
								bind:value={confirmPassword}
								onfocus={() => {
									confirmPasswordFocused = true;
									confirmPasswordTouched = false;
								}}
								onblur={() => {
									confirmPasswordFocused = false;
									confirmPasswordTouched = true;
								}}
								aria-invalid={Boolean(confirmPasswordError)}
								aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
								class="h-12 rounded-lg border-input bg-background pt-4 pr-10 pb-1.5 pl-10 font-mono text-code-base text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive"
							/>
							<Label
								for="confirm-password"
								class={[
									'pointer-events-none absolute z-10 -translate-y-1/2 transition-all duration-200 ease-out',
									confirmPasswordFocused || confirmPassword.length > 0
										? `top-0 left-3 bg-background px-1 text-label-caps leading-4 font-semibold tracking-wide ${confirmPasswordError ? 'text-destructive' : confirmPasswordFocused ? 'text-primary' : 'text-muted-foreground'}`
										: 'top-1/2 left-10 text-body-base text-muted-foreground/70'
								]}
								>Confirm new password <span class="text-destructive" aria-hidden="true">*</span
								></Label
							>
							<button
								type="button"
								class={[
									'absolute right-3 -translate-y-1/2 text-muted-foreground transition-[top,color] duration-200 hover:text-foreground',
									confirmPasswordFocused || confirmPassword.length > 0 ? 'top-[60%]' : 'top-1/2'
								]}
								onclick={() => (showConfirmPassword = !showConfirmPassword)}
								aria-label={showConfirmPassword
									? 'Hide confirmed password'
									: 'Show confirmed password'}
								>{#if showConfirmPassword}<EyeOff class="size-4.5" />{:else}<Eye
										class="size-4.5"
									/>{/if}</button
							>
						</div>
						{#if confirmPasswordError}<p
								id="confirm-password-error"
								class="text-body-sm text-destructive"
							>
								{confirmPasswordError}
							</p>{/if}
					</div>

					<Button
						type="submit"
						disabled={!formValid || submitting}
						class="group h-auto w-full rounded-lg bg-primary px-4 py-3 text-body-base font-medium text-primary-foreground shadow-md enabled:hover:bg-primary/90 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:shadow-none"
						>{#if submitting}<LoaderCircle class="size-4 animate-spin" aria-hidden="true" /> Resetting...{:else}Reset
							Password <ArrowRight
								class="size-4 transition-transform group-hover:translate-x-1"
								aria-hidden="true"
							/>{/if}</Button
					>
				</form>
				<p class="mt-7 text-center">
					<a
						class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
						href={resolve('/login')}
						><ArrowLeft class="size-4" aria-hidden="true" /> Back to Log In</a
					>
				</p>
			{/if}
		</div>
	</section>
</main>
