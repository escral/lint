# @escral/lint

Shared **ESLint** flat config (Vue + TypeScript), **Oxlint** / **Oxfmt** starter configs, and a small CLI to wire Oxlint/Oxfmt in a project.

## Install

```bash
yarn add -D @escral/lint
# or
npm install -D @escral/lint
```

Install **ESLint 9** and use a flat config (`eslint.config.js` / `eslint.config.mjs`). For Oxlint/Oxfmt, add those tools separately if you use them.

## ESLint

The default export is an async factory. Use top-level `await` in `eslint.config.mjs`:

```javascript
import config from '@escral/lint/eslint'

export default await config()
```

### Options (optional)

You can pass a single options object, for example:

```javascript
export default await config({
    semi: 'never',       // or 'always'
    indent: 4,
    vue: false,          // disable Vue-specific rules / presets
    // vue: { indent: 2, typescriptLang: 'force', ... },
    noConsole: true,     // or { allow: ['warn', 'error'] }
    importNewlines: true,
    forceMultilineIfs: true,
})
```

Types are published in the package; your editor can complete the shape from `dist/index.d.ts`.

## Oxlint

Point Oxlint at the shared config via `extends` (JSON/JSONC):

```jsonc
{
    "extends": ["./node_modules/@escral/lint/oxc/oxlintrc.jsonc"]
}
```

## Oxfmt

Oxfmt does **not** support `extends`. Copy the template from the package or use the scaffold CLI (below), which writes a full `.oxfmtrc.jsonc` at the project root.

Template path on disk:

`node_modules/@escral/lint/src/oxc/oxfmtrc.jsonc`

Export subpath: `@escral/lint/oxc/oxfmtrc.jsonc`.

## CLI: `scaffold-oxc`

After installing the package, run from your **project root** (current working directory):

```bash
npx scaffold-oxc
```

It will:

- **Oxlint (JSON/JSONC):** create `.oxlintrc.json` with `extends` → `@escral/lint/oxc/oxlintrc.jsonc`, or merge that `extends` into existing `.oxlintrc.json` / `.oxlintrc.jsonc` / `oxlintrc.json` / `oxlintrc.jsonc` if missing. It treats the setup as already done if `extends` uses the package path **or** points at the same file (e.g. `./src/oxc/oxlintrc.jsonc` inside this repo).
- **Oxfmt:** copy the full bundled `oxfmtrc` template to `.oxfmtrc.jsonc`, or replace existing JSON/JSONC oxfmt configs with that template. The `$schema` URL is adjusted for a config file at the project root.

If you use **JavaScript/TypeScript** Oxlint or Oxfmt config files instead of JSON/JSONC, the CLI only prints hints; you must merge `extends` (Oxlint) or copy the oxfmt template by hand.

