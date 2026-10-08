import MagicString from 'magic-string'

// Chrome keeps a script's or stylesheet's text at one byte per character only
// while every character is Latin-1 (up to U+00FF). One other character makes
// the whole file two bytes per character for as long as the page lives.
// esbuild's charset 'ascii' (vite.config.js) escapes strings, templates, names
// and CSS, but leaves regex literals and comments as written. This escapes
// those too. It runs in renderChunk, before Rollup hashes the chunk, so file
// names still follow their content (assets/ is cached as immutable). Anything
// else left over, such as a tagged template whose raw text must not change,
// fails the build, and so does any such character in a CSS file or in a script
// emitted as an asset (the hashed boot spinner from build/immutable-assets.js).

const NOT_LATIN1 = /[^\x00-\xff]/u
const EACH_NOT_LATIN1 = /[^\x00-\xff]/gu

const u4 = (unit) => `\\u${unit.toString(16).toUpperCase().padStart(4, '0')}`
const uBraced = (cp) => `\\u{${cp.toString(16).toUpperCase()}}`

export default function latin1Output() {
  return {
    name: 'taco:latin1-output',
    apply: 'build',
    renderChunk: {
      order: 'post', // after Vite's esbuild minify
      handler(code, chunk) {
        if (!NOT_LATIN1.test(code)) return null
        const comments = []
        const tokens = []
        this.parse(code, { onComment: comments, onToken: tokens })
        // [start, end, regex flags or null for a comment]
        const spans = [
          ...comments.map((c) => [c.start, c.end, null]),
          ...tokens.filter((t) => t.type.label === 'regexp').map((t) => [t.start, t.end, t.value.flags]),
        ]
        const s = new MagicString(code)
        for (const { 0: char, index } of code.matchAll(EACH_NOT_LATIN1)) {
          const span = spans.find(([start, end]) => index > start && index < end)
          const cp = char.codePointAt(0)
          if (!span) {
            this.error(`${chunk.fileName}: U+${cp.toString(16).toUpperCase()} outside a comment or regex literal (a tagged template?) would store the file two-byte: ${JSON.stringify(code.slice(index - 40, index + 20))}`)
          }
          const flags = span[2]
          let start = index
          let escaped = cp > 0xffff ? uBraced(cp) : u4(cp)
          // U+2028 and U+2029 in a block comment count as line breaks for semicolon insertion, so keep a line break.
          if (flags === null && (cp === 0x2028 || cp === 0x2029)) escaped = '\n'
          if (flags !== null) {
            // Without the u or v flag a regex reads \u{...} differently, so use the two UTF-16 units.
            if (cp > 0xffff && !/[uv]/.test(flags)) escaped = char.split('').map((unit) => u4(unit.charCodeAt(0))).join('')
            // A backslash right before the character (an identity escape, allowed without u) means the character itself.
            let backslashes = 0
            while (code[index - 1 - backslashes] === '\\') backslashes++
            if (backslashes % 2) start--
          }
          s.overwrite(start, index + char.length, escaped)
        }
        return { code: s.toString(), map: s.generateMap({ hires: 'boundary' }) }
      },
    },
    generateBundle: {
      order: 'post', // once every CSS file and copied script is emitted
      handler(_, bundle) {
        for (const file of Object.values(bundle)) {
          if (file.type === 'asset' && /\.(css|js)$/.test(file.fileName) && NOT_LATIN1.test(Buffer.from(file.source).toString())) {
            this.error(`${file.fileName} has characters above U+00FF, so the browser would store it two-byte. For CSS check esbuild.charset in vite.config.js, for a copied script edit its source.`)
          }
        }
      },
    },
  }
}
