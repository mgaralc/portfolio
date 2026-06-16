# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Personal portfolio website ("Este es mi proyecto de portfolio como desarrollador Web"). It is an Nx monorepo containing a single Angular 20 application plus its Playwright e2e suite. The app (`apps/MyPortfolio`) is currently the default Nx/Angular scaffold (empty routes, `NxWelcome` placeholder component) — no portfolio-specific features have been built yet.

Package manager is **pnpm** (`pnpm-workspace.yaml`, `pnpm-lock.yaml`) — do not use npm/yarn commands or lockfiles.

## Common commands

All commands run through Nx from the repo root. The two projects are `MyPortfolio` (app) and `MyPortfolio-e2e` (Playwright e2e).

```bash
# Install deps
pnpm install

# Serve the app locally (dev server on http://localhost:4200)
pnpm exec nx serve MyPortfolio

# Build (production by default; add --configuration=development for dev build)
pnpm exec nx build MyPortfolio

# Unit tests (Jest, via @nx/jest)
pnpm exec nx test MyPortfolio
pnpm exec nx test MyPortfolio --testFile=app.spec.ts   # single file
pnpm exec nx test MyPortfolio -t "test name"             # single test by name

# Lint (ESLint flat config via @nx/eslint)
pnpm exec nx lint MyPortfolio

# e2e tests (Playwright; auto-starts the dev server via webServer config)
pnpm exec nx e2e MyPortfolio-e2e

# Run a target for every project (e.g. lint/test everything)
pnpm exec nx run-many -t lint
pnpm exec nx run-many -t test

# Only run targets affected by uncommitted/diffed changes
pnpm exec nx affected -t lint test build
```

There are no root-level npm scripts (`package.json` `scripts` is empty) — always invoke Nx directly as above.

## Architecture

- **Monorepo layout**: managed by Nx (`nx.json`) with pnpm workspaces (`pnpm-workspace.yaml` → `apps/*`). Each project has its own `project.json` defining its targets (build/serve/lint/test/e2e); there is no Angular CLI `angular.json` — Nx generates targets per-project instead.
- **`apps/MyPortfolio`**: the Angular app.
  - Standalone-components style (no `NgModule`): bootstrap is in `src/main.ts`, app-wide providers in `src/app/app.config.ts` (router, zone change detection, global error listeners), routes in `src/app/app.routes.ts`.
  - Root component `App` (`src/app/app.ts` / `app.html` / `app.scss`) currently just renders the `NxWelcome` placeholder and a `<router-outlet>` via `RouterModule`.
  - Styling uses SCSS (`inlineStyleLanguage: scss`), global styles in `src/styles.scss`.
  - Built with the modern `@angular/build:application` executor (esbuild-based), not the legacy webpack builder.
- **`apps/MyPortfolio-e2e`**: Playwright suite (`@nx/playwright`). `playwright.config.ts` auto-starts `nx run MyPortfolio:serve` against `http://localhost:4200` (override with `BASE_URL` env var) and runs tests across Chromium/Firefox/WebKit.
- **Testing**: unit tests use Jest with `jest-preset-angular` (root preset in `jest.preset.js`, aggregated per-project via `getJestProjectsAsync()` in `jest.config.ts`). Each project supplies its own `jest.config.ts` + `tsconfig.spec.json`.
- **TypeScript**: `tsconfig.base.json` is the shared base (no path aliases defined yet); each project extends it with its own `tsconfig.json`/`tsconfig.app.json`/`tsconfig.spec.json`.
- **Linting/formatting**: ESLint flat config (`eslint.config.mjs`) composes `@nx/eslint-plugin` configs and enforces Nx module boundaries (`@nx/enforce-module-boundaries`); per-project `eslint.config.mjs` files extend the root one. Prettier config (`.prettierrc`) only sets `singleQuote: true` — defer to it over manual formatting choices.
- **Nx caching/affected**: `nx.json` defines cached target defaults for build/lint/test and a `production` named input that excludes test/lint config files from build cache hashing — keep this in mind when adding new config files that shouldn't bust the build cache.
