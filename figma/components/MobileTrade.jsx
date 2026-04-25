// components/MobileTrade.jsx — Mobile / Tablet trade (< 768px)

function MT_MiniCandle({ up, w=8, h, gap=2 }) {
  return <div style={{width:w, height:h, background: up?'var(--tx-buy)':'var(--tx-sell)', marginRight:gap, opacity:0.85, borderRadius:1}}/>;
}

function MobileTrade() {
  const [side, setSide] = React.useState('buy');
  const [tab, setTab] = React.useState('chart');
  const candles = React.useMemo(() => Array.from({length: 34}).map((_,i)=>({up: Math.sin(i*0.7)>-0.2, h: 18 + Math.abs(Math.sin(i*0.5)*38) + (i>18?10:0)})),[]);

  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)', display:'flex', flexDirection:'column', overflow:'hidden'}}>
      {/* Top bar */}
      <div style={{padding:'10px 14px', borderBottom:'1px solid var(--tx-line)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div className="tx-logo-mark" style={{width:26, height:26, fontSize:13}}>t</div>
          <div style={{display:'flex', flexDirection:'column', lineHeight:1.1}}>
            <div style={{fontWeight:700, fontSize:14}}>TACO / ICP ▾</div>
            <div className="tx-ink-3" style={{fontSize:10}}>taco·exchange</div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div className="tx-mono tx-tnum tx-buy" style={{fontSize:15, fontWeight:600}}>0.01847</div>
          <div className="tx-buy" style={{fontSize:10}}>+4.82%</div>
        </div>
      </div>

      {/* Price header */}
      <div style={{padding:'12px 14px 6px'}}>
        <div className="tx-row tx-row--between" style={{marginBottom:6}}>
          <div>
            <div className="tx-ink-3" style={{fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em'}}>Last price</div>
            <div className="tx-mono tx-tnum" style={{fontSize:28, fontWeight:600, lineHeight:1, letterSpacing:'-0.02em'}}>0.01847</div>
            <div className="tx-ink-3" style={{fontSize:10, marginTop:2}}>≈ $0.2388</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div className="tx-ink-3" style={{fontSize:10}}>24h high</div>
            <div className="tx-mono tx-tnum" style={{fontSize:12}}>0.01912</div>
            <div className="tx-ink-3" style={{fontSize:10, marginTop:4}}>24h vol</div>
            <div className="tx-mono tx-tnum" style={{fontSize:12}}>1.24M ICP</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', borderBottom:'1px solid var(--tx-line)', padding:'0 14px'}}>
        {['chart','book','trades'].map(t => (
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:'8px 12px', background:'transparent', border:0, fontSize:12, fontWeight:600,
              color: tab===t ? 'var(--tx-orange)' : 'var(--tx-ink-3)',
              borderBottom: tab===t ? '2px solid var(--tx-orange)':'2px solid transparent',
              textTransform:'uppercase', letterSpacing:'0.06em', cursor:'pointer'}}>{t}</button>
        ))}
      </div>

      {/* Chart area */}
      <div style={{flex:1, padding:'14px', minHeight:0, display:'flex', flexDirection:'column'}}>
        {tab === 'chart' && (
          <>
            <div style={{display:'flex', alignItems:'flex-end', height:140, paddingBottom:4, gap:0, borderBottom:'1px solid var(--tx-line)'}}>
              {candles.map((c,i) => <MT_MiniCandle key={i} up={c.up} h={c.h}/>)}
            </div>
            <div className="tx-row" style={{gap:4, marginTop:10, flexWrap:'wrap'}}>
              {['5m','15m','1H','4H','1D','1W'].map((f,i)=>(
                <button key={f} aria-pressed={i===2} className="tx-tab" style={{fontSize:10, padding:'4px 8px'}}>{f}</button>
              ))}
            </div>
            {/* Depth preview under chart */}
            <div style={{marginTop:10, padding:10, background:'var(--tx-surface-1)', border:'1px solid var(--tx-line)', borderRadius:'var(--tx-r-md)'}}>
              <div className="tx-eyebrow" style={{marginBottom:6}}>Recent depth</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:11}}>
                <div>
                  {[['0.01846','12,480'],['0.01843','22,110'],['0.01840','19,230']].map(([p,a]) => (
                    <div key={p} className="tx-row tx-row--between" style={{position:'relative', padding:'2px 4px'}}>
                      <div style={{position:'absolute', inset:0, right:'40%', background:'var(--tx-buy-dim)', borderRadius:2}}/>
                      <span className="tx-mono tx-buy" style={{position:'relative'}}>{p}</span>
                      <span className="tx-mono tx-tnum" style={{position:'relative'}}>{a}</span>
                    </div>
                  ))}
                </div>
                <div>
                  {[['0.01848','6,820'],['0.01850','14,230'],['0.01854','21,800']].map(([p,a]) => (
                    <div key={p} className="tx-row tx-row--between" style={{position:'relative', padding:'2px 4px'}}>
                      <div style={{position:'absolute', inset:0, left:'40%', background:'var(--tx-sell-dim)', borderRadius:2}}/>
                      <span className="tx-mono tx-sell" style={{position:'relative'}}>{p}</span>
                      <span className="tx-mono tx-tnum" style={{position:'relative'}}>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order entry */}
      <div style={{padding:'10px 14px 14px', borderTop:'1px solid var(--tx-line)', background:'var(--tx-surface-1)'}}>
        <div className="tx-segment" style={{marginBottom:10}}>
          <button aria-pressed={side==='buy'} onClick={()=>setSide('buy')} className={side==='buy'?'tx-seg--buy':''} style={{flex:1, padding:'8px 0'}}>Buy TACO</button>
          <button aria-pressed={side==='sell'} onClick={()=>setSide('sell')} className={side==='sell'?'tx-seg--sell':''} style={{flex:1, padding:'8px 0'}}>Sell TACO</button>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8}}>
          <label className="tx-field">
            <span className="tx-label">Price</span>
            <input className="tx-input tx-input--mono" defaultValue="0.01847" style={{fontSize:14}}/>
          </label>
          <label className="tx-field">
            <span className="tx-label">Amount</span>
            <input className="tx-input tx-input--mono" defaultValue="5000" style={{fontSize:14}}/>
          </label>
        </div>
        <div className="tx-row" style={{gap:4, marginBottom:10}}>
          {[25,50,75,100].map(p=>(
            <button key={p} className="tx-btn tx-btn--ghost tx-btn--sm" style={{flex:1, height:26, fontSize:11}}>{p===100?'Max':p+'%'}</button>
          ))}
        </div>
        <button className={`tx-btn tx-btn--lg ${side==='buy'?'tx-btn--buy':'tx-btn--sell'}`} style={{width:'100%'}}>
          {side==='buy'?'Buy':'Sell'} TACO · 92.35 ICP
        </button>
      </div>

      {/* Bottom nav */}
      <div style={{height:56, display:'grid', gridTemplateColumns:'repeat(5,1fr)', borderTop:'1px solid var(--tx-line)', background:'var(--tx-surface-2)'}}>
        {[
          ['Easy','◎'],
          ['Trade','▤', true],
          ['Pool','◈'],
          ['Portfolio','◉'],
          ['More','···'],
        ].map(([label, icon, active]) => (
          <button key={label} style={{background:'transparent', border:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:2,
            color: active ? 'var(--tx-orange)' : 'var(--tx-ink-3)', fontSize:10, fontWeight:600,
            borderTop: active ? '2px solid var(--tx-orange)' : '2px solid transparent', cursor:'pointer'}}>
            <div style={{fontSize:16}}>{icon}</div>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
