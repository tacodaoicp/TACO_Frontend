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
  // Safety net: never trap the user on the spinner if the bundle fails to load.
  // Normal teardown happens in bootExchange() within ~1-2s (and it mounts within
  // a 7s timeout even if the initial route stalls). If the app STILL hasn't
  // mounted by the deadline, show a recoverable error instead of a blank screen.
  // (DOM-built, no inline handlers — the asset-canister CSP blocks inline JS.)
  setTimeout(function () {
    var n = document.getElementById('ex-boot');
    if (!n) return;
    var app = document.getElementById('app');
    if (app && app.childElementCount > 0) { n.remove(); return; } // mounted fine
    n.innerHTML = '';
    var box = document.createElement('div');
    box.style.cssText = 'text-align:center;color:#fff;font-family:system-ui,sans-serif;padding:16px';
    var msg = document.createElement('p');
    msg.textContent = "Couldn't load the exchange.";
    var btn = document.createElement('button');
    btn.textContent = 'Retry';
    btn.style.cssText = 'margin-top:10px;padding:8px 20px;border-radius:8px;border:0;cursor:pointer;font:inherit';
    btn.addEventListener('click', function () { location.reload(); });
    box.appendChild(msg);
    box.appendChild(btn);
    n.appendChild(box);
  }, 12000);
})();
