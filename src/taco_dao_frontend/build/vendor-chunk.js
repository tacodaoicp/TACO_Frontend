// Vue, Pinia and the small Vite and commonjs helpers get a chunk of their own.
// In the entry chunk, any app edit changed the entry's hash and, through the
// import names, renamed almost every chunk, so returning visitors downloaded
// nearly the whole app again after each deploy.
// Match whole package folders: a loose 'vue' match would also take
// vue3-apexcharts, and Rollup would then pull apexcharts into this chunk,
// which loads on every page.
const VENDOR_VUE = /[\\/]node_modules[\\/](?:vue|@vue[\\/][^\\/]+|pinia|vue-demi)[\\/]/
const HELPERS = new Set(['\0vite/preload-helper', '\0commonjsHelpers.js'])
const isVendorVue = (id) => VENDOR_VUE.test(id) || HELPERS.has(id)

export function vendorChunks(id) {
  if (isVendorVue(id)) return 'vendor-vue'
}

// Rollup also moves the static imports of those modules into the chunk. Fail
// the build if that ever brings in anything else (after a Pinia upgrade, say).
export function checkVendorChunk() {
  return {
    name: 'taco:check-vendor-chunk',
    apply: 'build',
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'chunk' || file.name !== 'vendor-vue') continue
        const others = Object.keys(file.modules).filter((id) => !isVendorVue(id))
        if (others.length) this.error(`vendor-vue loads on every page but would also hold ${others.join(', ')}. Keep it to Vue, Pinia and the helpers (build/vendor-chunk.js).`)
      }
    },
  }
}
