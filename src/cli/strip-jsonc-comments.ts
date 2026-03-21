/**
 * Removes // line comments and slash-star block comments so JSON.parse can read .jsonc.
 * Respects double-quoted strings and backslash escapes (JSON string rules).
 */
export function stripJsoncComments(input: string): string {
    let out = ''
    let i = 0
    const len = input.length

    const enum S {
        Code,
        String,
        LineComment,
        BlockComment,
    }
    let state = S.Code
    let escapedInString = false

    while (i < len) {
        const c = input[i]!
        const next = input[i + 1]

        if (state === S.Code) {
            if (c === '"') {
                state = S.String
                escapedInString = false
                out += c
                i++
                continue
            }
            if (c === '/' && next === '/') {
                state = S.LineComment
                i += 2
                continue
            }
            if (c === '/' && next === '*') {
                state = S.BlockComment
                i += 2
                continue
            }
            out += c
            i++
            continue
        }

        if (state === S.String) {
            out += c
            if (escapedInString) {
                escapedInString = false
                i++
                continue
            }
            if (c === '\\') {
                escapedInString = true
                i++
                continue
            }
            if (c === '"') {
                state = S.Code
            }
            i++
            continue
        }

        if (state === S.LineComment) {
            if (c === '\n' || c === '\r') {
                state = S.Code
                out += c
            }
            i++
            continue
        }

        if (state === S.BlockComment) {
            if (c === '*' && next === '/') {
                state = S.Code
                i += 2
                continue
            }
            i++
            continue
        }
    }

    return out
}
