// Show the boot spinner only for the Exchange app. Runs synchronously
// during parse (before the deferred module script), using the same host/
// path detection as main.js, so the DAO app never flashes it.
//
// Extracted from index.html so it loads under CSP 'self' instead of needing
// an 'unsafe-inline' / sha256 hash for inline execution.
(function () {
  var h = location.hostname, p = location.pathname;
  var isExchange = h === 'exchange.tacodao.com' || h === 'exchange.ic0.io' || p.indexOf('/exchange') === 0;
  if (!isExchange) return;
  var el = document.getElementById('ex-boot');
  if (!el) return;
  el.style.display = 'flex';
  // Safety net: never trap the user on the spinner if the bundle fails to
  // load. Normal teardown happens in bootExchange() within ~1-2s.
  setTimeout(function () {
    var n = document.getElementById('ex-boot');
    if (n) n.remove();
  }, 20000);
})();
