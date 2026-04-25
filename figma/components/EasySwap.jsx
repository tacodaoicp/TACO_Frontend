// components/EasySwap.jsx — 480px retail swap

const ES_TOKENS = [
  { sym: 'ICP',   name: 'Internet Computer', bal: 842.35,    color: '#29abe2' },
  { sym: 'TACO',  name: 'TACO',              bal: 124850,    color: '#f28b3a' },
  { sym: 'ckBTC', name: 'Chain-key Bitcoin', bal: 0.0428,    color: '#f7931a' },
  { sym: 'ckETH', name: 'Chain-key Ether',   bal: 1.284,     color: '#627eea' },
  { sym: 'ckUSDC',name: 'Chain-key USDC',    bal: 2480.12,   color: '#2775ca' },
  { sym: 'NACHOS',name: 'NACHOS Vault',      bal: 412.8,     color: '#f5c06b' },
];

function TokenPill({ tok, onClick }) {
  return (
    <button onClick={onClick} className="tx-row" style={{
      gap:8, padding:'6px 10px 6px 6px',
      background:'var(--tx-surface-2)',
      border:'1px solid var(--tx-line)',
      borderRadius:999, cursor:'pointer', color:'var(--tx-ink)'
    }}>
      <div style={{width:26, height:26, borderRadius:'50%', background:tok.color,
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'-0.02em',
        boxShadow:'0 2px 6px rgba(0,0,0,0.25)'}}>
        {tok.sym.slice(0,2)}
      </div>
      <span style={{fontWeight:600, fontSize:14}}>{tok.sym}</span>
      <span className="tx-ink-3" style={{fontSize:11}}>▾</span>
    </button>
  );
}

function TokenChip({ sym, color, size=26 }) {
  return (
    <div style={{width:size, height:size, borderRadius:'50%', background:color,
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontSize:size<=22?9:10, fontWeight:700,
      boxShadow:'0 2px 6px rgba(0,0,0,0.25)', flexShrink:0}}>
      {sym.slice(0,2)}
    </div>
  );
}

function RouteRow({ percent, hops }) {
  return (
    <div className="tx-row" style={{marginTop:8, gap:12, padding:'10px 12px',
      background:'var(--tx-surface-1)', border:'1px solid var(--tx-line)',
      borderRadius:'var(--tx-r-md)'}}>
      <div className="tx-mono tx-tnum tx-orange" style={{fontSize:13, fontWeight:600, width:36}}>{percent}%</div>
      <div className="tx-row" style={{flex:1, gap:6, overflow:'hidden'}}>
        {hops.map((h, i) => (
          <React.Fragment key={i}>
            {i>0 && (
              <div className="tx-row" style={{gap:4, flexShrink:0}}>
                <span className="tx-ink-4" style={{fontSize:11}}>›</span>
                <span className="tx-mono tx-tnum tx-sell" style={{fontSize:10}}>{h.impact}</span>
                <span className="tx-ink-4" style={{fontSize:11}}>›</span>
              </div>
            )}
            <div className="tx-row" style={{gap:5, flexShrink:0}}>
              <TokenChip sym={h.sym} color={h.color} size={22}/>
              <span style={{fontSize:11, fontWeight:600}}>{h.sym}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function EasySwap() {
  const [fromTok, setFromTok] = React.useState(ES_TOKENS[0]);
  const [toTok, setToTok] = React.useState(ES_TOKENS[1]);
  const [amount, setAmount] = React.useState('50');
  const [pct, setPct] = React.useState(null);
  const [slip, setSlip] = React.useState('0.5');

  const rate = 54142.6;
  const out = (parseFloat(amount||0) * rate).toLocaleString(undefined, { maximumFractionDigits: 2 });

  function setPercent(p) {
    setPct(p);
    setAmount((fromTok.bal * p / 100).toFixed(2));
  }

  function flip() {
    const f = fromTok; setFromTok(toTok); setToTok(f);
  }

  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)', padding:40, boxSizing:'border-box',
      display:'flex', alignItems:'flex-start', justifyContent:'center'}}>

      {/* Ambient orange glow */}
      <div style={{position:'absolute', top:60, left:'50%', transform:'translateX(-50%)',
        width:520, height:320, background:'radial-gradient(ellipse at center, var(--tx-orange-dim) 0%, transparent 65%)',
        pointerEvents:'none', filter:'blur(20px)'}}/>

      <div style={{width:480, display:'flex', flexDirection:'column', gap:16, position:'relative'}}>
        {/* Top nav echo */}
        <div className="tx-row tx-row--between" style={{marginBottom:8}}>
          <div className="tx-row" style={{gap:8}}>
            <div className="tx-logo-mark">t</div>
            <div style={{fontWeight:700, letterSpacing:'-0.01em', fontSize:15}}>taco<span style={{color:'var(--tx-orange)'}}>·</span>exchange</div>
          </div>
          <div className="tx-row" style={{gap:4}}>
            <button className="tx-tab" aria-selected={true} style={{fontSize:13}}>Easy</button>
            <button className="tx-tab" style={{fontSize:13}}>Pro</button>
            <button className="tx-tab" style={{fontSize:13}}>Pool</button>
            <button className="tx-tab" style={{fontSize:13}}>Portfolio</button>
          </div>
        </div>

        <div>
          <h1 className="tx-h1" style={{display:'flex', alignItems:'baseline', gap:8}}>
            Swap <span className="tx-serif tx-orange" style={{fontSize:24, fontWeight:400}}>instantly</span>
          </h1>
          <div className="tx-ink-3" style={{fontSize:13, marginTop:4}}>
            Best route across TACO pools. No wrappers, no bridges.
          </div>
        </div>

        <div className="tx-card" style={{padding:18, display:'flex', flexDirection:'column', gap:12, position:'relative'}}>
          {/* From */}
          <div className="tx-panel-2" style={{padding:14}}>
            <div className="tx-row tx-row--between">
              <span className="tx-eyebrow">You pay</span>
              <span className="tx-ink-3" style={{fontSize:11}}>
                Balance <span className="tx-mono tx-tnum tx-ink-2">{fromTok.bal.toLocaleString()}</span>
              </span>
            </div>
            <div className="tx-row" style={{marginTop:8, gap:10}}>
              <input
                value={amount}
                onChange={e=>{setAmount(e.target.value); setPct(null);}}
                className="tx-input tx-input--mono"
                style={{border:0, background:'transparent', fontSize:32, fontWeight:500, height:48, padding:0, letterSpacing:'-0.02em'}}
              />
              <TokenPill tok={fromTok} onClick={()=>{}}/>
            </div>
            <div className="tx-row tx-row--between" style={{marginTop:6}}>
              <span className="tx-ink-3 tx-mono tx-tnum" style={{fontSize:12}}>≈ $ {(parseFloat(amount||0)*4.82).toFixed(2)}</span>
              <div className="tx-row" style={{gap:4}}>
                {[25,50,75,100].map(p => (
                  <button key={p} onClick={()=>setPercent(p)}
                    className="tx-btn tx-btn--ghost tx-btn--sm"
                    style={{height:22, padding:'0 8px', fontSize:11,
                      ...(pct===p ? {background:'var(--tx-orange-dim)', color:'var(--tx-orange)', borderColor:'var(--tx-orange-line)'} : {})}}>
                    {p===100?'Max':p+'%'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Flip button */}
          <div style={{display:'flex', justifyContent:'center', margin:'-20px 0', zIndex:2}}>
            <button onClick={flip} style={{
              width:36, height:36, borderRadius:'50%',
              background:'var(--tx-surface-2)',
              border:'3px solid var(--tx-bg)',
              color:'var(--tx-ink)', cursor:'pointer',
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              fontSize:14, boxShadow:'var(--tx-shadow-1)'
            }}>↓</button>
          </div>

          {/* To */}
          <div className="tx-panel-2" style={{padding:14}}>
            <div className="tx-row tx-row--between">
              <span className="tx-eyebrow">You receive</span>
              <span className="tx-ink-3" style={{fontSize:11}}>
                Balance <span className="tx-mono tx-tnum tx-ink-2">{toTok.bal.toLocaleString()}</span>
              </span>
            </div>
            <div className="tx-row" style={{marginTop:8, gap:10}}>
              <div className="tx-mono tx-tnum" style={{fontSize:32, fontWeight:500, letterSpacing:'-0.02em', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis'}}>
                {out}
              </div>
              <TokenPill tok={toTok} onClick={()=>{}}/>
            </div>
            <div className="tx-ink-3 tx-mono tx-tnum" style={{fontSize:12, marginTop:6}}>≈ $ {(parseFloat(out.replace(/,/g,''))*0.0887).toFixed(2)}</div>
          </div>

          {/* Rate + Price Impact */}
          <div className="tx-panel-2" style={{padding:'10px 12px', fontSize:12}}>
            <div className="tx-row tx-row--between">
              <span className="tx-ink-3">Rate</span>
              <span className="tx-row" style={{gap:4}}>
                <span className="tx-mono tx-tnum">1 ICP = {rate.toLocaleString()} TACO</span>
                <button className="tx-ink-3" style={{background:'transparent', border:0, color:'var(--tx-ink-3)', cursor:'pointer', padding:0, fontSize:12}}>⇄</button>
              </span>
            </div>
            <div className="tx-row tx-row--between" style={{marginTop:6}}>
              <span className="tx-ink-3">Price impact</span>
              <span className="tx-mono tx-tnum tx-buy">0.08%</span>
            </div>

            {/* Split route */}
            <div className="tx-row" style={{marginTop:10, gap:8}}>
              <span className="tx-badge tx-badge--square" style={{background:'var(--tx-buy-dim)', color:'var(--tx-buy)', borderColor:'transparent', letterSpacing:'0.06em'}}>
                SPLIT ROUTE
              </span>
              <span className="tx-ink-2" style={{fontSize:11}}>0.6% better output</span>
            </div>

            {/* Route 1 */}
            <RouteRow percent={90} hops={[
              { sym: 'ICP',  color: '#29abe2' },
              { sym: 'TACO', color: '#f28b3a', impact: '0.0%' },
            ]}/>

            {/* Route 2 */}
            <div style={{marginTop:8}}>
              <RouteRow percent={10} hops={[
                { sym: 'ICP',   color: '#29abe2' },
                { sym: 'ckBTC', color: '#f7931a', impact: '0.9%' },
                { sym: 'TACO',  color: '#f28b3a', impact: '2.6%' },
              ]}/>
            </div>

            <div className="tx-row tx-row--between" style={{marginTop:10, paddingTop:10, borderTop:'1px solid var(--tx-line)'}}>
              <span className="tx-ink-3">Slippage</span>
              <div className="tx-segment" style={{padding:1}}>
                {['0.1','0.5','1.0'].map(s => (
                  <button key={s} aria-pressed={slip===s} onClick={()=>setSlip(s)}
                    style={{height:20, padding:'0 8px', fontSize:11}}>{s}%</button>
                ))}
              </div>
            </div>
            <div className="tx-row tx-row--between" style={{marginTop:6}}>
              <span className="tx-ink-3">Min received</span>
              <span className="tx-mono tx-tnum">{(parseFloat(out.replace(/,/g,''))*(1-parseFloat(slip)/100)).toLocaleString(undefined,{maximumFractionDigits:2})} TACO</span>
            </div>
            <div className="tx-row tx-row--between" style={{marginTop:6}}>
              <span className="tx-ink-3">Fee (0.05%)</span>
              <span className="tx-mono tx-tnum">0.025 ICP <span className="tx-ink-3">≈ $0.12</span></span>
            </div>
          </div>

          <button className="tx-btn tx-btn--primary tx-btn--lg tx-btn--block" style={{fontSize:15, height:52, borderRadius:'var(--tx-r-lg)'}}>
            Swap · ICP → TACO
          </button>
        </div>

        {/* Tip */}
        <div className="tx-row" style={{gap:10, padding:'10px 14px', background:'var(--tx-surface-1)', border:'1px dashed var(--tx-line-2)', borderRadius:'var(--tx-r-md)'}}>
          <div style={{fontSize:18}}>🌮</div>
          <div style={{fontSize:12}}>
            <div style={{fontWeight:600}}>Trusted tokens only.</div>
            <div className="tx-ink-3" style={{marginTop:2}}>DAO-voted token list · click the name to see its due diligence report.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.EasySwap = EasySwap;
