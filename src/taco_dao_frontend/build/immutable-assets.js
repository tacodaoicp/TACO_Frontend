import fs from 'fs'
import path from 'path'

// public/.ic-assets.json5 lets browsers keep every file under assets/ for a
// year without asking again. That is only safe while a file name there always
// means the same bytes, so this plugin:
// 1. puts a hashed copy of each classic script that index.html loads from
//    public/ (the boot spinner) under assets/ and points index.html at it, so
//    an edited script always gets a new name. The public copy stays for pages
//    that still hold an older index.html.
// 2. fails the build when a plugin changes a chunk or asset after Rollup named
//    it, when a file under assets/ differs on disk from the bundle, or when a
//    file under assets/ has no content hash in its name (public/assets/).

const NAME = 'taco:immutable-assets'
const HASHED_NAME = /-[0-9a-f]{8}\.\w+(\.map)?$/
// Vite itself edits chunks after hashing in two places, and both only write in
// names of other hashed files: the preload lists and imports of empty CSS chunks.
const VITE_EDITS_AFTER_HASH = new Set(['vite:build-import-analysis', 'vite:css-post'])
const CLASSIC_SCRIPT_SRC = /(<script\b(?![^>]*\btype=)[^>]*\bsrc=")\/([^"?#]+\.js)"/g

const contentOf = (file) => (file.type === 'chunk' ? file.code : file.source)

function failOnEditsAfterHash(plugin) {
  const hook = plugin.generateBundle
  const handler = typeof hook === 'function' ? hook : hook.handler
  async function guarded(options, bundle, isWrite) {
    const before = Object.entries(bundle).map(([name, file]) => [name, contentOf(file)])
    const result = await handler.call(this, options, bundle, isWrite)
    for (const [name, content] of before) {
      if (bundle[name] && contentOf(bundle[name]) !== content) {
        this.error(`${plugin.name} changed ${name} after its name was hashed. Files under assets/ are cached as immutable, so change content before hashing (transform or renderChunk).`)
      }
    }
    return result
  }
  plugin.generateBundle = typeof hook === 'function' ? guarded : { ...hook, handler: guarded }
}

export default function immutableAssets() {
  let config
  const emitted = new Map() // public script path -> emitted asset reference
  const hashedNames = new Map() // public script path -> hashed file name under assets/
  return {
    name: NAME,
    apply: 'build',
    configResolved(resolved) {
      config = resolved
      for (const plugin of config.plugins) {
        if (plugin.generateBundle && plugin.name !== NAME && !VITE_EDITS_AFTER_HASH.has(plugin.name)) failOnEditsAfterHash(plugin)
      }
    },
    buildStart() {
      if (fs.existsSync(path.join(config.publicDir, 'assets'))) {
        this.error('public/assets/ would be copied to dist/assets/ without content hashes, but everything there is cached as immutable. Use another folder name.')
      }
      const html = fs.readFileSync(path.join(config.root, 'index.html'), 'utf8')
      for (const [, , src] of html.matchAll(CLASSIC_SCRIPT_SRC)) {
        const file = path.join(config.publicDir, src)
        if (fs.existsSync(file)) emitted.set(src, this.emitFile({ type: 'asset', name: path.basename(src), source: fs.readFileSync(file) }))
      }
    },
    generateBundle() {
      for (const [src, ref] of emitted) hashedNames.set(src, this.getFileName(ref))
    },
    transformIndexHtml(html) {
      return html.replace(CLASSIC_SCRIPT_SRC, (tag, start, src) => (hashedNames.has(src) ? `${start}${config.base}${hashedNames.get(src)}"` : tag))
    },
    writeBundle: {
      order: 'post',
      sequential: true,
      handler(options, bundle) {
        for (const [name, file] of Object.entries(bundle)) {
          if (name.startsWith('assets/') && !fs.readFileSync(path.join(options.dir, name)).equals(Buffer.from(contentOf(file)))) {
            this.error(`${name} was changed on disk after Rollup wrote it, but files under assets/ are cached as immutable.`)
          }
        }
        const assetsDir = path.join(options.dir, 'assets')
        const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir, { recursive: true }) : []
        const unhashed = files.filter((f) => !HASHED_NAME.test(f) && fs.statSync(path.join(assetsDir, f)).isFile())
        if (unhashed.length) this.error(`files under assets/ without a content hash in their name: ${unhashed.join(', ')}`)
      },
    },
  }
}
