/**
 * Reads .oxlintrc.migrated.json from `npx @oxlint/migrate` and writes a smaller
 * .oxlintrc.json: drops duplicate browser globals (use env + Vue macro globals).
 * Re-run migrate then: node scripts/slim-oxlintrc.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const migratedPath = path.join(root, '.oxlintrc.migrated.json')
const outPath = path.join(root, '.oxlintrc.json')

const j = JSON.parse(fs.readFileSync(migratedPath, 'utf8'))

j.env = {
    builtin: true,
    browser: true,
}

j.globals = {
    computed: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    defineProps: 'readonly',
    onMounted: 'readonly',
    onUnmounted: 'readonly',
    reactive: 'readonly',
    ref: 'readonly',
    shallowReactive: 'readonly',
    shallowRef: 'readonly',
    toRef: 'readonly',
    toRefs: 'readonly',
    watch: 'readonly',
    watchEffect: 'readonly',
}

j.overrides = j.overrides
    .filter((o) => {
        const keys = Object.keys(o).filter((k) => k !== 'files')
        if (keys.length === 1 && keys[0] === 'globals') {
            return false
        }
        return true
    })
    .map((o) => {
        if (!o.globals) {
            return o
        }
        const { globals: _g, ...rest } = o
        return Object.keys(rest).length ? rest : o
    })

Object.assign(j.rules, {
    'no-console': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
})

fs.writeFileSync(outPath, `${JSON.stringify(j, null, 2)}\n`)
console.log('Wrote', path.relative(root, outPath))
