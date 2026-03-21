import { defineConfig } from 'tsup'

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format: ['cjs', 'esm'],
        dts: true,
        clean: false,
        external: ['vue-eslint-parser'],
    },
    {
        entry: { 'scaffold-oxc': 'src/cli/scaffold-oxc.ts' },
        format: ['cjs'],
        dts: false,
        external: ['strip-json-comments'],
        banner: {
            js: '#!/usr/bin/env node',
        },
    },
])
