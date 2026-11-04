import createDOMPurify from 'dompurify'

// For the HTML the admin pages build themselves around canister text. They use a few
// inline styles, so style stays, without positioning (no overlays) or url() (no remote loads).
const purify = createDOMPurify(window)
purify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName === 'style' && /position|url\(/i.test(data.attrValue)) data.keepAttr = false
})
const config = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['img', 'style', 'form', 'input', 'iframe'],
}

export function sanitizeHtml(html: string): string {
  return purify.sanitize(html, config) as unknown as string
}
