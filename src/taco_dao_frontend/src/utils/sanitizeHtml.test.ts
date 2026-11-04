// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from './sanitizeHtml'

const dom = (html: string) => {
  const el = document.createElement('div')
  el.innerHTML = sanitizeHtml(html)
  return el
}

describe('sanitizeHtml', () => {
  it('keeps the markup the admin reports use', () => {
    const el = dom('<div class="row"><table class="table"><tr><td><strong>Sold:</strong></td><td style="min-width: 20px">1 <span class="badge text-info">ICP</span></td></tr></table><i class="fa fa-check"></i><code>x</code></div>')
    expect(el.querySelector('.row table td strong')?.textContent).toBe('Sold:')
    expect(el.querySelector('td[style]')?.getAttribute('style')).toBe('min-width: 20px')
    expect(el.querySelector('span.badge')?.textContent).toBe('ICP')
    expect(el.querySelector('i.fa-check')).not.toBeNull()
  })

  it('keeps the data attributes the report buttons work by', () => {
    const el = dom('<button class="btn" data-action="fetchVP" data-block-id="7" data-bs-toggle="collapse">x</button><a href="/admin/nns">y</a>')
    expect(el.querySelector('button')?.getAttribute('data-action')).toBe('fetchVP')
    expect(el.querySelector('button')?.getAttribute('data-block-id')).toBe('7')
    expect(el.querySelector('button')?.getAttribute('data-bs-toggle')).toBe('collapse')
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/admin/nns')
  })

  it.each([
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)></svg>',
    '<iframe src="https://a.com"></iframe>',
    '<form action="https://a.com"><input name=x></form>',
    '<style>body{display:none}</style>',
    '<meta http-equiv="refresh" content="0;url=https://a.com">',
  ])('removes %s', (html) => {
    expect(dom(`ok ${html}`).querySelector('script,img,svg,iframe,form,input,style,meta')).toBeNull()
  })

  it('removes event handlers and script links', () => {
    const el = dom('<div onclick="alert(1)">a</div><a href="javascript:alert(1)">b</a>')
    expect(el.querySelector('[onclick]')).toBeNull()
    expect(el.querySelector('a')?.getAttribute('href')).toBeNull()
  })

  it('removes styles that could cover the page or load from elsewhere', () => {
    expect(dom('<div style="position:fixed;inset:0">x</div>').querySelector('[style]')).toBeNull()
    expect(dom('<div style="background:url(https://a.com/x)">x</div>').querySelector('[style]')).toBeNull()
  })
})
