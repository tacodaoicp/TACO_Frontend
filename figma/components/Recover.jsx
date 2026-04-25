// components/Recover.jsx — Fund recovery from stuck TXs

function RV_Row({ token, color, amount, tx, status }) {
  const statusMap = {
    recoverable: ['Recoverable', 'tx-badge--buy'],
    pending: ['Checking…', 'tx-badge--warning'],
    resolved: ['Resolved', 'tx-badge--info'],
  };
  const [label, cls] = statusMap[status];
  return (
    <tr>
      <td>
        <div className="tx-row" style={{gap:10}}>
          <div style={{width:28, height:28, borderRadius:'50%', background:color,
            color:'#fff', fontSize:10, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 6px rgba(0,0,0,0.3)'}}>{token.slice(0,2)}</div>
          <span style={{fontWeight:600}}>{token}</span>
        </div>
      </td>
      <td className="tx-mono tx-tnum tx-num-right"><strong style={{fontSize:14}}>{amount}</strong></td>
      <td><span className={`tx-badge ${cls}`}>{label}</span></td>
      <td className="tx-mono" style={{fontSize:11, color:'var(--tx-ink-3)'}}>{tx}</td>
      <td style={{textAlign:'right'}}>
        {status==='recoverable'
          ? <button className="tx-btn tx-btn--primary tx-btn--sm">Recover</button>
          : <button className="tx-btn tx-btn--ghost tx-btn--sm" disabled>Recover</button>}
      </td>
    </tr>
  );
}

function Recover() {
  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)', overflow:'auto', padding:'28px 40px 40px'}} className="tx-scroll">
      <div style={{maxWidth:960, margin:'0 auto'}}>
        {/* Nav */}
        <div className="tx-row tx-row--between" style={{marginBottom:20}}>
          <div className="tx-row" style={{gap:8}}>
            <div className="tx-logo-mark">t</div>
            <div style={{fontWeight:700}}>taco<span style={{color:'var(--tx-orange)'}}>·</span>exchange</div>
          </div>
          <button className="tx-btn tx-btn--ghost tx-btn--sm">← Back to Portfolio</button>
        </div>

        {/* Title */}
        <div style={{marginBottom:22}}>
          <h1 className="tx-h1" style={{display:'flex', alignItems:'baseline', gap:10}}>
            Recover <span className="tx-serif tx-orange" style={{fontSize:24, fontWeight:400}}>stuck funds</span>
          </h1>
          <div className="tx-ink-3" style={{fontSize:13, marginTop:4, maxWidth:620}}>
            We scan failed and interrupted transactions for balances the exchange still holds for your principal, and refund them here.
          </div>
        </div>

        {/* Warning banner */}
        <div style={{padding:'12px 14px', background:'var(--tx-warning-dim)',
          border:'1px solid rgba(196,90,10,0.35)', borderRadius:'var(--tx-r-md)', marginBottom:20,
          display:'flex', gap:12, alignItems:'flex-start'}}>
          <div style={{fontSize:18, lineHeight:1, marginTop:1}}>⚠</div>
          <div style={{fontSize:13, lineHeight:1.5}}>
            <strong className="tx-warning">Only use this if a deposit, withdraw, or swap completed on-chain but never appeared in your balance.</strong>
            <div className="tx-ink-3" style={{marginTop:4}}>Normal pending transactions settle within 2 minutes — don't recover those.</div>
          </div>
        </div>

        {/* Scan card */}
        <div className="tx-card" style={{padding:18, marginBottom:20}}>
          <div className="tx-row tx-row--between">
            <div>
              <div className="tx-eyebrow">Your principal</div>
              <div className="tx-mono" style={{fontSize:12, marginTop:2}}>hpy3j-hb2fa-rzyqa-aaaaaa-aaaaa-caaai</div>
            </div>
            <button className="tx-btn tx-btn--primary tx-btn--md">↻  Rescan balances</button>
          </div>
          <div style={{marginTop:14, paddingTop:14, borderTop:'1px solid var(--tx-line)'}}>
            <div className="tx-row" style={{gap:24}}>
              <div>
                <div className="tx-eyebrow">Last scan</div>
                <div style={{marginTop:2, fontSize:13}}>12 seconds ago</div>
              </div>
              <div>
                <div className="tx-eyebrow">Recoverable</div>
                <div className="tx-mono tx-tnum" style={{marginTop:2, fontSize:16, fontWeight:600}}>2 items</div>
              </div>
              <div>
                <div className="tx-eyebrow">Est. value</div>
                <div className="tx-mono tx-tnum tx-orange" style={{marginTop:2, fontSize:16, fontWeight:600}}>$482.19</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="tx-card" style={{padding:0, overflow:'hidden'}}>
          <div style={{padding:'14px 18px', borderBottom:'1px solid var(--tx-line)'}}>
            <div className="tx-eyebrow">Stuck balances</div>
          </div>
          <table className="tx-table">
            <thead>
              <tr>
                <th>Token</th><th style={{textAlign:'right'}}>Amount</th><th>Status</th><th>Transaction</th><th></th>
              </tr>
            </thead>
            <tbody>
              <RV_Row token="ckUSDC" color="#2775ca" amount="248.12" tx="0xa4e…9f3c" status="recoverable"/>
              <RV_Row token="ICP"    color="#29abe2" amount="18.4002" tx="0x1c9…be41" status="recoverable"/>
              <RV_Row token="TACO"   color="#f28b3a" amount="0" tx="0x8d2…a012" status="pending"/>
              <RV_Row token="ckBTC"  color="#f7931a" amount="0.00412" tx="0x47e…d2f8" status="resolved"/>
            </tbody>
          </table>
        </div>

        {/* Help */}
        <div style={{marginTop:18, padding:'14px 16px', background:'var(--tx-surface-1)',
          border:'1px solid var(--tx-line)', borderRadius:'var(--tx-r-md)'}}>
          <div className="tx-eyebrow">Still missing funds?</div>
          <div style={{fontSize:13, marginTop:6, lineHeight:1.6}}>
            File a recovery ticket with the transaction hash. Usual turn-around is under 24 hours.
          </div>
          <button className="tx-btn tx-btn--outline tx-btn--sm" style={{marginTop:10}}>Open recovery ticket →</button>
        </div>
      </div>
    </div>
  );
}
