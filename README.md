# Linkpluse UI

Linkpluse is a SvelteKit web application for creating, managing, and monitoring shortened URLs. It includes account authentication, link lifecycle controls, click analytics, session management, administrative security controls, responsive appearance preferences, and custom service-unavailable states.

## Features

- Create short links with optional custom codes, titles, descriptions, and expiration dates
- Manage active, inactive, expired, and deleted links
- Review click totals, visitor activity, referrer channels, devices, browsers, and locations
- Manage account security, active sessions, password changes, and scheduled account deletion
- Administer users, blocked domains, blocked IP ranges, and security-data retention
- Recover gracefully when the API is unavailable
- Switch instantly between light, dark, and system-matched themes from Account Settings

## Technology

- [SvelteKit](https://svelte.dev/docs/kit) and Svelte 5
- TypeScript
- Tailwind CSS 4
- Vitest for unit and component tests
- Playwright for end-to-end tests
- ESLint and Prettier
- Husky for Git workflow checks
- GitNexus for code-graph indexing and impact analysis

## Prerequisites

- Node.js 26 or newer
- npm
- A running Linkpluse API

## Local setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create your local environment file:

   ```sh
   cp .env.example .env
   ```

3. Set `APP_ENV` to the backend API base URL and make `JWT_SECRET_KEY` match the backend configuration.

4. Start the development server:

   ```sh
   npm run dev
   ```

   To open the application automatically:

   ```sh
   npm run dev -- --open
   ```

## Environment variables

| Variable               | Required | Default          | Purpose                                                                         |
| ---------------------- | -------- | ---------------- | ------------------------------------------------------------------------------- |
| `APP_ENV`              | Yes      | —                | Linkpluse API base URL, including `/api/v1`                                     |
| `JWT_SECRET_KEY`       | Yes      | —                | Secret used to verify backend-issued HS256 access tokens; use at least 32 bytes |
| `ACCESS_TOKEN_EXPIRY`  | No       | `15`             | Access-token lifetime in minutes                                                |
| `REFRESH_TOKEN_EXPIRY` | No       | `7`              | Refresh-token lifetime in days                                                  |
| `JWT_ISSUER`           | No       | —                | Expected JWT issuer when the backend supplies an `iss` claim                    |
| `JWT_AUDIENCE`         | No       | —                | Expected JWT audience when the backend supplies an `aud` claim                  |
| `AUTH_COOKIE_SECURE`   | No       | Production-aware | Set to `false` only for local HTTP development                                  |

Never commit `.env` or production secrets. See [`.env.example`](.env.example) for a safe template.

## Appearance

Account Settings provides Light, Dark, and System theme options. Theme changes apply immediately. Light and Dark preferences persist in local storage, while System follows the operating system's current color-scheme preference.

## Commands

| Command                      | Description                                             |
| ---------------------------- | ------------------------------------------------------- |
| `npm run dev`                | Start the development server                            |
| `npm run build`              | Create a production build                               |
| `npm run preview`            | Preview the production build locally                    |
| `npm run check`              | Run Svelte and TypeScript diagnostics                   |
| `npm run check:watch`        | Run diagnostics in watch mode                           |
| `npm run lint`               | Check formatting and lint the codebase                  |
| `npm run format`             | Format the codebase                                     |
| `npm run test:unit -- --run` | Run unit and component tests once                       |
| `npm run test:e2e`           | Install the Playwright browser and run end-to-end tests |
| `npm test`                   | Run the complete unit and end-to-end test suite         |
| `npm run validate:structure` | Validate required project directories                   |

## GitNexus workflow

GitNexus provides the code knowledge graph used for dependency, flow, and change-impact analysis.

Bootstrap it once in a fresh clone:

```sh
npx gitnexus analyze
```

After bootstrap, use the repository-local runner through these commands:

| Command                   | Description                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| `npm run gitnexus:status` | Check whether the index matches the current branch and commit    |
| `npm run gitnexus:index`  | Refresh the index without modifying repository instruction files |
| `npm run gitnexus:watch`  | Keep the index synchronized while files change                   |

Husky starts a serialized background index refresh after branch checkout and after a successful commit. Concurrent refreshes are skipped safely, and output is written to `.gitnexus/refresh.log`. For the most current working-tree graph during a development session, keep `npm run gitnexus:watch` running.

## Project structure

```text
src/
├── lib/
│   ├── components/    Reusable layout and UI components
│   ├── server/        Server-only API clients and authentication helpers
│   ├── state/         Shared application state
│   ├── types/         Domain and API types
│   └── utils.ts       Shared utilities
├── routes/
│   ├── admin/         Administrative controls
│   ├── analytics/     Account-level analytics
│   ├── dashboard/     Link creation and summary dashboard
│   ├── login/         Authentication
│   ├── my-links/      Link management and per-link analytics
│   ├── sessions/      Session management
│   ├── settings/      Account and security settings
│   └── signup/        Account registration
├── app.html           HTML application shell
├── error.html         Static fallback when the Svelte application cannot render
└── hooks.server.ts    Authentication and request lifecycle hooks
```

Server-side routes communicate with the backend using `APP_ENV`. Access and refresh tokens are stored in HTTP-only cookies, and access-token claims are verified before they are exposed to application pages.

## Testing

Unit tests run in two Vitest projects:

- Server tests run in Node.js.
- Svelte component tests run in headless Chromium through Playwright.

End-to-end tests start a local authentication backend and a production preview server automatically. Install the operating-system dependencies required by Playwright before running browser tests in a new environment.

## Git conventions

Create branches using one of the supported prefixes, such as `feat/`, `fix/`, `refactor/`, `chore/`, or `hotfix/`.

Commit subjects must follow this format:

```text
type(#issue): emoji description
```

Example:

```text
docs(#31): 📝 update Linkpluse README
```

The pre-push hook validates the project structure and branch name. Pull requests target `dev` unless the repository workflow requires another base branch.

## License

See [LICENSE](LICENSE).
