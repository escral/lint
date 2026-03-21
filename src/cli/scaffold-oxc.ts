// oxlint-disable no-console
import fs from 'node:fs'
import path from 'node:path'
import { stripJsoncComments } from './strip-jsonc-comments'

const OXLINT_JSON_NAMES = ['.oxlintrc.json', '.oxlintrc.jsonc', 'oxlintrc.json', 'oxlintrc.jsonc'] as const

const OXFMT_JSON_NAMES = ['.oxfmtrc.json', '.oxfmtrc.jsonc', 'oxfmtrc.json', 'oxfmtrc.jsonc'] as const

const OXLINT_CODE_NAMES = [
    'oxlint.config.js',
    'oxlint.config.mjs',
    'oxlint.config.cjs',
    'oxlint.config.ts',
    'oxlint.config.mts',
    'oxlint.config.cts',
    '.oxlintrc.js',
    '.oxlintrc.mjs',
    '.oxlintrc.cjs',
    '.oxlintrc.ts',
    '.oxlintrc.mts',
    '.oxlintrc.cts',
] as const

const OXFMT_CODE_NAMES = [
    'oxfmt.config.js',
    'oxfmt.config.mjs',
    'oxfmt.config.cjs',
    'oxfmt.config.ts',
    'oxfmt.config.mts',
    'oxfmt.config.cts',
    '.oxfmtrc.js',
    '.oxfmtrc.mjs',
    '.oxfmtrc.cjs',
    '.oxfmtrc.ts',
    '.oxfmtrc.mts',
    '.oxfmtrc.cts',
] as const

const FALLBACK_PKG = '@escral/lint'

/** Resolves install dir (…/dist) so it works when the bin is a symlinked shim. */
function getCliDistDir(): string {
    const main = process.argv[1]
    if (!main) {
        return ''
    }
    const scriptPath = fs.realpathSync(main)
    return path.dirname(scriptPath)
}

function readPackageName(): string {
    try {
        const distDir = getCliDistDir()
        const pkgPath = path.join(distDir, '..', 'package.json')
        const raw = fs.readFileSync(pkgPath, 'utf8')
        const name = JSON.parse(raw).name as string
        return name || FALLBACK_PKG
    } catch {
        return FALLBACK_PKG
    }
}

function parseJsoncFile(filePath: string): Record<string, unknown> {
    const raw = fs.readFileSync(filePath, 'utf8')
    const stripped = stripJsoncComments(raw)
    return JSON.parse(stripped) as Record<string, unknown>
}

function stringifyConfig(obj: Record<string, unknown>): string {
    return `${JSON.stringify(obj, null, 4)}\n`
}

function normalizeExtendsList(value: unknown): { list: string[]; wasMissing: boolean } {
    if (value === undefined) {
        return { list: [], wasMissing: true }
    }
    if (Array.isArray(value)) {
        return { list: value.filter((x): x is string => typeof x === 'string'), wasMissing: false }
    }
    if (typeof value === 'string') {
        return { list: [value], wasMissing: false }
    }
    return { list: [], wasMissing: false }
}

function getOxlintCanonicalPath(): string {
    return path.join(getCliDistDir(), '..', 'src', 'oxc', 'oxlintrc.jsonc')
}

/** True if this extend entry is the package export or resolves to the same file as our shipped oxlintrc. */
function extendEntryReferencesOurOxlint(entry: string, cwd: string, pkg: string): boolean {
    const exportTarget = `${pkg}/oxc/oxlintrc.jsonc`
    if (entry === exportTarget) {
        return true
    }
    let canonicalReal: string
    try {
        canonicalReal = fs.realpathSync(getOxlintCanonicalPath())
    } catch {
        return false
    }
    try {
        const resolved = path.resolve(cwd, entry)
        if (!fs.existsSync(resolved)) {
            return false
        }
        return fs.realpathSync(resolved) === canonicalReal
    } catch {
        return false
    }
}

function extendsListReferencesOurOxlint(list: string[], cwd: string, pkg: string): boolean {
    return list.some((e) => extendEntryReferencesOurOxlint(e, cwd, pkg))
}

function addOxlintExtends(
    obj: Record<string, unknown>,
    target: string,
    cwd: string,
    pkg: string,
): { changed: boolean; next: Record<string, unknown> } {
    const { list } = normalizeExtendsList(obj.extends)
    if (extendsListReferencesOurOxlint(list, cwd, pkg)) {
        return { changed: false, next: obj }
    }
    return { changed: true, next: { ...obj, extends: [target, ...list] } }
}

function getOxfmtCanonicalPath(): string {
    return path.join(getCliDistDir(), '..', 'src', 'oxc', 'oxfmtrc.jsonc')
}

/** Canonical file under src/oxc uses ../../node_modules; at project root it must be ./node_modules */
function oxfmtTemplateForProjectRoot(raw: string): string {
    return raw.replace(
        /"\$schema"\s*:\s*"\.\.\/\.\.\/node_modules\/oxfmt\/configuration_schema\.json"/,
        '"$schema": "./node_modules/oxfmt/configuration_schema.json"',
    )
}

function existingInCwd(cwd: string, names: readonly string[]): string[] {
    return names.filter((n) => fs.existsSync(path.join(cwd, n)))
}

function run(): void {
    const cwd = process.cwd()
    const pkg = readPackageName()
    const extendOxlint = `${pkg}/oxc/oxlintrc.jsonc`
    const oxfmtTemplatePath = getOxfmtCanonicalPath()

    const oxlintCode = existingInCwd(cwd, OXLINT_CODE_NAMES)
    const oxfmtCode = existingInCwd(cwd, OXFMT_CODE_NAMES)

    if (oxlintCode.length > 0) {
        console.log('Oxlint: TypeScript/JavaScript config file(s) found — add extends manually, for example:')
        console.log(`  "extends": ["${extendOxlint}"]`)
        console.log(`  Files: ${oxlintCode.join(', ')}`)
    }

    if (oxfmtCode.length > 0) {
        console.log(
            'Oxfmt: TypeScript/JavaScript config file(s) found — oxfmt has no extends; copy the template into your config manually:',
        )
        console.log(`  node_modules/${pkg}/src/oxc/oxfmtrc.jsonc`)
        console.log(`  Files: ${oxfmtCode.join(', ')}`)
    }

    if (oxlintCode.length === 0) {
        const oxlintJson = existingInCwd(cwd, OXLINT_JSON_NAMES)
        if (oxlintJson.length === 0) {
            const dest = path.join(cwd, '.oxlintrc.json')
            fs.writeFileSync(dest, stringifyConfig({ extends: [extendOxlint] }), 'utf8')
            console.log(`Created ${path.relative(cwd, dest) || '.oxlintrc.json'} with extends → ${extendOxlint}`)
        } else {
            for (const name of oxlintJson) {
                const filePath = path.join(cwd, name)
                let obj: Record<string, unknown>
                try {
                    obj = parseJsoncFile(filePath)
                } catch (e) {
                    console.error(`Oxlint: could not parse ${name}:`, e)
                    process.exitCode = 1
                    continue
                }
                const { changed, next } = addOxlintExtends(obj, extendOxlint, cwd, pkg)
                if (changed) {
                    fs.writeFileSync(filePath, stringifyConfig(next), 'utf8')
                    console.log(`Updated ${name}: added extends → ${extendOxlint}`)
                } else {
                    console.log(
                        `Oxlint ${name}: already references this package oxlintrc (${extendOxlint} or same file)`,
                    )
                }
            }
        }
    }

    if (oxfmtCode.length === 0) {
        let templateRaw: string
        try {
            templateRaw = fs.readFileSync(oxfmtTemplatePath, 'utf8')
        } catch (e) {
            console.error(`Oxfmt: could not read bundled template at ${oxfmtTemplatePath}:`, e)
            process.exitCode = 1
            return
        }
        const templateForRoot = oxfmtTemplateForProjectRoot(templateRaw)

        const oxfmtJson = existingInCwd(cwd, OXFMT_JSON_NAMES)
        if (oxfmtJson.length === 0) {
            const dest = path.join(cwd, '.oxfmtrc.jsonc')
            fs.writeFileSync(dest, templateForRoot, 'utf8')
            console.log(`Created ${path.relative(cwd, dest) || '.oxfmtrc.jsonc'} (copied from ${pkg} oxfmt template)`)
        } else {
            for (const name of oxfmtJson) {
                const filePath = path.join(cwd, name)
                const prev = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
                if (prev === templateForRoot) {
                    console.log(`Oxfmt ${name}: already matches package template`)
                    continue
                }
                fs.writeFileSync(filePath, templateForRoot, 'utf8')
                console.log(`Updated ${name}: replaced with package oxfmt template (oxfmt has no extends)`)
            }
        }
    }
}

run()
