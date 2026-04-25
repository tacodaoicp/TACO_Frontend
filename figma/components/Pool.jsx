// components/Pool.jsx — Add Liquidity (Concentrated + Full Range)

const PL_POOLS = [
  { pair:'ICP/ckUSDC',   tvl:'$4.82M', vol:'$1.24M', fee:'0.05%', apr:'18.4%', a:'#29abe2', b:'#2775ca' },
  { pair:'TACO/ICP',     tvl:'$2.18M', vol:'$842K',  fee:'0.30%', apr:'42.1%', a:'#f28b3a', b:'#29abe2' },
  { pair:'ckBTC/ICP',    tvl:'$6.40M', vol:'$2.11M', fee:'0.05%', apr:'12.7%', a:'#f7931a', b:'#29abe2' },
  { pair:'NACHOS/TACO',  tvl:'$912K',  vol:'$184K',  fee:'0.30%', apr:'28.9%', a:'#f5c06b', b:'#f28b3a' },
  { pair:'DKP/ICP',      tvl:'$184K',  vol:'$48K',   fee:'1.00%', apr:'64.2%', a:'#c178ff', b:'#29abe2' },
];

function PL_LiquidityCurve({ minPct=32, maxPct=52 }) {
  // Stylized AMM liquidity distribution with active range highlight
  const w = 600, h = 160;
  const bars = 48;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block'}}>
      <defs>
        <linearGradient id="pl-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--tx-orange)" stopOpacity="0.35"/>
          <stop offset="1" stopColor="var(--tx-orange)" stopOpacity="0.02"/>
        </linearGradient>
        <linearGradient id="pl-fill-active" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--tx-orange)" stopOpacity="0.75"/>
          <stop offset="1" stopColor="var(--tx-orange)" stopOpacity="0.15"/>
        </linearGradient>
      </defs>
      {/* baseline grid */}
      {[0.25,0.5,0.75].map(t => (
        <line key={t} x1="0" x2={w} y1={h*t} y2={h*t} stroke="var(--tx-line)" strokeWidth="0.5" strokeDasharray="2 4"/>
      ))}
      {/* Bars — peak near current price, long tail right */}
      {Array.from({length:bars}).map((_,i) => {
        const x = (i/bars)*w;
        const peak = 18;
        const distance = Math.abs(i-peak);
        const height = Math.max(8, (h-20) * Math.exp(-distance*distance/60));
        const bw = w/bars - 2;
        const inRange = (i/bars)*100 >= minPct && (i/bars)*100 <= maxPct;
        return (
          <rect key={i}
            x={x+1} y={h-height-6}
            width={bw} height={height}
            fill={inRange ? 'url(#pl-fill-active)' : 'url(#pl-fill)'}
            stroke={inRange ? 'var(--tx-orange)' : 'none'} strokeWidth={inRange?0.5:0} strokeOpacity={0.5}
          />
        );
      })}
      {/* Current price marker */}
      <line x1={w*0.42} x2={w*0.42} y1="10" y2={h-4} stroke="var(--tx-amber)" strokeWidth="1.5" strokeDasharray="3 3"/>
      {/* Range min/max handles */}
      <line x1={w*minPct/100} x2={w*minPct/100} y1="0" y2={h-4} stroke="var(--tx-orange)" strokeWidth="2"/>
      <line x1={w*maxPct/100} x2={w*maxPct/100} y1="0" y2={h-4} stroke="var(--tx-orange)" strokeWidth="2"/>
      <circle cx={w*minPct/100} cy={h-50} r="6" fill="var(--tx-orange)" stroke="var(--tx-bg)" strokeWidth="2"/>
      <circle cx={w*maxPct/100} cy={h-50} r="6" fill="var(--tx-orange)" stroke="var(--tx-bg)" strokeWidth="2"/>
      <text x={w-8} y={h-12} textAnchor="end" fontSize="10" fill="var(--tx-ink-3)" fontFamily="JetBrains Mono, monospace">AMM liquidity</text>
    </svg>
  );
}

function PL_AmountField({ sym, color, bal, value, onChange }) {
  return (
    <div className="tx-panel-2" style={{padding:12}}>
      <div className="tx-row tx-row--between">
        <div className="tx-row" style={{gap:8}}>
          <div style={{width:22, height:22, borderRadius:'50%', background:color,
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontSize:9, fontWeight:700, boxShadow:'0 2px 6px rgba(0,0,0,0.25)'}}>{sym.slice(0,2)}</div>
          <span style={{fontWeight:600}}>{sym}</span>
        </div>
        <span className="tx-ink-3" style={{fontSize:11}}>Bal <span className="tx-mono tx-tnum tx-ink-2">{bal}</span></span>
      </div>
      <input value={value} onChange={e=>onChange && onChange(e.target.value)}
        className="tx-input tx-input--mono"
        style={{marginTop:8, border:0, background:'transparent', fontSize:22, fontWeight:500, height:32, padding:0, letterSpacing:'-0.01em'}}/>
      <div className="tx-row" style={{gap:4, marginTop:6}}>
        {[25,50,75,100].map(p => (
          <button key={p} className="tx-btn tx-btn--ghost tx-btn--sm"
            style={{flex:1, height:22, padding:0, fontSize:11}}>
            {p===100?'Max':p+'%'}
          </button>
        ))}
      </div>
    </div>
  );
}

function Pool({ initialMode = 'concentrated' } = {}) {
  const [tab, setTab] = React.useState('add');
  const [mode, setMode] = React.useState(initialMode);
  const [minPrice, setMinPrice] = React.useState('1.8299');
  const [maxPrice, setMaxPrice] = React.useState('3.0499');

  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)', overflow:'auto', padding:'28px 40px 40px'}} className="tx-scroll">
      <div style={{maxWidth:1200, margin:'0 auto'}}>
        {/* Top nav */}
        <div className="tx-row tx-row--between" style={{marginBottom:20}}>
          <div className="tx-row" style={{gap:8}}>
            <div className="tx-logo-mark">t</div>
            <div style={{fontWeight:700}}>taco<span style={{color:'var(--tx-orange)'}}>·</span>exchange</div>
          </div>
          <div className="tx-row" style={{gap:4}}>
            <button className="tx-tab" style={{fontSize:13}}>Easy</button>
            <button className="tx-tab" style={{fontSize:13}}>Pro</button>
            <button className="tx-tab" aria-selected={true} style={{fontSize:13}}>Pool</button>
            <button className="tx-tab" style={{fontSize:13}}>Portfolio</button>
          </div>
        </div>

        {/* H1 */}
        <div style={{marginBottom:20}}>
          <h1 className="tx-h1" style={{display:'flex', alignItems:'baseline', gap:10}}>
            Liquidity <span className="tx-serif tx-orange" style={{fontSize:24, fontWeight:400}}>pools</span>
          </h1>
          <div className="tx-ink-3" style={{fontSize:13, marginTop:4}}>
            Provide liquidity for TACO pairs. Concentrated ranges earn up to 4.4× the fees.
          </div>
        </div>

        {/* Segment: All Pools / Add Liquidity */}
        <div className="tx-segment" style={{marginBottom:20}}>
          <button aria-pressed={tab==='all'} onClick={()=>setTab('all')} style={{padding:'6px 18px'}}>All Pools</button>
          <button aria-pressed={tab==='add'} onClick={()=>setTab('add')} style={{padding:'6px 18px'}}>Add Liquidity</button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'360px 1fr', gap:20}}>
          {/* LEFT: pool + mode + deposit amounts */}
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            <div className="tx-card" style={{padding:16}}>
              <div className="tx-eyebrow" style={{marginBottom:6}}>Pool</div>
              <button className="tx-row tx-row--between tx-input" style={{height:44, cursor:'pointer', textAlign:'left'}}>
                <div className="tx-row" style={{gap:8}}>
                  <div style={{display:'flex'}}>
                    <div style={{width:22, height:22, borderRadius:'50%', background:'#29abe2',
                      color:'#fff', fontSize:9, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center',
                      boxShadow:'0 2px 6px rgba(0,0,0,0.3)'}}>IC</div>
                    <div style={{width:22, height:22, borderRadius:'50%', background:'#2775ca', marginLeft:-6,
                      color:'#fff', fontSize:9, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center',
                      boxShadow:'0 2px 6px rgba(0,0,0,0.3)', border:'1.5px solid var(--tx-surface-2)'}}>ck</div>
                  </div>
                  <span style={{fontWeight:600}}>ICP / ckUSDC</span>
                </div>
                <span className="tx-ink-3">▾</span>
              </button>

              <div className="tx-segment" style={{width:'100%', marginTop:12}}>
                <button style={{flex:1}} aria-pressed={mode==='concentrated'} onClick={()=>setMode('concentrated')}>Concentrated</button>
                <button style={{flex:1}} aria-pressed={mode==='full'}         onClick={()=>setMode('full')}>Full Range</button>
              </div>

              <div className="tx-panel-2" style={{padding:'10px 12px', marginTop:12, fontSize:12}}>
                <div className="tx-row tx-row--between">
                  <span className="tx-ink-3">Current price</span>
                  <span className="tx-mono tx-tnum">1 ICP = 2.4399 ckUSDC</span>
                </div>
                <div className="tx-row tx-row--between" style={{marginTop:4}}>
                  <span className="tx-ink-3">Fee tier</span>
                  <span className="tx-badge tx-badge--orange tx-badge--square">0.05%</span>
                </div>
              </div>
            </div>

            <div className="tx-card" style={{padding:16}}>
              <div className="tx-eyebrow" style={{marginBottom:10}}>Deposit amounts</div>
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                <PL_AmountField sym="ICP"    color="#29abe2" bal="418.7678"  value="82.0"/>
                <PL_AmountField sym="ckUSDC" color="#2775ca" bal="50.4077"   value="200.07"/>
              </div>

              {mode==='concentrated' && (
                <div className="tx-row" style={{marginTop:12, gap:10, padding:'10px 12px',
                  background:'var(--tx-buy-dim)',
                  border:'1px solid rgba(59,168,122,0.25)',
                  borderRadius:'var(--tx-r-md)'}}>
                  <div style={{fontSize:16}}>⚡</div>
                  <div style={{fontSize:12}}>
                    <div className="tx-buy" style={{fontWeight:600}}>4.4× capital efficiency</div>
                    <div className="tx-ink-3" style={{marginTop:2}}>vs full range at this width</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Range + summary */}
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            {mode==='concentrated' ? (
              <div className="tx-card" style={{padding:16}}>
                <div className="tx-row tx-row--between" style={{marginBottom:10}}>
                  <h2 className="tx-h2">Set price range</h2>
                  <div className="tx-segment" style={{padding:2}}>
                    <button aria-pressed={true} style={{fontSize:11}}>ICP</button>
                    <button style={{fontSize:11}}>ckUSDC</button>
                  </div>
                </div>

                <div style={{background:'var(--tx-surface-1)', border:'1px solid var(--tx-line)',
                  borderRadius:'var(--tx-r-md)', padding:'8px 12px 4px'}}>
                  <PL_LiquidityCurve minPct={32} maxPct={52}/>
                  <div className="tx-row tx-row--between tx-mono" style={{fontSize:10, color:'var(--tx-ink-3)', padding:'4px 2px 0'}}>
                    <span>1.995</span><span>9.857</span><span>19.592</span><span>29.328</span><span>39.063</span><span>48.7</span>
                  </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:14}}>
                  {[
                    ['Min price', minPrice, setMinPrice],
                    ['Max price', maxPrice, setMaxPrice],
                  ].map(([lbl,val,setter]) => (
                    <div key={lbl} className="tx-panel-2" style={{padding:'10px 12px'}}>
                      <div className="tx-ink-3" style={{fontSize:11}}>{lbl}</div>
                      <div className="tx-row" style={{gap:6, marginTop:4, alignItems:'center'}}>
                        <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{width:26, height:26, padding:0}}>−</button>
                        <input value={val} onChange={e=>setter(e.target.value)}
                          className="tx-mono tx-tnum"
                          style={{flex:1, background:'transparent', border:0, color:'var(--tx-ink)',
                            fontSize:20, fontWeight:600, textAlign:'center', padding:0, outline:'none', minWidth:0}}/>
                        <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{width:26, height:26, padding:0}}>+</button>
                      </div>
                      <div className="tx-ink-3" style={{fontSize:10, textAlign:'center', marginTop:2}}>ICP per ckUSDC</div>
                    </div>
                  ))}
                </div>

                <div className="tx-row" style={{gap:6, marginTop:10, flexWrap:'wrap'}}>
                  {['±5%','±10%','±20%','±50%','±75%'].map(p => (
                    <button key={p} className="tx-btn tx-btn--ghost tx-btn--sm" style={{flex:1, fontSize:11}}>{p}</button>
                  ))}
                </div>
                <div className="tx-row" style={{gap:6, marginTop:6}}>
                  <button className="tx-btn tx-btn--outline tx-btn--sm" style={{flex:1}}>Auto</button>
                  <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{flex:1}}>Full Range</button>
                  <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{flex:1}}>Reset</button>
                </div>
              </div>
            ) : (
              <div className="tx-card" style={{padding:16}}>
                <h2 className="tx-h2" style={{marginBottom:10}}>Full Range</h2>
                <div className="tx-panel-2" style={{padding:'12px 14px', fontSize:13}}>
                  <div className="tx-row tx-row--between">
                    <span className="tx-ink-3">1 ICP</span>
                    <span className="tx-mono tx-tnum">= 2.4399 ckUSDC</span>
                  </div>
                  <div className="tx-row tx-row--between" style={{marginTop:6}}>
                    <span className="tx-ink-3">1 ckUSDC</span>
                    <span className="tx-mono tx-tnum">= 0.4099 ICP</span>
                  </div>
                </div>
                <div className="tx-ink-3" style={{fontSize:12, marginTop:10, lineHeight:1.5}}>
                  Provides liquidity across all prices (0 → ∞). Simpler, lower capital efficiency, no range management.
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="tx-card" style={{padding:16}}>
              <div className="tx-eyebrow" style={{marginBottom:10}}>Position summary</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:12}}>
                <div className="tx-panel-2" style={{padding:'10px 12px'}}>
                  <div className="tx-ink-3">Total deposit</div>
                  <div className="tx-mono tx-tnum" style={{fontSize:18, fontWeight:500, marginTop:2}}>$ 400.21</div>
                </div>
                <div className="tx-panel-2" style={{padding:'10px 12px'}}>
                  <div className="tx-ink-3">Est. APR</div>
                  <div className="tx-mono tx-tnum tx-buy" style={{fontSize:18, fontWeight:500, marginTop:2}}>+ 24.8%</div>
                </div>
                <div className="tx-panel-2" style={{padding:'10px 12px'}}>
                  <div className="tx-ink-3">Pool share</div>
                  <div className="tx-mono tx-tnum" style={{fontSize:14, marginTop:2}}>0.0083%</div>
                </div>
                <div className="tx-panel-2" style={{padding:'10px 12px'}}>
                  <div className="tx-ink-3">Fee tier</div>
                  <div className="tx-mono tx-tnum" style={{fontSize:14, marginTop:2}}>0.05%</div>
                </div>
              </div>
              <button className="tx-btn tx-btn--primary tx-btn--lg tx-btn--block"
                style={{marginTop:12, height:48, fontSize:14, borderRadius:'var(--tx-r-lg)'}}>
                Add Liquidity {mode==='full' && '(Full Range)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Pool = Pool;
window.PoolFullRange = function PoolFullRange() { return <Pool initialMode="full"/>; };
window.PoolList = function PoolList() {
  const rows = PL_POOLS;
  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)', overflow:'auto', padding:'28px 40px 40px'}} className="tx-scroll">
      <div style={{maxWidth:1200, margin:'0 auto'}}>
        <div className="tx-row tx-row--between" style={{marginBottom:20}}>
          <div className="tx-row" style={{gap:8}}>
            <div className="tx-logo-mark">t</div>
            <div style={{fontWeight:700}}>taco<span style={{color:'var(--tx-orange)'}}>·</span>exchange</div>
          </div>
          <div className="tx-row" style={{gap:4}}>
            <button className="tx-tab" style={{fontSize:13}}>Easy</button>
            <button className="tx-tab" style={{fontSize:13}}>Pro</button>
            <button className="tx-tab" aria-selected={true} style={{fontSize:13}}>Pool</button>
            <button className="tx-tab" style={{fontSize:13}}>Portfolio</button>
          </div>
        </div>
        <h1 className="tx-h1" style={{display:'flex', alignItems:'baseline', gap:10, marginBottom:16}}>
          Liquidity <span className="tx-serif tx-orange" style={{fontSize:24, fontWeight:400}}>pools</span>
        </h1>
        <div className="tx-segment" style={{marginBottom:16}}>
          <button aria-pressed={true} style={{padding:'6px 18px'}}>All Pools</button>
          <button style={{padding:'6px 18px'}}>Add Liquidity</button>
        </div>
        <input className="tx-input" placeholder="Search pools…" style={{marginBottom:14}}/>
        <table className="tx-table">
          <thead>
            <tr>
              <th>Pair</th>
              <th style={{textAlign:'right'}}>TVL</th>
              <th style={{textAlign:'right'}}>Vol 24h</th>
              <th style={{textAlign:'right'}}>APR</th>
              <th style={{textAlign:'right'}}>Fee</th>
              <th style={{textAlign:'right'}}>Price</th>
              <th style={{textAlign:'right'}}>24h</th>
              <th style={{textAlign:'right', width:120}}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i}>
                <td>
                  <div className="tx-row" style={{gap:10}}>
                    <div style={{display:'flex'}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:r.a,color:'#fff',fontSize:9,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,0.3)'}}>{r.pair.split('/')[0].slice(0,2)}</div>
                      <div style={{width:22,height:22,borderRadius:'50%',background:r.b,marginLeft:-6,color:'#fff',fontSize:9,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,0.3)',border:'1.5px solid var(--tx-surface-2)'}}>{r.pair.split('/')[1].slice(0,2)}</div>
                    </div>
                    <span style={{fontWeight:600}}>{r.pair}</span>
                  </div>
                </td>
                <td className="num">{r.tvl}</td>
                <td className="num">{r.vol}</td>
                <td className="num tx-buy">{r.apr}</td>
                <td className="num"><span className="tx-badge tx-badge--square">{r.fee}</span></td>
                <td className="num">{(Math.random()*1).toFixed(6)}</td>
                <td className="num" style={{color: i%2?'var(--tx-sell)':'var(--tx-buy)'}}>{i%2?'-':'+'}{(Math.random()*5).toFixed(2)}%</td>
                <td style={{textAlign:'right'}}>
                  <div className="tx-row" style={{gap:4, justifyContent:'flex-end'}}>
                    <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{height:24, fontSize:11}}>Trade</button>
                    <button className="tx-btn tx-btn--outline tx-btn--sm" style={{height:24, fontSize:11}}>Add LP</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
