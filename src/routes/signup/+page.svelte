<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import {
		ArrowRight,
		ChevronDown,
		Circle,
		CircleCheck,
		Eye,
		EyeOff,
		GoogleIcon,
		IdCard,
		LoaderCircle,
		LockKeyhole,
		Mail,
		UserRoundPlus
	} from '$lib/components/ui/icons';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import type { PageProps, SubmitFunction } from './$types';

	let { form }: PageProps = $props();
	const initialForm = untrack(() => form);

	let currentTab = $state<'signup' | 'login'>('signup');
	let showEmailForm = $state(
		Boolean(initialForm?.errors) ||
			Boolean(initialForm?.values?.email) ||
			Boolean(initialForm?.values?.displayName)
	);
	let displayName = $state(initialForm?.values?.displayName ?? '');
	let email = $state(initialForm?.values?.email ?? '');
	let password = $state('');
	let displayNameFocused = $state(false);
	let emailFocused = $state(false);
	let passwordFocused = $state(false);
	let emailTouched = $state(false);
	let showPassword = $state(false);
	let submitting = $state(false);
	let submitted = $state(initialForm?.success === true);

	const emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email));

	function switchTab(event: MouseEvent) {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}
		event.preventDefault();
		currentTab = 'login';
		setTimeout(() => {
			goto(resolve('/login'));
		}, 180);
	}
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
	const submitDisabled = $derived(!formValid || submitting || signupSucceeded);

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
					await goto(resolve('/dashboard'));
					return;
				}

				toast.error(registrationErrorMessage(result.status ?? 500), { id: toastId });
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
	<title>Create Account | Linkpluse</title>
	<meta
		name="description"
		content="Create your Linkpluse account to manage shortened links and analytics."
	/>
</svelte:head>

<main
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f7ff] p-4 text-foreground before:absolute before:inset-0 before:bg-[linear-gradient(to_right,rgba(99,102,241,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.055)_1px,transparent_1px)] before:bg-[size:32px_32px] after:absolute after:right-[-12rem] after:bottom-[-12rem] after:size-[34rem] after:rounded-full after:bg-violet-200/35 after:blur-3xl sm:p-6"
>
	<section
		class="relative z-10 w-full max-w-md overflow-hidden rounded-[1.35rem] border border-indigo-100 bg-white/95 shadow-[0_24px_70px_-28px_rgba(79,70,229,0.38)] backdrop-blur"
		aria-labelledby="signup-heading"
	>
		<div
			class="absolute top-0 left-0 h-1 transition-[width,background-color] duration-300 ease-in-out"
			class:bg-emerald-500={formProgress === 100}
			class:bg-primary={formProgress < 100}
			style:width={`${formProgress}%`}
		></div>

		<div class="p-6 sm:p-8">
			<header class="mb-6 text-center">
				<div class="mb-4 flex items-center justify-center">
					<div
						class="flex size-12 items-center justify-center rounded-full bg-primary text-sidebar-primary-foreground shadow-sm"
					>
						<UserRoundPlus class="size-6" aria-hidden="true" />
					</div>
				</div>
				<h1 id="signup-heading" class="mb-2 text-3xl font-bold tracking-tight text-zinc-950">
					Create your account
				</h1>
				<p class="mx-auto max-w-xs text-sm leading-6 text-zinc-500">
					Start shortening links, tracking clicks, and analyzing conversions.
				</p>
			</header>

			<nav
				class="relative mb-4 grid grid-cols-2 rounded-xl bg-zinc-100 p-1 select-none"
				aria-label="Authentication"
			>
				<div
					class={[
						'pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-200 ease-out',
						currentTab === 'login' ? 'translate-x-full' : 'translate-x-0'
					]}
					aria-hidden="true"
				></div>
				<span
					class={[
						'relative z-10 rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors duration-200',
						currentTab === 'signup' ? 'text-zinc-900' : 'text-zinc-500'
					]}
				>
					Create Account
				</span>
				<a
					href={resolve('/login')}
					class={[
						'relative z-10 rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors duration-200 hover:text-zinc-900',
						currentTab === 'login' ? 'text-zinc-900' : 'text-zinc-500'
					]}
					onclick={switchTab}
				>
					Sign In
				</a>
			</nav>

			<a
				href={resolve('/auth/google')}
				class="group flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-body-base font-semibold text-zinc-700 shadow-sm transition-all duration-200 ease-out hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.99]"
			>
				<GoogleIcon class="size-5 transition-transform duration-200 group-hover:scale-110" />
				Continue with Google
			</a>

			<div class="my-4 flex items-center gap-3" role="separator" aria-label="or">
				<div class="h-px flex-1 bg-zinc-200" aria-hidden="true"></div>
				<span class="text-xs font-medium tracking-wide text-zinc-400">or</span>
				<div class="h-px flex-1 bg-zinc-200" aria-hidden="true"></div>
			</div>

			<button
				type="button"
				class="group mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 ease-out hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.99]"
				onclick={() => (showEmailForm = !showEmailForm)}
				aria-expanded={showEmailForm}
				aria-controls="email-signup-form"
			>
				<Mail
					class="size-4 text-zinc-500 transition-transform duration-200 group-hover:scale-110 group-hover:text-indigo-600"
					aria-hidden="true"
				/>
				<span>Continue with Email</span>
				<ChevronDown
					class={[
						'size-4 text-zinc-500 transition-transform duration-200',
						showEmailForm && 'rotate-180'
					]}
					aria-hidden="true"
				/>
			</button>

			{#if showEmailForm}
				<div id="email-signup-form" transition:slide={{ duration: 250 }}>
					<form method="POST" class="space-y-4 pt-1" novalidate use:enhance={enhanceSignup}>
						<div>
							<div class="relative">
								<IdCard
									class={[
										'absolute left-3 size-4.5 -translate-y-1/2 text-muted-foreground opacity-50 transition-[top] duration-200',
										displayNameFocused || displayName.length > 0 ? 'top-[60%]' : 'top-1/2'
									]}
									aria-hidden="true"
								/>
								<Input
									id="display-name"
									name="displayName"
									type="text"
									autocomplete="name"
									bind:value={displayName}
									onfocus={() => (displayNameFocused = true)}
									onblur={() => (displayNameFocused = false)}
									class="h-12 rounded-lg border-zinc-200 bg-white pt-4 pr-4 pb-1.5 pl-10 text-body-base text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
								/>
								<Label
									for="display-name"
									class={[
										'pointer-events-none absolute z-10 -translate-y-1/2 transition-all duration-200 ease-out',
										displayNameFocused || displayName.length > 0
											? `top-0 left-3 bg-white px-1 text-label-caps leading-4 font-semibold tracking-wide ${displayNameFocused ? 'text-primary' : 'text-muted-foreground'}`
											: 'top-1/2 left-10 text-body-base text-muted-foreground/70'
									]}
								>
									Display Name
								</Label>
							</div>
						</div>

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
									id="email"
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
									aria-describedby="email-error"
									class="h-12 rounded-lg border-zinc-200 bg-white pt-4 pr-4 pb-1.5 pl-10 text-body-base text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive"
								/>
								<Label
									for="email"
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
								<p id="email-error" class="mt-1 text-body-sm text-destructive">
									{emailError}
								</p>
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
									id="password"
									data-testid="password-input"
									name="password"
									type={showPassword ? 'text' : 'password'}
									autocomplete="new-password"
									minlength={8}
									pattern={'(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,55}'}
									required
									bind:value={password}
									onfocus={() => (passwordFocused = true)}
									onblur={() => (passwordFocused = false)}
									aria-describedby={password.length > 0 && !passwordValid
										? 'password-rules'
										: undefined}
									aria-invalid={password.length > 0 && !passwordValid}
									class="h-12 rounded-lg border-zinc-200 bg-white pt-4 pr-10 pb-1.5 pl-10 font-mono text-code-base text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive"
								/>
								<Label
									for="password"
									class={[
										'pointer-events-none absolute z-10 -translate-y-1/2 transition-all duration-200 ease-out',
										passwordFocused || password.length > 0
											? `top-0 left-3 bg-white px-1 text-label-caps leading-4 font-semibold tracking-wide ${password.length > 0 && !passwordValid ? 'text-destructive' : passwordFocused ? 'text-primary' : 'text-muted-foreground'}`
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
								disabled={submitDisabled}
								class="group relative h-12 w-full overflow-hidden rounded-xl bg-primary px-4 py-3 text-body-base font-semibold text-primary-foreground shadow-md transition-all duration-200 enabled:hover:bg-primary/90 enabled:hover:shadow-lg disabled:pointer-events-auto disabled:cursor-not-allowed disabled:shadow-none"
							>
								<span
									class={[
										'absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 ease-in-out',
										!submitDisabled && 'group-hover:translate-y-0'
									]}
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
										class={[
											'relative z-10 size-4.5 transition-transform',
											!submitDisabled && 'group-hover:translate-x-1'
										]}
										aria-hidden="true"
									/>
								{/if}
							</Button>
						</div>
					</form>
				</div>
			{/if}

			<p class="mt-6 text-center text-body-sm text-muted-foreground">
				Already have an account?
				<a
					class="border-b border-transparent font-medium text-primary transition-colors hover:border-primary hover:text-primary/90"
					href={resolve('/login')}
				>
					Sign in
				</a>
			</p>
		</div>
	</section>
</main>
