# Migration assessment: ESLint → Oxlint + Oxfmt

This document summarizes whether the `@escral/lint` ESLint preset (see `src/index.ts` and `eslint.config.mjs`) can move to [Oxlint](https://oxc.rs/docs/guide/usage/linter/) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter/). Terminology: **Oxlint** (linter) and **Oxfmt** (formatter); there is no separate “oxclint” product in the Oxc stack.

## Executive summary

| Area | Verdict |
|------|--------|
| **Full drop-in replacement** | **No.** A large share of your rules are Vue SFC–specific, stylistic, type-aware, or depend on runtime options. |
| **Partial Oxlint** | **Yes.** `@oxlint/migrate` can emit a starting `.oxlintrc.json`; in a trial run it carried **37** rules forward and reported **201** skipped (see [Oxlint migration trial](#oxlint-migration-trial)). |
| **Oxfmt** | **Yes, as a new formatter layer.** This repo has **no** Prettier or Biome config, so there is nothing for `oxfmt --migrate prettier|biome` to read; you would use `oxfmt --init` or hand-author `.oxfmtrc.json` and **move formatting out of ESLint**. |

## How this project differs from a normal app

`@escral/lint` exports an **async factory** `config(options)` (Vue on/off, indent, semicolons, `importNewlines`, `noConsole`, etc.). Oxlint expects a **declarative** config file, not an async function API — but that file does not have to be JSON.

### `oxlint.config.ts` (TypeScript config)

Per the Oxc docs ([Configuration](https://oxc.rs/docs/guide/usage/linter/config.md), also indexed from [oxc.rs/llms.txt](https://oxc.rs/llms.txt)), Oxlint discovers **either** `.oxlintrc.json` **or** `oxlint.config.ts` in the working directory (not both). TypeScript config looks like:

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  categories: { correctness: "warn" },
  rules: { "eslint/no-unused-vars": "error" },
});
```

Constraints from upstream:

- The file must be named `oxlint.config.ts` (including when passed via `--config`).
- The **default export must be a config object** (wrapped with `defineConfig` for typings) — not an async function and not a factory with caller-supplied options like `@escral/lint`’s `config(options)`.
- TypeScript configs need the **Node-based `oxlint` package** and a Node runtime that can execute TypeScript; **standalone Oxlint binaries** should use `.oxlintrc.json` instead.

What this enables for migration:

- **`extends`** can pull in other files; in TS you can `import` shared fragments and compose with `defineConfig` (see the same config doc).
- **Environment-dependent bits** (e.g. `no-debugger` vs `NODE_ENV`) may be expressed by reading `process.env` **when the config module loads**, which JSON alone cannot do — still not the same as your package’s per-consumer `config({ ... })` API.

So the gap is less “JSON only” and more **preset shape**: Oxlint is one resolved object per project (plus `overrides`), not a published npm function that each app calls with different options unless you generate or wrap config per consumer yourself.

## Oxlint migration trial

Command used (after `yarn build`, because `eslint.config.mjs` imports `./dist/index.mjs`):

```bash
npx @oxlint/migrate eslint.config.mjs --details
```

Observed result:

- **Created** a `.oxlintrc.json` with **37** rules (including overrides for Vue/TS file globs).
- **Skipped 201** rules, grouped by the tool as nursery, type-aware, not implemented, or unsupported.
- **Warning:** `special parser detected: vue-eslint-parser` — template-aware Vue rules are a weak spot for Oxlint today.

To pull in more of `@vue/eslint-config-typescript`, you can re-run with:

```bash
npx @oxlint/migrate eslint.config.mjs --type-aware --with-nursery --details
```

(Type-aware rules require running Oxlint with `--type-aware` and an appropriate `--tsconfig`.)

### Rules that migrated in the trial (high level)

Examples that **did** map include: several Vue script-setup / lifecycle rules, a block of `@typescript-eslint/*` correctness rules, `curly`, `no-empty-function`, `@stylistic/ts/type-annotation-spacing`, `import-newlines/enforce` (via **`jsPlugins`**), `@typescript-eslint/consistent-type-imports`, and TypeScript-specific `prefer-*` / `no-var` overrides for TS/Vue globs.

### What could not be migrated (or was skipped)

**Vue SFC templates (major gap)**  
Oxlint reported many `vue/*` rules as unsupported because they **require Vue template parsing** (e.g. `vue/no-parsing-error`, `vue/valid-v-*`, `vue/no-duplicate-attributes`, `vue/html-end-tags`, and many style rules tied to templates). Your custom Vue rules such as `vue/block-lang`, `vue/component-name-in-template-casing`, `vue/no-empty-component-block`, etc. fall into “needs template parsing” or “not implemented” in the migrate output.

**Vue rules marked not implemented (examples)**  
Including: `vue/script-indent`, `vue/match-component-file-name`, `vue/require-macro-variable-name`, `vue/require-typed-object-prop`, `vue/valid-define-options`, and several `vue/no-*` / `vue/require-*` script rules.

**Core ESLint stylistic rules (deprecated in ESLint; not native Oxlint)**  
Your heavy use of formatting rules (`semi`, `indent`, `comma-dangle`, `quotes`, `padding-line-between-statements`, `keyword-spacing`, and many others) were listed as **unsupported** — Oxlint’s migrate output suggests using **Oxfmt** and/or **@stylistic** via **`jsPlugins`** if you still want them under a linter.

**Type-aware TypeScript rules**  
Skipped unless you migrate with `--type-aware` and run Oxlint accordingly (e.g. `no-floating-promises`, `no-misused-promises`, strict boolean checks, etc.).

**Nursery rules**  
A small set (e.g. some `@typescript-eslint/*` and `no-undef`-class rules) was skipped unless `--with-nursery` is used.

**Explicit-member-accessibility**  
`@typescript-eslint/explicit-member-accessibility` was reported as not implemented for Oxlint in this run.

**Environment-dependent rules**  
`no-debugger` toggled by `NODE_ENV` is not represented in static Oxlint config the same way.

### Plugins vs Oxlint

| ESLint dependency | Oxlint direction |
|-------------------|------------------|
| `eslint-plugin-vue` + `vue-eslint-parser` | Built-in **`vue`** plugin — strong on script; **weak on `<template>`** vs ESLint today. |
| `@vue/eslint-config-typescript` | Partial overlap via **`typescript`** plugin + optional **`--type-aware`**. |
| `@typescript-eslint/*` | Mostly mapped where Oxlint implements the rule; type-aware subset needs flags. |
| `eslint-plugin-import-newlines` | Migrate output used **`jsPlugins`** — verify behavior under Oxlint’s JS plugin support. |
| `@stylistic/eslint-plugin-ts` | **`jsPlugins`** for `@stylistic/ts` (e.g. `type-annotation-spacing`) — prefer moving pure formatting to **Oxfmt** where possible. |

## Oxfmt (replacing ESLint-driven formatting)

This package currently encodes style via ESLint (`semi`, `indent` 4 spaces, `single` quotes, `comma-dangle` always-multiline, import line breaks via `eslint-plugin-import-newlines`, etc.). Oxfmt is the right tool to **replace most of that**, not Oxlint.

**There is no Prettier/Biome file here**, so:

- Use `npx oxfmt@latest --init` to create `.oxfmtrc.json`, **or** write it by hand.
- Align options with your defaults: e.g. `semi: false`, `tabWidth: 4`, `singleQuote: true`, `printWidth` (your import plugin used `maxLen: 120` — often matches `printWidth` / line breaking).
- **`sortImports`** in Oxfmt can replace *some* import-ordering concerns but is **not** the same as `import-newlines/enforce` (item count + max length). You may keep `import-newlines` under Oxlint `jsPlugins` or accept Oxfmt’s import layout.

**Vue SFCs:** Oxfmt formats JS/TS natively; HTML-like regions are handled in the broader Oxc formatter story (see current Oxfmt docs for Vue/SFC coverage). Expect to validate `.vue` output against your current ESLint Vue template rules, since those rules often won’t exist on Oxlint.

**What Oxfmt will not do**

- Rules like **`curly`** (force braces on multi-line `if`) and **`padding-line-between-statements`** are **lint concerns**, not formatter concerns — keep them in Oxlint (if available), ESLint, or drop them.

## Recommended strategies

1. **Oxfmt + Oxlint + ESLint (transitional)**  
   Oxfmt for format, Oxlint for fast checks, ESLint only for Vue `<template>` and unmigrated rules until Oxlint catches up.

2. **Oxfmt + Oxlint only (strict subset)**  
   Accept loss of many Vue template rules and several TypeScript/style rules, or re-implement a minimal set via `jsPlugins`.

3. **Keep publishing ESLint; add optional Oxlint/Oxfmt configs**  
   Ship documented `.oxfmtrc.json` and a **reference** `.oxlintrc.json` or **`oxlint.config.ts`** for consumers who want the Oxc toolchain without breaking existing `eslint-config` users.

## Commands reference

```bash
# Oxlint migration (from repo root, after build)
yarn build
npx @oxlint/migrate eslint.config.mjs --details

# Oxfmt when there is no Prettier/Biome
npx oxfmt@latest --init
```

## References

- [Oxc LLM index (`llms.txt`)](https://oxc.rs/llms.txt)  
- [Oxlint configuration (JSON + `oxlint.config.ts`)](https://oxc.rs/docs/guide/usage/linter/config.md)  
- [Oxlint CLI](https://oxc.rs/docs/guide/usage/linter/cli.html)  
- [Oxlint config file reference](https://oxc.rs/docs/guide/usage/linter/config-file-reference.html)  
- [@oxlint/migrate](https://github.com/oxc-project/oxlint-migrate)  
- [Oxfmt CLI](https://oxc.rs/docs/guide/usage/formatter/cli.html)  
- [Oxfmt config](https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html)

---

*Generated from the current `src/index.ts` ESLint preset and a trial run of `@oxlint/migrate` (version at time of assessment: 1.56.0). Re-run migrate after upgrading Oxlint for updated rule coverage.*
