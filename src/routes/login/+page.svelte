<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import {
		ArrowRight,
		CircleCheck,
		Eye,
		EyeOff,
		LoaderCircle,
		LockKeyhole,
		LogIn,
		Mail
	} from '$lib/components/ui/icons';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { PageProps, SubmitFunction } from './$types';

	let { form }: PageProps = $props();
	const initialForm = untrack(() => form);

	let email = $state(initialForm?.values?.email ?? '');
	let password = $state('');
	let emailFocused = $state(false);
	let passwordFocused = $state(false);
	let emailTouched = $state(false);
	let passwordTouched = $state(false);
	let showPassword = $state(false);
	let submitting = $state(false);
	let submitted = $state(initialForm?.success === true);

	const emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email));
	const serverEmailError = $derived(
		form?.errors && 'email' in form.errors && typeof form.errors.email === 'string'
			? form.errors.email
			: undefined
	);
	const serverPasswordError = $derived(
		form?.errors && 'password' in form.errors && typeof form.errors.password === 'string'
			? form.errors.password
			: undefined
	);
	const emailError = $derived(
		serverEmailError ??
			(emailTouched && email.length > 0 && !emailValid
				? 'Please enter a valid email address.'
				: undefined)
	);
	const passwordError = $derived(
		serverPasswordError ??
			(passwordTouched && password.length === 0 ? 'Please enter your password.' : undefined)
	);
	const formValid = $derived(emailValid && password.length > 0);
	const formProgress = $derived((emailValid ? 50 : 0) + (password.length > 0 ? 50 : 0));
	const loginSucceeded = $derived(submitted || form?.success === true);
	const submitDisabled = $derived(!formValid || submitting || loginSucceeded);

	function signInErrorMessage(status: number): string {
		if (status === 401 || status === 403) return 'The email or password is incorrect.';
		if (status === 409) return 'An active session is preventing sign-in. Please try again.';
		if (status === 429) return 'Too many sign-in attempts. Please wait and try again.';
		if (status >= 500) return 'We could not sign you in right now. Please try again.';
		return 'Please check your credentials and try again.';
	}

	const enhanceLogin: SubmitFunction = ({ cancel }) => {
		if (!formValid || submitting) {
			cancel();
			return;
		}

		submitting = true;
		submitted = false;
		const toastId = toast.loading('Signing you in...');

		return async ({ result, update }) => {
			try {
				submitted = result.type === 'success';
				if (submitted && result.type === 'success') {
					const redirectTo =
						typeof result.data?.redirectTo === 'string' ? result.data.redirectTo : resolve('/');
					toast.success('Signed in successfully.', { id: toastId });
					window.location.assign(redirectTo);
					return;
				}

				toast.error(signInErrorMessage(result.status ?? 500), { id: toastId });
				await update({ reset: false });
			} catch {
				toast.error('We could not complete sign-in. Please try again.', { id: toastId });
			} finally {
				submitting = false;
			}
		};
	};
</script>

<svelte:head>
	<title>Sign In | Linkflow</title>
	<meta name="description" content="Sign in to manage your Linkflow links and analytics." />
</svelte:head>

<main
	class="flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6"
>
	<section
		class="relative w-full max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
		aria-labelledby="login-heading"
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
						<LogIn class="size-6" aria-hidden="true" />
					</div>
				</div>
				<h1 id="login-heading" class="mb-2 text-3xl font-semibold tracking-tight">Sign In</h1>
				<p class="text-sm text-muted-foreground">Welcome back to Linkflow.</p>
			</header>

			<form method="POST" class="space-y-6" novalidate use:enhance={enhanceLogin}>
				<p class="text-right text-xs text-muted-foreground">
					<span class="font-semibold text-destructive" aria-hidden="true">*</span> Required fields
				</p>

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
							id="login-email"
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
							aria-describedby={emailError ? 'login-email-error' : undefined}
							class="h-12 rounded-lg border-zinc-200 bg-white pt-4 pr-4 pb-1.5 pl-10 text-body-base text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive"
						/>
						<Label
							for="login-email"
							class={[
								'pointer-events-none absolute z-10 -translate-y-1/2 transition-all duration-200 ease-out',
								emailFocused || email.length > 0
									? `top-0 left-3 bg-white px-1 text-label-caps leading-4 font-semibold tracking-wide ${emailError ? 'text-destructive' : emailFocused ? 'text-primary' : 'text-muted-foreground'}`
									: 'top-1/2 left-10 text-body-base text-muted-foreground/70'
							]}
						>
							Email <span class="text-destructive" aria-hidden="true">*</span>
						</Label>
					</div>
					{#if emailError}
						<p id="login-email-error" class="mt-1 text-body-sm text-destructive">{emailError}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<div class="relative">
						<LockKeyhole
							class={[
								'absolute left-3 size-4.5 -translate-y-1/2 text-muted-foreground opacity-50 transition-[top] duration-200',
								passwordFocused || password.length > 0 ? 'top-[60%]' : 'top-1/2'
							]}
							aria-hidden="true"
						/>
						<Input
							id="login-password"
							data-testid="login-password-input"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							required
							bind:value={password}
							onfocus={() => {
								passwordFocused = true;
								passwordTouched = false;
							}}
							onblur={() => {
								passwordFocused = false;
								passwordTouched = true;
							}}
							aria-invalid={Boolean(passwordError)}
							aria-describedby={passwordError ? 'login-password-error' : undefined}
							class="h-12 rounded-lg border-zinc-200 bg-white pt-4 pr-10 pb-1.5 pl-10 font-mono text-code-base text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive"
						/>
						<Label
							for="login-password"
							class={[
								'pointer-events-none absolute z-10 -translate-y-1/2 transition-all duration-200 ease-out',
								passwordFocused || password.length > 0
									? `top-0 left-3 bg-white px-1 text-label-caps leading-4 font-semibold tracking-wide ${passwordError ? 'text-destructive' : passwordFocused ? 'text-primary' : 'text-muted-foreground'}`
									: 'top-1/2 left-10 text-body-base text-muted-foreground/70'
							]}
						>
							Password <span class="text-destructive" aria-hidden="true">*</span>
						</Label>
						<button
							type="button"
							class={[
								'absolute right-3 -translate-y-1/2 text-muted-foreground transition-[top,color] duration-200 hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring',
								passwordFocused || password.length > 0 ? 'top-[60%]' : 'top-1/2'
							]}
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
					{#if passwordError}
						<p id="login-password-error" class="mt-1 text-body-sm text-destructive">
							{passwordError}
						</p>
					{/if}
				</div>

				<Button
					type="submit"
					disabled={submitDisabled}
					class="group relative h-auto w-full overflow-hidden rounded-lg bg-primary px-4 py-3 text-body-base font-medium text-primary-foreground shadow-md transition-all duration-200 enabled:hover:bg-primary/90 enabled:hover:shadow-lg disabled:pointer-events-auto disabled:cursor-not-allowed disabled:shadow-none"
				>
					<span
						class={[
							'absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 ease-in-out',
							!submitDisabled && 'group-hover:translate-y-0'
						]}
					></span>
					{#if submitting}
						<LoaderCircle class="relative z-10 size-4.5 animate-spin" aria-hidden="true" />
						<span class="relative z-10">Signing In...</span>
					{:else if loginSucceeded}
						<CircleCheck class="relative z-10 size-4.5" aria-hidden="true" />
						<span class="relative z-10">Signed In</span>
					{:else}
						<span class="relative z-10">Sign In</span>
						<ArrowRight
							class={[
								'relative z-10 size-4.5 transition-transform',
								!submitDisabled && 'group-hover:translate-x-1'
							]}
							aria-hidden="true"
						/>
					{/if}
				</Button>
			</form>

			<p class="mt-6 text-center text-body-sm text-muted-foreground">
				Need an account?
				<a
					class="border-b border-transparent font-medium text-primary transition-colors hover:border-primary hover:text-primary/90"
					href={resolve('/signup')}
				>
					Create account
				</a>
			</p>
		</div>
	</section>
</main>
