# Lint playground

Sample `.vue` and `.ts` files used to compare **ESLint** (`@escral/lint` via `eslint.config.mjs`) and **Oxlint** (`.oxlintrc.json`).

From the repo root:

```bash
yarn lint:eslint
yarn lint:oxlint
yarn lint:compare
```

ESLint needs a prior `yarn build` so `eslint.config.mjs` can load `dist/`; `lint:eslint` runs build for you. Oxlint does not use that bundle.

Oxlint’s `.oxlintrc.json` is kept close to ESLint via `@oxlint/migrate` plus `scripts/slim-oxlintrc.mjs` (drops duplicate browser globals). After changing `src/index.ts` / `eslint.config.mjs`, refresh Oxlint:

```bash
yarn lint:oxlint:sync
```
