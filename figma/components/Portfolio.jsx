// components/Portfolio.jsx — user dashboard

const PF_HOLDINGS = [
  { sym: 'TACO',   name: 'TACO',              amount: 124850,    value: 2304.37, chg: 4.82,  color: '#f28b3a' },
  { sym: 'ICP',    name: 'Internet Computer', amount: 842.35,    value: 4061.13, chg: -1.24, color: '#29abe2' },
  { sym: 'ckBTC',  name: 'Chain-key Bitcoin', amount: 0.0428,    value: 2918.44, chg: 0.32,  color: '#f7931a' },
  { sym: 'NACHOS', name: 'NACHOS Vault',      amount: 412.8,     value: 1240.65, chg: 2.18,  color: '#f5c06b' },
  { sym: 'ckUSDC', name: 'Chain-key USDC',    amount: 2480.12,   value: 2480.12, chg: 0.01,  color: '#2775ca' },
  { sym: 'ckETH',  name: 'Chain-key Ether',   bal: 1.284,        amount: 1.284,  value: 3614.92, chg: 1.82, color: '#627eea' },
];

function PF_Sparkline({ up }) {
  const pts = up
    ? '0,14 10,12 20,13 30,10 40,8 50,9 60,6 70,7 80,4 90,5 100,2'
    : '0,4 10,6 20,5 30,8 40,7 50,9 60,10 70,8 80,11 90,10 100,12';
  return (
    <svg width="100" height="18" viewBox="0 0 100 18" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={up?'var(--tx-buy)':'var(--tx-sell)'} strokeWidth="1.5"/>
    </svg>
  );
}

function PF_AllocationBar() {
  const total = PF_HOLDINGS.reduce((s,h)=>s+h.value,0);
  return (
    <div>
      <div style={{display:'flex', height:10, borderRadius:6, overflow:'hidden', background:'var(--tx-surface-3)'}}>
        {PF_HOLDINGS.map(h => (
          <div key={h.sym} style={{width:`${h.value/total*100}%`, background:h.color}}/>
        ))}
      </div>
      <div className="tx-row" style={{flexWrap:'wrap', gap:10, marginTop:10}}>
        {PF_HOLDINGS.map(h => (
          <div key={h.sym} className="tx-row" style={{gap:6, fontSize:11}}>
            <div style={{width:8, height:8, borderRadius:2, background:h.color}}/>
            <span style={{fontWeight:600}}>{h.sym}</span>
            <span className="tx-ink-3 tx-mono tx-tnum">{(h.value/total*100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Portfolio() {
  const [tab, setTab] = React.useState('wallet');
  const total = PF_HOLDINGS.reduce((s,h)=>s+h.value,0);

  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)', overflow:'auto', padding:'28px 40px 40px'}} className="tx-scroll">
      <div style={{maxWidth:1120, margin:'0 auto'}}>
        {/* Header */}
        <div className="tx-row tx-row--between" style={{marginBottom:24}}>
          <div className="tx-row" style={{gap:8}}>
            <div className="tx-logo-mark">t</div>
            <div style={{fontWeight:700}}>taco<span style={{color:'var(--tx-orange)'}}>·</span>exchange</div>
          </div>
          <div className="tx-row" style={{gap:4}}>
            <button className="tx-tab" style={{fontSize:13}}>Easy</button>
            <button className="tx-tab" style={{fontSize:13}}>Pro</button>
            <button className="tx-tab" style={{fontSize:13}}>Pool</button>
            <button className="tx-tab" aria-selected={true} style={{fontSize:13}}>Portfolio</button>
          </div>
        </div>

        {/* Hero */}
        <div style={{marginBottom:24}}>
          <div className="tx-eyebrow" style={{marginBottom:6}}>Total net worth</div>
          <div className="tx-row" style={{gap:14, alignItems:'baseline'}}>
            <div className="tx-mono tx-tnum" style={{fontSize:44, fontWeight:500, letterSpacing:'-0.03em'}}>
              $ {total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
            </div>
            <div className="tx-row" style={{gap:6}}>
              <span className="tx-badge tx-badge--buy" style={{height:24, padding:'0 10px', fontSize:12}}>+ $182.44</span>
              <span className="tx-badge tx-badge--buy" style={{height:24, padding:'0 10px', fontSize:12}}>+ 1.12% · 24h</span>
            </div>
          </div>
          <div className="tx-row" style={{gap:24, marginTop:14}}>
            <div>
              <div className="tx-ink-3" style={{fontSize:11}}>Open orders</div>
              <div className="tx-mono tx-tnum" style={{fontSize:18, fontWeight:500}}>3</div>
            </div>
            <div style={{width:1, background:'var(--tx-line)'}}/>
            <div>
              <div className="tx-ink-3" style={{fontSize:11}}>LP positions</div>
              <div className="tx-mono tx-tnum" style={{fontSize:18, fontWeight:500}}>2</div>
            </div>
            <div style={{width:1, background:'var(--tx-line)'}}/>
            <div>
              <div className="tx-ink-3" style={{fontSize:11}}>Realized PnL · 30d</div>
              <div className="tx-mono tx-tnum tx-buy" style={{fontSize:18, fontWeight:500}}>+$312.08</div>
            </div>
            <div style={{width:1, background:'var(--tx-line)'}}/>
            <div>
              <div className="tx-ink-3" style={{fontSize:11}}>Fees earned</div>
              <div className="tx-mono tx-tnum tx-amber" style={{fontSize:18, fontWeight:500}}>$48.21</div>
            </div>
          </div>
        </div>

        {/* Allocation */}
        <div className="tx-card" style={{padding:18, marginBottom:20}}>
          <div className="tx-row tx-row--between" style={{marginBottom:12}}>
            <h2 className="tx-h2">Allocation</h2>
            <div className="tx-segment" style={{padding:2}}>
              {['24h','7d','30d','All'].map((t,i) => (
                <button key={t} aria-pressed={i===2} style={{fontSize:11}}>{t}</button>
              ))}
            </div>
          </div>
          <PF_AllocationBar/>
        </div>

        {/* Tabs */}
        <div className="tx-tabs" style={{marginBottom:0}}>
          {[
            ['wallet','Wallet', null],
            ['orders','Open Orders', 3],
            ['lp','LP Positions', 2],
            ['history','Trade History', null],
            ['referral','Referral', null],
            ['docs','Docs', null],
          ].map(([id,label,n]) => (
            <button key={id} className="tx-tab" aria-selected={tab===id} onClick={()=>setTab(id)}>
              {label}
              {n != null && <span className="tx-badge tx-badge--square" style={{height:16, padding:'0 6px', fontSize:10}}>{n}</span>}
            </button>
          ))}
          <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:8, paddingRight:4}}>
            <button className="tx-btn tx-btn--ghost tx-btn--sm">Export CSV</button>
            <button className="tx-btn tx-btn--outline tx-btn--sm">Deposit</button>
            <button className="tx-btn tx-btn--primary tx-btn--sm">Trade</button>
          </div>
        </div>

        {/* Wallet table */}
        <div style={{marginTop:16}}>
          <table className="tx-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th style={{textAlign:'right'}}>Balance</th>
                <th style={{textAlign:'right'}}>Price</th>
                <th style={{textAlign:'right'}}>24h</th>
                <th>Trend (7d)</th>
                <th style={{textAlign:'right'}}>Value</th>
                <th style={{textAlign:'right'}}>Allocation</th>
                <th style={{textAlign:'right'}}></th>
              </tr>
            </thead>
            <tbody>
              {PF_HOLDINGS.map(h => (
                <tr key={h.sym}>
                  <td>
                    <div className="tx-row" style={{gap:10}}>
                      <div style={{width:26, height:26, borderRadius:'50%', background:h.color, color:'#fff',
                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                        fontSize:10, fontWeight:700, boxShadow:'0 2px 6px rgba(0,0,0,0.3)'}}>{h.sym.slice(0,2)}</div>
                      <div>
                        <div style={{fontWeight:600}}>{h.sym}</div>
                        <div className="tx-ink-3" style={{fontSize:11}}>{h.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num">{h.amount.toLocaleString(undefined, {maximumFractionDigits:4})}</td>
                  <td className="num">$ {(h.value/h.amount).toFixed(4)}</td>
                  <td className="num" style={{color: h.chg>=0?'var(--tx-buy)':'var(--tx-sell)'}}>
                    {h.chg>=0?'+':''}{h.chg.toFixed(2)}%
                  </td>
                  <td><PF_Sparkline up={h.chg>=0}/></td>
                  <td className="num" style={{fontWeight:600}}>$ {h.value.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td className="num tx-ink-2">{(h.value/total*100).toFixed(1)}%</td>
                  <td style={{textAlign:'right'}}>
                    <div className="tx-row" style={{gap:4, justifyContent:'flex-end'}}>
                      <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{height:22, fontSize:11}}>Send</button>
                      <button className="tx-btn tx-btn--outline tx-btn--sm" style={{height:22, fontSize:11}}>Swap</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer callout */}
        <div className="tx-row" style={{marginTop:28, padding:'16px 20px', background:'var(--tx-surface-1)', border:'1px solid var(--tx-line)', borderRadius:'var(--tx-r-lg)', gap:14}}>
          <div style={{fontSize:24}}>🧀</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600}}>NACHOS pays you back</div>
            <div className="tx-ink-3" style={{fontSize:12, marginTop:2}}>Your 412 NACHOS earned $48.21 in fees this month. Auto-compound is on.</div>
          </div>
          <button className="tx-btn tx-btn--outline">View vault</button>
        </div>
      </div>
    </div>
  );
}

window.Portfolio = Portfolio;
