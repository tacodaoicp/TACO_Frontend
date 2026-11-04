// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import createDOMPurify from 'dompurify'
import { createMarkdownRenderer, escapeHtml, useMarkdown } from './useMarkdown'

const render = createMarkdownRenderer(MarkdownIt, createDOMPurify)
const dom = (src: string) => {
  const el = document.createElement('div')
  el.innerHTML = render(src)
  return el
}

describe('renderMarkdown', () => {
  it('renders markdown', () => {
    const el = dom('# Title\n\n**bold** and `code`\n\n- one\n- two')
    expect(el.querySelector('h1')?.textContent).toBe('Title')
    expect(el.querySelector('strong')?.textContent).toBe('bold')
    expect(el.querySelector('code')?.textContent).toBe('code')
    expect(el.querySelectorAll('li').length).toBe(2)
  })

  it.each([
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '<iframe src="https://a.com"></iframe>',
    '<form action="https://a.com"><input name=x></form>',
    '<style>body{display:none}</style>',
    '<a href="javascript:alert(1)">x</a>',
    '<div style="position:fixed;inset:0">x</div>',
    '<meta http-equiv="refresh" content="0;url=https://a.com">',
  ])('shows raw HTML as text: %s', (src) => {
    const el = dom(src)
    expect(el.querySelector('script,img,svg,iframe,form,input,style,meta,[style],a[href^="javascript"]')).toBeNull()
    expect(el.textContent).toContain(src)
  })

  it('never renders an image', () => {
    expect(dom('![x](https://a.com/x.png)').querySelector('img')).toBeNull()
  })

  it.each([
    '[a](javascript:alert(1))',
    '[a](JaVaScRiPt:alert(1))',
    '[a](http://a.com)',
    '[a](//a.com)',
    '[a](/local)',
    '[a](data:text/html,x)',
    '[a](vbscript:x)',
    '<javascript:alert(1)>',
    'www.a.com',
    'me@a.com',
    '[a][r]\n\n[r]: javascript:alert(1)',
  ])('makes no link unless absolute https: %s', (src) => {
    expect(dom(src).querySelector('a')).toBeNull()
  })

  it('shows the real domain beside a link whose text says otherwise', () => {
    const el = dom('[paypal.com](https://evil.example/login)')
    const a = el.querySelector('a')!
    expect(a.getAttribute('href')).toBe('https://evil.example/login')
    expect(a.getAttribute('rel')).toBe('noopener nofollow ugc')
    expect(a.getAttribute('target')).toBe('_blank')
    expect(el.querySelector('.md-link-host')?.textContent).toBe('(evil.example)')
  })

  it('links a bare https URL without repeating its domain', () => {
    const el = dom('see https://a.com/b')
    expect(el.querySelector('a')?.getAttribute('href')).toBe('https://a.com/b')
    expect(el.querySelector('.md-link-host')).toBeNull()
  })

  it('survives deep nesting', () => {
    expect(() => render('>'.repeat(5000) + ' x')).not.toThrow()
    expect(() => render('['.repeat(5000))).not.toThrow()
  })

  it('renders nothing for empty text', () => {
    expect(render('')).toBe('')
  })
})

describe('before the sanitizer has loaded', () => {
  it('escapes everything', () => {
    expect(escapeHtml(`<a href="x" title='y'>&`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;')
    const html = useMarkdown().renderMarkdown('<img src=x onerror=alert(1)>')
    const el = document.createElement('div')
    el.innerHTML = html
    expect(el.querySelector('img')).toBeNull()
    expect(el.textContent).toBe('<img src=x onerror=alert(1)>')
  })

  it('handles a missing text', () => {
    expect(useMarkdown().renderMarkdown(null)).not.toContain('null')
  })
})
