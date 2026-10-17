import path from 'path'

// A DAO tab no longer loads and runs the code of the other pages at startup.
// At idle App.vue downloads their files instead, without running them, so a
// first visit, a tap while offline or a tap in a tab that outlived a deploy
// reads them from the HTTP cache as before. The hashed file names exist only
// after bundling, so this plugin writes them into index.html (always fetched
// fresh, so it matches the build that serves it) as JSON: per group, the JS
// and CSS its pages load on top of what every page loads at startup.

// read by prefetchPages in App.vue
const ID = 'taco-prefetch'

// loaded at startup on every page: the entry (main.js), App, Home (always
// mounted) and the router and click-away chunks main.js loads with App
const STARTUP = ['src/App.vue', 'src/views/HomeView.vue', 'vue-router', 'vue3-click-away']

// the pages startup used to run (HomeView and App.vue) and the chart library
const GROUPS = {
  pages: [
    'src/views/VoteView.vue', 'src/views/DaoView.vue', 'src/views/InfoView.vue', 'src/views/ChatView.vue',
    'src/views/ReportsView.vue', 'src/views/WalletView.vue', 'src/views/NachosVaultView.vue',
    'src/views/BuyTacoView.vue', 'src/views/PerformanceView.vue', 'vue3-apexcharts',
  ],
  // logged in
  login: ['src/views/RewardsView.vue'],
  // logged in admins, or a browser that opened the admin pages before
  admin: [
    'src/views/AdminView.vue', 'src/views/AdminTradeView.vue', 'src/views/AdminPriceView.vue',
    'src/views/AdminPriceHistoryView.vue', 'src/views/AdminArchiveView.vue', 'src/views/AdminNeuronView.vue',
    'src/views/AdminVotesView.vue', 'src/views/AdminRewardsView.vue', 'src/views/AdminRewardsBalancesView.vue',
    'src/views/AdminDistributionsView.vue', 'src/views/AdminClaimsView.vue', 'src/views/AdminNNSView.vue',
    'src/views/SystemView.vue',
  ],
}

export default function pagePrefetch() {
  let root
  return {
    name: 'taco:page-prefetch',
    apply: 'build',
    configResolved(config) {
      root = config.root
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        if (!bundle) return
        const chunks = Object.values(bundle).filter((file) => file.type === 'chunk')
        // a source file (src/...) or a package's own chunk
        const chunkOf = (key) => {
          const found = chunks.find((chunk) => chunk.facadeModuleId && (key.startsWith('src/')
            ? path.relative(root, chunk.facadeModuleId).split(path.sep).join('/') === key
            : chunk.facadeModuleId.split(path.sep).join('/').includes(`/node_modules/${key}/`)))
          if (!found) throw new Error(`[taco:page-prefetch] no chunk of its own for ${key}. Update build/page-prefetch.js.`)
          return found
        }
        // a chunk, the chunks it imports and their CSS
        const addClosure = (chunk, files) => {
          if (!chunk || files.has(chunk.fileName)) return
          files.add(chunk.fileName)
          chunk.viteMetadata?.importedCss.forEach((css) => files.add(css))
          chunk.imports.forEach((name) => addClosure(bundle[name], files))
        }
        const seen = new Set()
        chunks.filter((chunk) => chunk.isEntry).forEach((chunk) => addClosure(chunk, seen))
        STARTUP.forEach((key) => addClosure(chunkOf(key), seen))
        const lists = {}
        for (const [group, keys] of Object.entries(GROUPS)) {
          const files = new Set()
          keys.forEach((key) => addClosure(chunkOf(key), files))
          lists[group] = [...files].filter((file) => !seen.has(file))
          lists[group].forEach((file) => seen.add(file))
        }
        return [{
          tag: 'script',
          attrs: { type: 'application/json', id: ID },
          children: JSON.stringify(lists).replace(/</g, '\\u003c'),
          injectTo: 'body',
        }]
      },
    },
  }
}
