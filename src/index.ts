// @ts-expect-error missing types
import importNewLines from 'eslint-plugin-import-newlines'
import stylisticTs from '@stylistic/eslint-plugin-ts'

declare const process: any

const vueRules = (options: {
    indent?: number,
    scriptIndent?: number,
    maxAttributesPerLine?: number,
    typescriptLang?: 'force' | 'recommend' | 'ignore',
    macroOrder?: string[],
} = {}): object[] => {
    const indent = options.indent ?? 4
    const scriptIndent = options.scriptIndent ?? options.indent ?? 4
    const maxAttributesPerLine = options.maxAttributesPerLine ?? 2
    const typescriptLang = options.typescriptLang ?? 'recommend'
    const macroOrder = options.macroOrder ?? ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots']

    return [
        {
            languageOptions: {
                globals: {
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
                },
            },
            rules: {
                'vue/html-indent': ['error', indent],
                'vue/script-indent': ['error', scriptIndent, { 'switchCase': 1 }],
                'vue/multi-word-component-names': 'off',
                'vue/max-attributes-per-line': ['warn', {
                    'singleline': maxAttributesPerLine,
                    'multiline': 1,
                }],
                'vue/padding-line-between-blocks': ['error', 'always'],
                'vue/new-line-between-multi-line-property': ['error', {
                    'minLineOfMultilineProperty': 2,
                }],

                ...(typescriptLang === 'recommend' || typescriptLang === 'force' ? {
                    'vue/block-lang': [typescriptLang === 'force' ? 'error' : 'warn', { 'script': { 'lang': 'ts' } }],
                } : undefined),

                'vue/block-tag-newline': ['error', {
                    'singleline': 'always',
                    'multiline': 'always',
                }],
                'vue/component-name-in-template-casing': ['error'],
                'vue/custom-event-name-casing': ['warn'],
                'vue/define-emits-declaration': ['warn'],
                'vue/define-props-declaration': ['error'],
                'vue/match-component-file-name': ['error', {
                    'extensions': ['vue'],
                    'shouldMatchCase': true,
                }],
                'vue/define-macros-order': ['warn', {
                    'order': macroOrder,
                }],
                'vue/no-duplicate-attr-inheritance': ['error'],
                'vue/no-empty-component-block': ['error'],
                'vue/prefer-separate-static-class': ['warn'],
                'vue/prefer-true-attribute-shorthand': ['warn'],
                'vue/require-macro-variable-name': ['error'],
                'vue/require-typed-object-prop': ['error'],
                'vue/valid-define-options': ['error'],
            },
        },
    ]
}

export type Awaitable<T> = T | Promise<T>

async function interopDefault<T>(m: Awaitable<T>): Promise<T extends {
    default: infer U
} ? U : T> {
    const resolved = await m

    return (resolved as any).default || resolved
}

const config = async (options: {
    /** @todo Make it work with vue disabled */
    vue?: false | Parameters<typeof vueRules>[0],
    semi?: 'always' | 'never',
    indent?: number,
    noConsole?: boolean | {
        allow: string[]
    },
    importNewlines?: boolean | {
        items: number,
        maxLen: number
    },
    forceMultilineIfs?: boolean,
} = {}) => {
    const useSemicolonAtEnd = options.semi ?? 'never'
    const indent = options.indent ?? 4
    const noConsole = options.noConsole ?? false
    const importNewlines = (options.importNewlines === true || options.importNewlines === undefined) ? {
        items: 4,
        maxLen: 120,
    } : (options.importNewlines ?? false)
    const useVue = options.vue === undefined ? true : Boolean(options.vue)
    const forceMultilineIfs = options.forceMultilineIfs ?? true

    return [
        ...await (async () => {
            // noinspection ES6MissingAwait
            const [
                vuePlugin,
                vueTsEslintConfig,
            ] = await Promise.all([
                interopDefault(import('eslint-plugin-vue')),
                interopDefault(import('@vue/eslint-config-typescript')),
            ] as const)

            const result = [
                ...vuePlugin.configs['flat/recommended'],
                // @ts-ignore
                ...vueTsEslintConfig(),
                {
                    languageOptions: {
                        parserOptions: {
                            warnOnUnsupportedTypeScriptVersion: false,
                        },
                    },
                },
            ]

            if (useVue) {
                result.push(
                    ...vueRules(Object.assign({
                        indent,
                    }, options.vue || {})),
                )
            }

            return result
        })(),
        ...(importNewlines ? [
            {
                'plugins': {
                    'import-newlines': importNewLines,
                },
                rules: {
                    'import-newlines/enforce': ['error', {
                        'items': importNewlines.items,
                        'max-len': importNewlines.maxLen,
                        'semi': useSemicolonAtEnd === 'always',
                    }],
                },
            },
        ] : []),
        {
            files: ['**/*.{ts,tsx,vue}'],
            languageOptions: {
                parser: await import('vue-eslint-parser'),
                parserOptions: {
                    parser: await import('@typescript-eslint/parser'),
                    extraFileExtensions: ['.vue'],
                    ecmaVersion: 2020,
                    sourceType: 'module',
                }
            },
            rules: {
                '@typescript-eslint/consistent-type-imports': 'error',
            }
        },
        ({
            plugins: {
                '@stylistic/ts': stylisticTs,
            },
            rules: {
                ...(noConsole ? {
                    'no-console': ['warn', typeof noConsole !== 'boolean' ? {
                        allow: noConsole.allow,
                    } : undefined],
                } : {
                    'no-console': 'off',
                }),
                'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

                // Typescript
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-var-requires': 'off',
                'no-empty-function': ['warn'],
                '@typescript-eslint/ban-ts-comment': ['off'],
                '@typescript-eslint/explicit-member-accessibility': ['warn'],
                '@typescript-eslint/no-unused-vars': 'warn',
                '@stylistic/ts/type-annotation-spacing': 'error',

                // General
                'semi': ['error', useSemicolonAtEnd],
                'indent': ['error', indent],
                ...(forceMultilineIfs ? {
                    'curly': ['error', 'all'],
                } : {}),
                'comma-dangle': ['error', 'always-multiline'],
                'object-curly-spacing': ['warn', 'always', { 'arraysInObjects': false }],
                'keyword-spacing': ['error', {
                    before: true,
                    after: true,
                }],
                'block-spacing': ['error'],
                'arrow-spacing': ['error'],
                'template-curly-spacing': ['error'],
                'computed-property-spacing': ['error', 'never'],
                'key-spacing': ['error'],
                'comma-spacing': ['error', {
                    'before': false,
                    'after': true,
                }],
                'space-infix-ops': ['error'],
                'space-in-parens': ['error', 'never'],
                'padding-line-between-statements': [
                    'error',
                    {
                        'blankLine': 'never',
                        'prev': 'block',
                        'next': '*',
                    },
                    {
                        'blankLine': 'always',
                        'prev': 'function',
                        'next': '*',
                    },
                    {
                        'blankLine': 'never',
                        'prev': 'block',
                        'next': 'if',
                    },
                    {
                        'blankLine': 'always',
                        'prev': '*',
                        'next': 'return',
                    },
                    {
                        'blankLine': 'always',
                        'prev': 'function',
                        'next': 'return',
                    },
                    {
                        'blankLine': 'always',
                        'prev': 'function',
                        'next': 'function',
                    },
                    {
                        'blankLine': 'always',
                        'prev': '*',
                        'next': 'if',
                    },
                    {
                        'blankLine': 'never',
                        'prev': 'return',
                        'next': '*',
                    },
                ],
                'padded-blocks': ['error', 'never'],
                'func-call-spacing': ['error', 'never'],
                'no-multiple-empty-lines': ['error', {
                    'max': 1,
                    'maxEOF': 1,
                }],
                'lines-between-class-members': ['error', 'always', {
                    exceptAfterSingleLine: true,
                }],
                'space-before-function-paren': ['error', {
                    'anonymous': 'never',
                    'named': 'never',
                    'asyncArrow': 'always',
                }],
                'space-before-blocks': ['error', 'always'],
                'quotes': ['warn', 'single', {
                    avoidEscape: true,
                    allowTemplateLiterals: true,
                }],
            },
        }),
        {
            ignores: [
                '/node_modules/*',
                'node_modules/*',
                'dist/*',
                '/dist/*',
                '.*/*',
            ],
        },
    ]
}

export default config
