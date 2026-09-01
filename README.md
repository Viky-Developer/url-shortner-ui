# url-shortner-ui

A URL shortener UI built with SvelteKit (Svelte 5), TypeScript, and TailwindCSS.

## Stack

- **Framework**: SvelteKit (Svelte 5)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Testing**: Vitest (unit), Playwright (e2e)
- **Linting**: ESLint + Prettier
- **Adapter**: sveltekit-adapter

## Developing

```sh
npm install
npm run dev
# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Testing

```sh
npm run test        # Vitest unit tests + Playwright e2e
npm run test:unit   # Vitest unit tests only
npm run test:e2e    # Playwright e2e tests
```

## Linting & Formatting

```sh
npm run lint    # Prettier check + ESLint
npm run format  # Prettier write
```
