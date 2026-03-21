# Default ESLint preset (`config()` with no arguments)

This is what `@escral/lint` applies when you call `config()` without options (from `src/index.ts`).

## Default options (the `config({ ... })` shape)

| Option | Default |
|--------|---------|
| `semi` | `'never'` |
| `indent` | `4` (spaces) |
| `vue` | enabled (all `vueRules` below apply) |
| `vue.scriptIndent` | same as `indent` → **4** |
| `vue.maxAttributesPerLine` | **2** (single-line); multiline **1** per line |
| `vue.typescriptLang` | `'recommend'` → `vue/block-lang` is **warn** (not error) |
| `vue.macroOrder` | `['defineOptions', 'defineProps', 'defineEmits', 'defineSlots']` |
| `noConsole` | `false` → `no-console` is **off** |
| `importNewlines` | **on** → `items: 4`, `maxLen: 120` |
| `forceMultilineIfs` | `true` → `curly: ['error', 'all']` |

`no-debugger`: **off** when `NODE_ENV !== 'production'`, **warn** when `NODE_ENV === 'production'`.

**Also merged in:** `eslint-plugin-vue` **flat/recommended** and **@vue/eslint-config-typescript** (many additional rules). For the full flat list on a real file:

```bash
npx eslint --print-config path/to/Some.vue
```

---

## Rules set in this package (default severities & options)

### TypeScript / JavaScript — layout & punctuation

| Rule | Default severity / options |
|------|----------------------------|
| `semi` | error, **never** |
| `indent` | error, **4** spaces |
| `comma-dangle` | error, **always-multiline** |
| `quotes` | warn, **single**, `avoidEscape: true`, `allowTemplateLiterals: true` |
| `object-curly-spacing` | warn, **always**, `{ arraysInObjects: false }` |
| `keyword-spacing` | error, `{ before: true, after: true }` |
| `block-spacing` | error |
| `arrow-spacing` | error |
| `template-curly-spacing` | error |
| `computed-property-spacing` | error, **never** |
| `key-spacing` | error |
| `comma-spacing` | error, `{ before: false, after: true }` |
| `space-infix-ops` | error |
| `space-in-parens` | error, **never** |
| `space-before-function-paren` | error, `{ anonymous: 'never', named: 'never', asyncArrow: 'always' }` |
| `space-before-blocks` | error, **always** |
| `func-call-spacing` | error, **never** |
| `padded-blocks` | error, **never** |
| `no-multiple-empty-lines` | error, `{ max: 1, maxEOF: 1 }` |
| `lines-between-class-members` | error, **always**, `{ exceptAfterSingleLine: true }` |
| `padding-line-between-statements` | error (see `src/index.ts` for the full list of prev/next pairs) |
| `curly` | error, **all** |
| `@stylistic/ts/type-annotation-spacing` | error |

### Imports

| Rule | Default severity / options |
|------|----------------------------|
| `@typescript-eslint/consistent-type-imports` | error (on `**/*.{ts,tsx,vue}`) |
| `import-newlines/enforce` | error, `{ items: 4, max-len: 120, semi: false }` |

### Vue (custom block defaults)

| Rule | Default severity / options |
|------|----------------------------|
| `vue/html-indent` | error, **4** |
| `vue/script-indent` | error, **4**, `{ switchCase: 1 }` |
| `vue/multi-word-component-names` | **off** |
| `vue/max-attributes-per-line` | warn, `{ singleline: 2, multiline: 1 }` |
| `vue/padding-line-between-blocks` | error, **always** |
| `vue/new-line-between-multi-line-property` | error, `{ minLineOfMultilineProperty: 2 }` |
| `vue/block-lang` | **warn**, `{ script: { lang: 'ts' } }` |
| `vue/block-tag-newline` | error, `{ singleline: 'always', multiline: 'always' }` |
| `vue/component-name-in-template-casing` | error |
| `vue/custom-event-name-casing` | warn |
| `vue/define-emits-declaration` | warn |
| `vue/define-props-declaration` | error |
| `vue/match-component-file-name` | error, `{ extensions: ['vue'], shouldMatchCase: true }` |
| `vue/define-macros-order` | warn, order **defineOptions → defineProps → defineEmits → defineSlots** |
| `vue/no-duplicate-attr-inheritance` | error |
| `vue/no-empty-component-block` | error |
| `vue/prefer-separate-static-class` | warn |
| `vue/prefer-true-attribute-shorthand` | warn |
| `vue/require-macro-variable-name` | error |
| `vue/require-typed-object-prop` | error |
| `vue/valid-define-options` | error |

### Other rules in the shared TS block (defaults)

| Rule | Default |
|------|---------|
| `no-console` | **off** |
| `no-debugger` | **off** (non-prod) / **warn** (prod) |
| `no-empty-function` | warn |
| `@typescript-eslint/explicit-member-accessibility` | warn |
| `@typescript-eslint/no-unused-vars` | warn |
| `@typescript-eslint/no-explicit-any` | off |
| `@typescript-eslint/no-var-requires` | off |
| `@typescript-eslint/ban-ts-comment` | off |

---

*Source: `src/index.ts`.*
