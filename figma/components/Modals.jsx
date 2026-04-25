// components/Modals.jsx — Modals, Token selector, Transfer, Login curtain, States, Toasts

// ---------- Shared modal frame ----------
function MDL_Frame({ title, subtitle, width=440, onClose, children }) {
  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-overlay)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:24, backdropFilter:'blur(3px)'}}>
      <div className="tx-card" style={{width, maxWidth:'100%', padding:0, overflow:'hidden',
        boxShadow:'0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px var(--tx-line-2)'}}>
        <div style={{padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          borderBottom:'1px solid var(--tx-line)'}}>
          <div>
            <div style={{fontSize:15, fontWeight:700}}>{title}</div>
            {subtitle && <div className="tx-ink-3" style={{fontSize:12, marginTop:2}}>{subtitle}</div>}
          </div>
          <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{width:28, height:28, padding:0}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- Swap confirm ----------
function SwapConfirm() {
  return (
    <MDL_Frame title="Confirm swap" subtitle="Review before broadcasting">
      <div style={{padding:18}}>
        {/* Pay / receive */}
        <div className="tx-panel-2" style={{padding:14}}>
          <div className="tx-row tx-row--between">
            <div>
              <div className="tx-eyebrow">You pay</div>
              <div className="tx-mono tx-tnum" style={{fontSize:24, fontWeight:600, marginTop:4}}>82.00</div>
              <div className="tx-ink-3" style={{fontSize:11, marginTop:2}}>≈ $200.07</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <div style={{width:28, height:28, borderRadius:'50%', background:'#29abe2',
                color:'#fff', fontSize:10, fontWeight:700,
                display:'inline-flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.3)'}}>IC</div>
              <span style={{fontWeight:600}}>ICP</span>
            </div>
          </div>
        </div>

        <div style={{display:'flex', justifyContent:'center', margin:'-10px 0', position:'relative', zIndex:1}}>
          <div className="tx-card" style={{width:32, height:32, borderRadius:'50%',
            display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0, fontSize:14, color:'var(--tx-orange)'}}>↓</div>
        </div>

        <div className="tx-panel-2" style={{padding:14, border:'1px solid rgba(242,139,58,0.35)'}}>
          <div className="tx-row tx-row--between">
            <div>
              <div className="tx-eyebrow">You receive</div>
              <div className="tx-mono tx-tnum" style={{fontSize:24, fontWeight:600, marginTop:4, color:'var(--tx-orange)'}}>10,844.23</div>
              <div className="tx-ink-3" style={{fontSize:11, marginTop:2}}>≈ $200.07 · after slippage</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <div style={{width:28, height:28, borderRadius:'50%', background:'var(--tx-orange)',
                color:'#fff', fontSize:10, fontWeight:700,
                display:'inline-flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.3)'}}>TA</div>
              <span style={{fontWeight:600}}>TACO</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div style={{marginTop:16, display:'flex', flexDirection:'column', gap:6, fontSize:12}}>
          {[
            ['Rate', '1 ICP = 132.247 TACO'],
            ['Route', 'ICP → TACO · direct pool'],
            ['Price impact', '0.12%', 'buy'],
            ['Minimum received', '10,790.82 TACO'],
            ['Network fee', '0.0001 ICP'],
            ['Slippage', '0.50%'],
          ].map(([l, v, tone]) => (
            <div key={l} className="tx-row tx-row--between">
              <span className="tx-ink-3">{l}</span>
              <span className={`tx-mono tx-tnum ${tone?'tx-'+tone:''}`}>{v}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="tx-row" style={{gap:10, marginTop:18}}>
          <button className="tx-btn tx-btn--ghost tx-btn--md" style={{flex:1}}>Cancel</button>
          <button className="tx-btn tx-btn--primary tx-btn--md" style={{flex:2}}>Confirm swap</button>
        </div>
      </div>
    </MDL_Frame>
  );
}

// ---------- Swap result ----------
function SwapResult({ partial=true }) {
  const fillPct = partial ? 92 : 100;
  return (
    <MDL_Frame title={partial ? 'Partial fill' : 'Swap complete'}
      subtitle={partial ? 'Some of your order filled — retry the remainder?' : 'Transaction settled'}>
      <div style={{padding:'22px 18px 18px'}}>
        {/* Fill meter */}
        <div style={{textAlign:'center', marginBottom:18}}>
          <div style={{position:'relative', width:108, height:108, margin:'0 auto'}}>
            <svg viewBox="0 0 100 100" style={{width:'100%', height:'100%', transform:'rotate(-90deg)'}}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--tx-line-2)" strokeWidth="7"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--tx-orange)" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${fillPct * 2.638} 264`}/>
            </svg>
            <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
              <div className="tx-mono tx-tnum" style={{fontSize:26, fontWeight:700, letterSpacing:'-0.02em'}}>{fillPct}%</div>
              <div className="tx-ink-3" style={{fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em'}}>filled</div>
            </div>
          </div>
        </div>

        <div className="tx-panel-2" style={{padding:14, fontSize:12}}>
          <div className="tx-row tx-row--between">
            <span className="tx-ink-3">Sent</span>
            <span className="tx-mono tx-tnum">{partial ? '75.40' : '82.00'} ICP</span>
          </div>
          <div className="tx-row tx-row--between" style={{marginTop:4}}>
            <span className="tx-ink-3">Received</span>
            <span className="tx-mono tx-tnum tx-orange">{partial ? '9,976.58' : '10,844.23'} TACO</span>
          </div>
          <div className="tx-row tx-row--between" style={{marginTop:4}}>
            <span className="tx-ink-3">Transaction</span>
            <span className="tx-mono" style={{fontSize:10}}>0xa4e…9f3c ↗</span>
          </div>
        </div>

        {partial && (
          <div style={{marginTop:12, padding:'10px 12px', background:'var(--tx-warning-dim)',
            border:'1px solid rgba(196,90,10,0.3)', borderRadius:'var(--tx-r-md)', fontSize:12}}>
            <strong className="tx-warning">6.60 ICP unfilled</strong>
            <div className="tx-ink-3" style={{marginTop:2}}>Price moved outside slippage tolerance.</div>
          </div>
        )}

        <div className="tx-row" style={{gap:10, marginTop:18}}>
          {partial
            ? <>
                <button className="tx-btn tx-btn--ghost tx-btn--md" style={{flex:1}}>Dismiss</button>
                <button className="tx-btn tx-btn--primary tx-btn--md" style={{flex:2}}>Retry remainder</button>
              </>
            : <button className="tx-btn tx-btn--primary tx-btn--md" style={{flex:1}}>Done</button>}
        </div>
      </div>
    </MDL_Frame>
  );
}

// ---------- Token selector ----------
const TOKSEL_LIST = [
  { sym:'ICP',    name:'Internet Computer',  bal:'842.3578',  usd:'$2,055.65', color:'#29abe2', hot:true },
  { sym:'TACO',   name:'TACO',                bal:'124,850',   usd:'$1,989.21', color:'#f28b3a', hot:true },
  { sym:'ckBTC',  name:'Chain-key Bitcoin',   bal:'0.0428',    usd:'$2,842.00', color:'#f7931a', hot:true },
  { sym:'ckETH',  name:'Chain-key Ether',     bal:'1.2840',    usd:'$3,412.80', color:'#627eea' },
  { sym:'ckUSDC', name:'Chain-key USDC',      bal:'2,480.12',  usd:'$2,480.12', color:'#2775ca' },
  { sym:'NACHOS', name:'NACHOS Vault',        bal:'412.8',     usd:'$842.55',   color:'#f5c06b' },
  { sym:'DKP',    name:'Dragginz',            bal:'0',         usd:'—',         color:'#b25e95' },
  { sym:'SGLDT',  name:'Sneed Gold',          bal:'0',         usd:'—',         color:'#b8860b' },
];

function TokenSelector() {
  return (
    <MDL_Frame title="Select a token" width={440}>
      <div style={{padding:'14px 16px 12px'}}>
        <div className="tx-row" style={{gap:8, padding:'10px 12px', background:'var(--tx-surface-1)',
          border:'1px solid var(--tx-line)', borderRadius:'var(--tx-r-md)'}}>
          <span className="tx-ink-3" style={{fontSize:14}}>⌕</span>
          <input placeholder="Search name or paste canister ID"
            style={{flex:1, background:'transparent', border:0, color:'var(--tx-ink)', outline:'none', fontSize:13}}/>
          <span className="tx-badge tx-badge--square" style={{fontSize:9}}>Ctrl·K</span>
        </div>

        {/* Hot row */}
        <div className="tx-row" style={{gap:6, marginTop:12, flexWrap:'wrap'}}>
          {TOKSEL_LIST.filter(t=>t.hot).map(t => (
            <button key={t.sym} className="tx-row" style={{gap:6, padding:'4px 10px 4px 5px',
              background:'var(--tx-surface-2)', border:'1px solid var(--tx-line)', borderRadius:999, cursor:'pointer'}}>
              <div style={{width:18, height:18, borderRadius:'50%', background:t.color,
                color:'#fff', fontSize:8, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center'}}>
                {t.sym.slice(0,2)}
              </div>
              <span style={{fontSize:12, fontWeight:600}}>{t.sym}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{maxHeight:340, overflowY:'auto', borderTop:'1px solid var(--tx-line)'}} className="tx-scroll">
        {TOKSEL_LIST.map((t,i) => (
          <button key={t.sym} className="tx-row tx-row--between"
            style={{width:'100%', padding:'10px 16px', background:'transparent', border:0,
              borderBottom:'1px solid var(--tx-line)', cursor:'pointer', textAlign:'left'}}>
            <div className="tx-row" style={{gap:10}}>
              <div style={{width:30, height:30, borderRadius:'50%', background:t.color,
                color:'#fff', fontSize:10, fontWeight:700,
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 2px 6px rgba(0,0,0,0.3)'}}>{t.sym.slice(0,2)}</div>
              <div>
                <div style={{fontWeight:600, fontSize:13}}>{t.sym}</div>
                <div className="tx-ink-3" style={{fontSize:11}}>{t.name}</div>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div className="tx-mono tx-tnum" style={{fontSize:13}}>{t.bal}</div>
              <div className="tx-ink-3 tx-mono" style={{fontSize:10}}>{t.usd}</div>
            </div>
          </button>
        ))}
      </div>
    </MDL_Frame>
  );
}

// ---------- Transfer dialog ----------
function TransferDialog() {
  return (
    <MDL_Frame title="Send ICP" subtitle="Transfer from your exchange wallet">
      <div style={{padding:'16px 18px 18px'}}>
        <div className="tx-field">
          <span className="tx-label">Recipient</span>
          <input className="tx-input" placeholder="Principal or account ID"
            defaultValue="k7gat-daaaa-aaaan-qamba-cai"/>
        </div>

        <div className="tx-field" style={{marginTop:12}}>
          <span className="tx-label tx-row tx-row--between" style={{display:'flex'}}>
            <span>Amount</span>
            <span className="tx-ink-3" style={{fontSize:11, textTransform:'none', letterSpacing:0}}>
              Avail <span className="tx-mono tx-tnum tx-ink-2">842.3578</span></span>
          </span>
          <div className="tx-row" style={{gap:8}}>
            <input className="tx-input tx-input--mono" defaultValue="24.50"
              style={{flex:1, fontSize:22, height:48, fontWeight:600}}/>
            <div style={{display:'flex', alignItems:'center', padding:'0 14px', background:'var(--tx-surface-2)',
              border:'1px solid var(--tx-line)', borderRadius:'var(--tx-r-md)', fontWeight:600}}>ICP</div>
          </div>
          <div className="tx-row" style={{gap:4, marginTop:6}}>
            {[25,50,75,100].map(p => (
              <button key={p} className="tx-btn tx-btn--ghost tx-btn--sm" style={{flex:1, fontSize:11, height:26}}>{p===100?'Max':p+'%'}</button>
            ))}
          </div>
        </div>

        <div className="tx-field" style={{marginTop:12}}>
          <span className="tx-label">Memo (optional)</span>
          <input className="tx-input" placeholder="Reference…"/>
        </div>

        <div className="tx-panel-2" style={{marginTop:14, padding:12, fontSize:12}}>
          <div className="tx-row tx-row--between">
            <span className="tx-ink-3">Network fee</span>
            <span className="tx-mono tx-tnum">0.0001 ICP</span>
          </div>
          <div className="tx-row tx-row--between" style={{marginTop:4}}>
            <span className="tx-ink-3">You send total</span>
            <span className="tx-mono tx-tnum" style={{fontWeight:600}}>24.5001 ICP</span>
          </div>
        </div>

        <div className="tx-row" style={{gap:10, marginTop:16}}>
          <button className="tx-btn tx-btn--ghost tx-btn--md" style={{flex:1}}>Cancel</button>
          <button className="tx-btn tx-btn--primary tx-btn--md" style={{flex:2}}>Send</button>
        </div>
      </div>
    </MDL_Frame>
  );
}

// ---------- Login curtain ----------
function LoginCurtain() {
  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:40, position:'relative', overflow:'hidden'}}>
      {/* Glow */}
      <div style={{position:'absolute', width:520, height:520, borderRadius:'50%',
        background:'radial-gradient(closest-side, rgba(242,139,58,0.18), transparent 70%)',
        top:'10%', left:'50%', transform:'translateX(-50%)', pointerEvents:'none'}}/>

      <div style={{maxWidth:400, width:'100%', position:'relative', textAlign:'center'}}>
        <div style={{width:72, height:72, margin:'0 auto 20px', borderRadius:'50%',
          background:'linear-gradient(135deg, rgba(242,139,58,0.18), rgba(242,139,58,0.04))',
          border:'1px solid var(--tx-line-hi)',
          display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{fontSize:28, color:'var(--tx-orange)'}}>⌧</div>
        </div>
        <h2 className="tx-h1" style={{marginBottom:4, fontSize:32, display:'flex', gap:8, justifyContent:'center', alignItems:'baseline'}}>
          Log in <span className="tx-serif tx-orange" style={{fontSize:22, fontWeight:400}}>to trade</span>
        </h2>
        <div className="tx-ink-3" style={{fontSize:13, lineHeight:1.6, marginBottom:22}}>
          Connect Internet Identity to see balances, open orders and place trades. Your keys stay on your device.
        </div>
        <button className="tx-btn tx-btn--primary tx-btn--lg" style={{width:'100%', marginBottom:8}}>
          Continue with Internet Identity →
        </button>
        <button className="tx-btn tx-btn--ghost tx-btn--sm">Explore without logging in</button>

        <div style={{marginTop:28, paddingTop:18, borderTop:'1px solid var(--tx-line)',
          display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, textAlign:'left'}}>
          {[
            ['Non-custodial', 'Funds sit under your principal, not ours'],
            ['Gas-free',      'Trades settle in IC cycles, not ETH gas'],
            ['Open source',   'Every canister is public & verifiable'],
          ].map(([t,d]) => (
            <div key={t}>
              <div style={{fontSize:11, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase'}}>{t}</div>
              <div className="tx-ink-3" style={{fontSize:11, marginTop:3, lineHeight:1.45}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- States (empty / error / loading) ----------
function StatesSheet() {
  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)', overflow:'auto', padding:'28px 32px'}} className="tx-scroll">
      <div style={{maxWidth:1000, margin:'0 auto'}}>
        <h1 className="tx-h1" style={{marginBottom:4, display:'flex', gap:10, alignItems:'baseline'}}>
          States <span className="tx-serif tx-orange" style={{fontSize:20, fontWeight:400}}>empty · error · loading</span>
        </h1>
        <div className="tx-ink-3" style={{fontSize:12, marginBottom:22}}>Unified templates across every view.</div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16}}>
          {/* Empty */}
          <div className="tx-card" style={{padding:24, minHeight:280,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:10}}>
            <div style={{width:54, height:54, borderRadius:'50%', background:'var(--tx-surface-2)',
              border:'1px solid var(--tx-line-2)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'var(--tx-ink-3)'}}>◎</div>
            <div style={{fontWeight:700, fontSize:15, marginTop:4}}>No open orders</div>
            <div className="tx-ink-3" style={{fontSize:12, lineHeight:1.5, maxWidth:220}}>
              Place an order from the Pro or Easy view — it'll show up here instantly.
            </div>
            <button className="tx-btn tx-btn--primary tx-btn--sm" style={{marginTop:8}}>Open Easy Swap →</button>
          </div>

          {/* Error */}
          <div className="tx-card" style={{padding:24, minHeight:280,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:10,
            border:'1px solid rgba(235,0,0,0.28)'}}>
            <div style={{width:54, height:54, borderRadius:'50%', background:'var(--tx-sell-dim)',
              border:'1px solid rgba(217,64,64,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'var(--tx-sell)'}}>!</div>
            <div style={{fontWeight:700, fontSize:15, marginTop:4}}>Couldn't load orderbook</div>
            <div className="tx-ink-3" style={{fontSize:12, lineHeight:1.5, maxWidth:220}}>
              Request to <span className="tx-mono">exchange_backend</span> timed out after 6 seconds.
            </div>
            <button className="tx-btn tx-btn--outline tx-btn--sm" style={{marginTop:8}}>↻  Retry</button>
          </div>

          {/* Loading */}
          <div className="tx-card" style={{padding:20, minHeight:280, display:'flex', flexDirection:'column', gap:10}}>
            <div className="tx-eyebrow">Loading pools…</div>
            {Array.from({length:5}).map((_,i) => (
              <div key={i} className="tx-row" style={{gap:12, padding:'8px 0', borderBottom:i<4?'1px solid var(--tx-line)':'none'}}>
                <div className="tx-skeleton" style={{width:28, height:28, borderRadius:'50%'}}/>
                <div style={{flex:1, display:'flex', flexDirection:'column', gap:5}}>
                  <div className="tx-skeleton" style={{width:'60%', height:11, borderRadius:3}}/>
                  <div className="tx-skeleton" style={{width:'40%', height:9, borderRadius:3}}/>
                </div>
                <div className="tx-skeleton" style={{width:48, height:14, borderRadius:3}}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Toast stack specimen ----------
function ToastStack() {
  const toasts = [
    { tone:'success', title:'Swap confirmed', body:'82.00 ICP → 10,844.23 TACO', time:'just now', progress: 72 },
    { tone:'error',   title:'Order cancelled', body:'Price moved outside 0.50% slippage', time:'4s ago', progress: 38 },
    { tone:'warning', title:'Low cycles',     body:'exchange_backend balance below 200B', time:'18s ago', progress: 12 },
    { tone:'info',    title:'New pair listed', body:'TACO / ckETH is live', time:'1m ago', progress: 4 },
  ];
  const toneMap = {
    success: {border:'rgba(46,166,106,0.4)', bg:'var(--tx-buy-dim)',   icon:'✓', color:'var(--tx-buy)'},
    error:   {border:'rgba(217,64,64,0.45)', bg:'var(--tx-sell-dim)',  icon:'✕', color:'var(--tx-sell)'},
    warning: {border:'rgba(196,90,10,0.4)',  bg:'var(--tx-warning-dim)', icon:'⚠', color:'var(--tx-warning)'},
    info:    {border:'rgba(91,138,196,0.4)', bg:'var(--tx-info-dim)',  icon:'i', color:'var(--tx-info)'},
  };
  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)', padding:28, position:'relative', overflow:'hidden'}}>
      {/* faux app chrome in the background */}
      <div style={{position:'absolute', inset:28, border:'1px dashed var(--tx-line-2)', borderRadius:'var(--tx-r-lg)',
        display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:22, pointerEvents:'none'}}>
        <div>
          <div className="tx-eyebrow">taco·exchange · Pro</div>
          <div className="tx-h2" style={{marginTop:6, opacity:0.55}}>Toast stack</div>
          <div className="tx-ink-3" style={{fontSize:12, marginTop:2, opacity:0.7}}>Bottom-right, auto-dismiss with countdown bar, 4 statuses.</div>
        </div>
      </div>

      <div style={{position:'absolute', right:28, bottom:28, display:'flex', flexDirection:'column', gap:10, width:340}}>
        {toasts.map((t, i) => {
          const s = toneMap[t.tone];
          return (
            <div key={i} className="tx-card" style={{padding:0, overflow:'hidden',
              border:`1px solid ${s.border}`,
              boxShadow:'0 10px 24px rgba(0,0,0,0.35)'}}>
              <div style={{display:'flex', gap:10, padding:'11px 14px'}}>
                <div style={{width:24, height:24, borderRadius:'50%', background:s.bg,
                  color:s.color, fontSize:12, fontWeight:700,
                  display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>{s.icon}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div className="tx-row tx-row--between">
                    <div style={{fontWeight:600, fontSize:13}}>{t.title}</div>
                    <div className="tx-ink-3" style={{fontSize:10}}>{t.time}</div>
                  </div>
                  <div className="tx-ink-3" style={{fontSize:11, marginTop:2, lineHeight:1.4}}>{t.body}</div>
                </div>
                <button style={{background:'transparent', border:0, color:'var(--tx-ink-3)', cursor:'pointer', fontSize:11, padding:0}}>✕</button>
              </div>
              <div style={{height:2, background:'var(--tx-line-2)'}}>
                <div style={{height:'100%', width:`${t.progress}%`, background:s.color, opacity:0.8}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
