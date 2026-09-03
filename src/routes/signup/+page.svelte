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
		IdCard,
		LoaderCircle,
		LockKeyhole,
		Mail,
		UserRoundPlus
	} from '$lib/components/ui/icons';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { PageProps, SubmitFunction } from './$types';

	let { form }: PageProps = $props();
	const initialForm = untrack(() => form);

	let displayName = $state(initialForm?.values?.displayName ?? '');
	let email = $state(initialForm?.values?.email ?? '');
	let password = $state('');
	let emailTouched = $state(false);
	let showPassword = $state(false);
	let submitting = $state(false);
	let submitted = $state(initialForm?.success === true);

	const emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email));
	const passwordChecks = $derived([
		{ label: 'At least 8 characters', valid: password.length >= 8 },
		{
			label: 'Password is too long. Use no more than 55 characters.',
			valid: password.length <= 55
		},
		{ label: '1 uppercase letter', valid: /[A-Z]/.test(password) },
		{ label: '1 lowercase letter', valid: /[a-z]/.test(password) },
		{ label: '1 number', valid: /[0-9]/.test(password) }
	]);
	const passedPasswordChecks = $derived(passwordChecks.filter((check) => check.valid).length);
	const unmetPasswordChecks = $derived(passwordChecks.filter((check) => !check.valid));
	const passwordValid = $derived(passedPasswordChecks === passwordChecks.length);
	const passwordTooLong = $derived(password.length > 55);
	const formValid = $derived(emailValid && passwordValid);
	const formProgress = $derived((emailValid ? 50 : 0) + (passwordValid ? 50 : 0));
	const passwordProgress = $derived((passedPasswordChecks / passwordChecks.length) * 100);
	const serverEmailError = $derived(
		form?.errors && 'email' in form.errors && typeof form.errors.email === 'string'
			? form.errors.email
			: undefined
	);
	const emailError = $derived(
		serverEmailError ??
			(emailTouched && email.length > 0 && !emailValid
				? 'Please enter a valid email address.'
				: undefined)
	);
	const signupSucceeded = $derived(submitted || form?.success === true);

	function registrationErrorMessage(status: number): string {
		if (status === 409) return 'An account with this email already exists.';
		if (status === 429) return 'Too many signup attempts. Please wait and try again.';
		if (status >= 500) return 'We could not create your account right now. Please try again.';
		return 'Please check your account details and try again.';
	}

	const enhanceSignup: SubmitFunction = ({ cancel }) => {
		if (!formValid || submitting) {
			cancel();
			return;
		}

		submitting = true;
		submitted = false;
		const toastId = toast.loading('Creating your account...');

		return async ({ result, update }) => {
			try {
				submitted = result.type === 'success';
				if (submitted) {
					toast.success('Your account has been created successfully.', { id: toastId });
				} else {
					toast.error(registrationErrorMessage(result.status ?? 500), { id: toastId });
				}
				await update({ reset: false });
			} catch {
				toast.error('We could not complete your signup. Please try again.', { id: toastId });
			} finally {
				submitting = false;
			}
		};
	};
</script>

<svelte:head>
	<title>Create Account | Linkflow</title>
	<meta
		name="description"
		content="Create your Linkflow account to manage shortened links and analytics."
	/>
</svelte:head>

<main
	class="flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6"
>
	<section
		class="relative w-full max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
		aria-labelledby="signup-heading"
	>
		<div
			class="absolute top-0 left-0 h-1 transition-[width,background-color] duration-300 ease-in-out"
			class:bg-emerald-500={formProgress === 100}
			class:bg-primary={formProgress < 100}
			style:width={`${formProgress}%`}
		></div>

		<div class="p-6 sm:p-8">
			<header class="mb-8 text-center">
				<div class="mb-4 flex items-center justify-center">
					<div
						class="flex size-12 items-center justify-center rounded-full bg-primary text-sidebar-primary-foreground shadow-sm"
					>
						<UserRoundPlus class="size-6" aria-hidden="true" />
					</div>
				</div>
				<h1 id="signup-heading" class="mb-2 text-3xl font-semibold tracking-tight">
					Create Account
				</h1>
				<p class="text-sm text-muted-foreground">Create an account to get started.</p>
			</header>

			<form method="POST" class="space-y-6" novalidate use:enhance={enhanceSignup}>
				<div class="space-y-2">
					<Label
						for="display-name"
						class="block text-label-caps leading-4 font-semibold tracking-wider text-muted-foreground uppercase"
					>
						Display Name <span class="font-normal normal-case">(optional)</span>
					</Label>
					<div class="relative">
						<IdCard
							class="absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground opacity-50"
							aria-hidden="true"
						/>
						<Input
							id="display-name"
							name="displayName"
							type="text"
							autocomplete="name"
							placeholder="Jane Doe"
							bind:value={displayName}
							class="h-auto rounded-lg border-zinc-200 bg-muted py-2.5 pr-4 pl-10 text-body-base text-foreground shadow-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label
						for="email"
						class="block text-label-caps leading-4 font-semibold tracking-wider text-muted-foreground uppercase"
					>
						Email
					</Label>
					<div class="relative">
						<Mail
							class="absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground opacity-50"
							aria-hidden="true"
						/>
						<Input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							placeholder="you@example.com"
							required
							bind:value={email}
							onfocus={() => (emailTouched = false)}
							onblur={() => (emailTouched = true)}
							aria-invalid={Boolean(emailError)}
							aria-describedby="email-error"
							class="h-auto rounded-lg border-zinc-200 bg-muted py-2.5 pr-4 pl-10 text-body-base text-foreground shadow-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive"
						/>
					</div>
					{#if emailError}
						<p id="email-error" class="mt-1 text-body-sm text-destructive">
							{emailError}
						</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label
						for="password"
						class="block text-label-caps leading-4 font-semibold tracking-wider text-muted-foreground uppercase"
					>
						Password
					</Label>
					<div class="relative">
						<LockKeyhole
							class="absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground opacity-50"
							aria-hidden="true"
						/>
						<Input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="new-password"
							placeholder="••••••••"
							minlength={8}
							pattern={'(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,55}'}
							required
							bind:value={password}
							aria-describedby={password.length > 0 && !passwordValid
								? 'password-rules'
								: undefined}
							aria-invalid={password.length > 0 && !passwordValid}
							class="h-auto rounded-lg border-zinc-200 bg-muted py-2.5 pr-10 pl-10 font-mono text-code-base text-foreground shadow-sm placeholder:font-sans placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive"
						/>
						<button
							type="button"
							class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<EyeOff class="size-4.5" aria-hidden="true" />
							{:else}
								<Eye class="size-4.5" aria-hidden="true" />
							{/if}
						</button>
					</div>

					{#if password.length > 0 && !passwordValid}
						<div id="password-rules" class="mt-3 space-y-2">
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
				</div>

				<div class="pt-2">
					<Button
						type="submit"
						disabled={!formValid || submitting || signupSucceeded}
						class="group relative h-auto w-full overflow-hidden rounded-lg bg-primary px-4 py-3 text-body-base font-medium text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none"
					>
						<span
							class="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 ease-in-out group-hover:translate-y-0"
						></span>
						{#if submitting}
							<LoaderCircle class="relative z-10 size-4.5 animate-spin" aria-hidden="true" />
							<span class="relative z-10">Creating Account...</span>
						{:else if signupSucceeded}
							<CircleCheck class="relative z-10 size-4.5" aria-hidden="true" />
							<span class="relative z-10">Account Created</span>
						{:else}
							<span class="relative z-10">Create Account</span>
							<ArrowRight
								class="relative z-10 size-4.5 transition-transform group-hover:translate-x-1"
								aria-hidden="true"
							/>
						{/if}
					</Button>
				</div>
			</form>

			<p class="mt-6 text-center text-body-sm text-muted-foreground">
				Already have an account?
				<a
					class="border-b border-transparent font-medium text-primary transition-colors hover:border-primary hover:text-primary/90"
					href={resolve('/#signin')}
				>
					Sign in
				</a>
			</p>
		</div>
	</section>
</main>
