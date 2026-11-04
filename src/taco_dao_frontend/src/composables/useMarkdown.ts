import { shallowRef } from 'vue'

export type MarkdownRenderer = (src: string) => string

// Text from canisters (proposal summaries, rationales). markdown-it and DOMPurify
// load on first use, in their own chunks. Until they are in, or if they fail to
// load, the text shows escaped, so unsanitized text never reaches v-html.
const renderer = shallowRef<MarkdownRenderer | null>(null)
let loading: Promise<void> | null = null

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => ESCAPES[c])
}

const isHttps = (url: string) => /^https:\/\//i.test(url)

function hostOf(href: string | null): string {
  try { return new URL(href ?? '').hostname } catch { return '' }
}

export function createMarkdownRenderer(MarkdownIt: any, createDOMPurify: any): MarkdownRenderer {
  const md = new MarkdownIt({ html: false, linkify: true, maxNesting: 20 })
  md.disable('image')
  md.validateLink = isHttps

  // A link's text can say anything, so its domain shows beside it. A bare URL already shows it.
  md.renderer.rules.link_close = (tokens: any[], idx: number, options: any, _env: any, self: any) => {
    let open = idx
    while (tokens[open].type !== 'link_open') open--
    const bare = tokens[open].markup === 'linkify' || tokens[open].markup === 'autolink'
    const host = bare ? '' : hostOf(tokens[open].attrGet('href'))
    return self.renderToken(tokens, idx, options) + (host ? ` <span class="md-link-host">(${escapeHtml(host)})</span>` : '')
  }

  const purify = createDOMPurify(window)
  if (!purify.isSupported) throw new Error('DOMPurify is not supported here')
  purify.addHook('afterSanitizeAttributes', (node: Element) => {
    if (node.tagName !== 'A') return
    if (!isHttps(node.getAttribute('href') ?? '')) node.removeAttribute('href')
    node.setAttribute('rel', 'noopener nofollow ugc')
    node.setAttribute('target', '_blank')
  })
  const config = {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['img', 'style', 'form', 'input', 'iframe'],
    FORBID_ATTR: ['style'],
  }
  return (src: string) => purify.sanitize(md.render(src), config) as unknown as string
}

function load() {
  loading ??= Promise.all([import('markdown-it'), import('dompurify')])
    .then(([md, purify]) => { renderer.value = createMarkdownRenderer(md.default, purify.default) })
    .catch(() => { loading = null }) // the next use tries again
}

export function useMarkdown() {
  load()
  return {
    /** HTML that is safe for v-html: sanitized markdown, or escaped text until the sanitizer is in. */
    renderMarkdown(text: string | null | undefined): string {
      const src = text ?? ''
      return renderer.value ? renderer.value(src) : `<div style="white-space:pre-wrap">${escapeHtml(src)}</div>`
    },
  }
}
