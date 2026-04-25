// components/OTC.jsx — OTC / Private Orders

function OTC() {
  const [visibility, setVisibility] = React.useState('private');
  const [advOpen, setAdvOpen] = React.useState(false);
  const [code, setCode] = React.useState('');

  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)', overflow:'auto', padding:'28px 40px 40px'}} className="tx-scroll">
      <div style={{maxWidth:720, margin:'0 auto'}}>
        {/* Nav */}
        <div className="tx-row tx-row--between" style={{marginBottom:24}}>
          <div className="tx-row" style={{gap:8}}>
            <div className="tx-logo-mark">t</div>
            <div style={{fontWeight:700}}>taco<span style={{color:'var(--tx-orange)'}}>·</span>exchange</div>
          </div>
          <div className="tx-row" style={{gap:4}}>
            <button className="tx-tab" style={{fontSize:13}}>Easy</button>
            <button className="tx-tab" style={{fontSize:13}}>Pro</button>
            <button className="tx-tab" aria-selected={true} style={{fontSize:13}}>OTC</button>
            <button className="tx-tab" style={{fontSize:13}}>Pool</button>
            <button className="tx-tab" style={{fontSize:13}}>Portfolio</button>
          </div>
        </div>

        {/* Title */}
        <div style={{marginBottom:20}}>
          <h1 className="tx-h1" style={{display:'flex', alignItems:'baseline', gap:10}}>
            OTC <span className="tx-serif tx-orange" style={{fontSize:24, fontWeight:400}}>private orders</span>
          </h1>
          <div className="tx-ink-3" style={{fontSize:13, marginTop:4}}>
            Quiet table. Hand-pick your counter-party, or burn the order into pure chaincode and let them find it.
          </div>
        </div>

        {/* Access code */}
        <div className="tx-card" style={{padding:18, marginBottom:14}}>
          <div className="tx-row tx-row--between" style={{marginBottom:8}}>
            <div>
              <div style={{fontWeight:600}}>Enter access code</div>
              <div className="tx-ink-3" style={{fontSize:12, marginTop:2}}>Opening a secret order somebody sent you.</div>
            </div>
            <span className="tx-badge tx-badge--square" style={{background:'var(--tx-info)', color:'#fff', border:'none'}}>SECRET</span>
          </div>
          <div className="tx-row" style={{gap:8}}>
            <input className="tx-input tx-input--mono" value={code} onChange={e=>setCode(e.target.value)}
              placeholder="Paste access code here…" style={{fontSize:13}}/>
            <button className="tx-btn tx-btn--primary">Look up</button>
          </div>
        </div>

        {/* My orders */}
        <div style={{marginBottom:20}}>
          <h2 className="tx-h2" style={{marginBottom:10}}>My private & secret orders</h2>
          <div className="tx-panel" style={{padding:'28px 20px', textAlign:'center'}}>
            <div className="tx-ink-4" style={{fontSize:28, marginBottom:6}}>○</div>
            <div className="tx-ink-2" style={{fontSize:13}}>No private or secret orders</div>
            <div className="tx-ink-3" style={{fontSize:12, marginTop:4}}>Create one below, or look up a code to fill someone else's.</div>
          </div>
        </div>

        {/* Create */}
        <div className="tx-card" style={{padding:18}}>
          <h2 className="tx-h2" style={{marginBottom:14}}>Create new private order</h2>

          {/* Visibility */}
          <div className="tx-eyebrow" style={{marginBottom:8}}>Order visibility</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16}}>
            {[
              ['private', 'Private', 'Access code only', 'PRIVATE', 'var(--tx-orange)'],
              ['dao',     'DAO-Facaded', 'Maximum privacy', 'SECRET',  'var(--tx-info)'],
            ].map(([id,title,sub,badge,color]) => (
              <button key={id} onClick={()=>setVisibility(id)}
                style={{textAlign:'left', padding:'12px 14px', cursor:'pointer',
                  background: visibility===id ? 'var(--tx-orange-dim)' : 'var(--tx-surface-1)',
                  border: visibility===id ? '1px solid var(--tx-orange-line)' : '1px solid var(--tx-line)',
                  borderRadius:'var(--tx-r-md)', color:'var(--tx-ink)'}}>
                <div className="tx-row tx-row--between">
                  <div className="tx-row" style={{gap:8}}>
                    <div style={{width:14, height:14, borderRadius:'50%',
                      border: visibility===id ? '4px solid var(--tx-orange)' : '1px solid var(--tx-line-hi)',
                      background: visibility===id ? 'var(--tx-bg)' : 'transparent'}}/>
                    <span style={{fontWeight:600, fontSize:13}}>{title}</span>
                  </div>
                  <span className="tx-badge tx-badge--square" style={{background:color, color:'#fff', border:'none'}}>{badge}</span>
                </div>
                <div className="tx-ink-3" style={{fontSize:11, marginTop:6, paddingLeft:22}}>{sub}</div>
              </button>
            ))}
          </div>

          {/* Offering */}
          <div className="tx-eyebrow" style={{marginBottom:8}}>I'm offering</div>
          <div style={{display:'grid', gridTemplateColumns:'180px 1fr', gap:8, marginBottom:14}}>
            <button className="tx-input tx-row tx-row--between" style={{cursor:'pointer', textAlign:'left', height:38}}>
              <span className="tx-ink-3">Select token</span><span className="tx-ink-3">▾</span>
            </button>
            <input className="tx-input tx-input--mono" placeholder="Amount" style={{height:38, fontSize:14}}/>
          </div>

          {/* Wanting */}
          <div className="tx-eyebrow" style={{marginBottom:8}}>I want to receive</div>
          <div style={{display:'grid', gridTemplateColumns:'180px 1fr', gap:8, marginBottom:14}}>
            <button className="tx-input tx-row tx-row--between" style={{cursor:'pointer', textAlign:'left', height:38}}>
              <span className="tx-ink-3">Select token</span><span className="tx-ink-3">▾</span>
            </button>
            <input className="tx-input tx-input--mono" placeholder="Amount" style={{height:38, fontSize:14}}/>
          </div>

          {/* Implied rate preview */}
          <div className="tx-panel-2" style={{padding:'10px 12px', fontSize:12, marginBottom:14}}>
            <div className="tx-row tx-row--between">
              <span className="tx-ink-3">Implied rate</span>
              <span className="tx-mono tx-tnum tx-ink-3">—</span>
            </div>
            <div className="tx-row tx-row--between" style={{marginTop:6}}>
              <span className="tx-ink-3">vs. market</span>
              <span className="tx-mono tx-tnum tx-ink-3">—</span>
            </div>
          </div>

          {/* Advanced */}
          <button onClick={()=>setAdvOpen(!advOpen)} className="tx-row" style={{
            gap:6, background:'transparent', border:0, cursor:'pointer', color:'var(--tx-ink-2)',
            padding:'6px 0', fontSize:12, fontWeight:500}}>
            <span style={{transform: advOpen?'rotate(90deg)':'none', transition:'transform 140ms', display:'inline-block'}}>▸</span>
            Advanced settings
          </button>
          {advOpen && (
            <div className="tx-panel-2" style={{padding:12, marginTop:6, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <div>
                <div className="tx-ink-3" style={{fontSize:11, marginBottom:4}}>Expires in</div>
                <select className="tx-input">
                  <option>24 hours</option><option>7 days</option><option>30 days</option><option>Never</option>
                </select>
              </div>
              <div>
                <div className="tx-ink-3" style={{fontSize:11, marginBottom:4}}>Min fill</div>
                <input className="tx-input tx-input--mono" placeholder="AON"/>
              </div>
            </div>
          )}

          <button className="tx-btn tx-btn--primary tx-btn--lg tx-btn--block"
            style={{marginTop:16, height:48, fontSize:14, borderRadius:'var(--tx-r-lg)'}}>
            Create private order
          </button>
        </div>
      </div>
    </div>
  );
}

window.OTC = OTC;
