// components/ExchangeAdmin.jsx — internal / utilitarian, 10-tab

const ADMIN_TABS = [
  'Overview','Pairs','Fees','Limits','Tokens','Oracles','Canisters','Kill-switches','Audit log','Recovery'
];

function AD_Stat({ label, value, sub, tone }) {
  return (
    <div className="tx-card" style={{padding:14}}>
      <div className="tx-eyebrow">{label}</div>
      <div className="tx-mono tx-tnum" style={{fontSize:22, fontWeight:600, marginTop:6, letterSpacing:'-0.01em'}}>{value}</div>
      <div className={tone ? `tx-${tone}` : 'tx-ink-3'} style={{fontSize:11, marginTop:2}}>{sub}</div>
    </div>
  );
}

function ExchangeAdmin() {
  const [tab, setTab] = React.useState('Overview');

  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)', overflow:'auto'}} className="tx-scroll">
      <div style={{maxWidth:1200, margin:'0 auto', padding:'24px 36px'}}>
        {/* Header w/ env chip */}
        <div className="tx-row tx-row--between" style={{marginBottom:20}}>
          <div className="tx-row" style={{gap:10}}>
            <div className="tx-logo-mark">t</div>
            <div style={{fontWeight:700, fontSize:18}}>Admin</div>
            <span className="tx-badge tx-badge--warning" style={{textTransform:'uppercase'}}>⚠ MAINNET</span>
          </div>
          <div className="tx-row" style={{gap:8}}>
            <span className="tx-mono tx-ink-3" style={{fontSize:11}}>signed in as <span className="tx-orange">hpy3j-hb2fa-…-caaai</span></span>
            <button className="tx-btn tx-btn--danger-outline tx-btn--sm">Kill-switch</button>
          </div>
        </div>

        {/* Stat row */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20}}>
          <AD_Stat label="24h volume"  value="$14.82M"  sub="▲ 12.4% vs yesterday" tone="buy"/>
          <AD_Stat label="Open orders" value="8,429"    sub="142 new this hour"/>
          <AD_Stat label="Active pairs" value="38"      sub="2 paused"/>
          <AD_Stat label="Canister cycles" value="4.21T" sub="▼ low on exchange_backend" tone="warning"/>
        </div>

        {/* Tab bar */}
        <div style={{display:'flex', gap:2, marginBottom:14, borderBottom:'1px solid var(--tx-line)', overflowX:'auto'}}>
          {ADMIN_TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)}
              style={{padding:'10px 14px', background:'transparent', border:0, fontSize:12, fontWeight:600,
                color: tab===t ? 'var(--tx-ink)' : 'var(--tx-ink-3)',
                borderBottom: tab===t ? '2px solid var(--tx-orange)' : '2px solid transparent',
                whiteSpace:'nowrap', cursor:'pointer'}}>{t}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 340px', gap:16}}>
          <div className="tx-card" style={{padding:0, overflow:'hidden'}}>
            <div style={{padding:'12px 16px', borderBottom:'1px solid var(--tx-line)',
              display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div className="tx-eyebrow">Pairs</div>
              <div className="tx-row" style={{gap:6}}>
                <input className="tx-input" placeholder="Filter…" style={{height:26, width:160, fontSize:11}}/>
                <button className="tx-btn tx-btn--primary tx-btn--sm">+ Add pair</button>
              </div>
            </div>
            <table className="tx-table">
              <thead>
                <tr><th>Pair</th><th>Status</th><th style={{textAlign:'right'}}>Maker / Taker</th><th style={{textAlign:'right'}}>Min size</th><th style={{textAlign:'right'}}>24h vol</th><th></th></tr>
              </thead>
              <tbody>
                {[
                  ['TACO / ICP',    'Live',    '0.10% / 0.20%', '1',       '2.41M'],
                  ['ckBTC / ICP',   'Live',    '0.05% / 0.10%', '0.00001', '4.82M'],
                  ['ckETH / ICP',   'Live',    '0.05% / 0.10%', '0.001',   '1.92M'],
                  ['ckUSDC / ICP',  'Live',    '0.05% / 0.10%', '1',       '3.14M'],
                  ['NACHOS / TACO', 'Paused',  '0.25% / 0.30%', '1',       '—'],
                  ['DKP / ICP',     'Delisted','—',             '—',       '—'],
                ].map(([pair, status, fee, min, vol], i) => (
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{pair}</td>
                    <td>
                      <span className={`tx-badge ${
                        status==='Live' ? 'tx-badge--buy' :
                        status==='Paused' ? 'tx-badge--warning' :
                        'tx-badge--sell'
                      }`}>{status}</span>
                    </td>
                    <td className="tx-mono tx-tnum tx-num-right">{fee}</td>
                    <td className="tx-mono tx-tnum tx-num-right">{min}</td>
                    <td className="tx-mono tx-tnum tx-num-right">{vol}</td>
                    <td style={{textAlign:'right'}}>
                      <button className="tx-btn tx-btn--ghost tx-btn--sm">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right: audit log */}
          <div className="tx-card" style={{padding:0, overflow:'hidden'}}>
            <div style={{padding:'12px 16px', borderBottom:'1px solid var(--tx-line)'}}>
              <div className="tx-eyebrow">Audit log</div>
            </div>
            <div style={{padding:'10px 14px', display:'flex', flexDirection:'column', gap:10}}>
              {[
                ['14:21:02', 'Fee tier updated', 'ckBTC/ICP · maker 0.05% → 0.04%', 'buy'],
                ['13:58:41', 'Pair paused',     'NACHOS/TACO by principal hpy3j…', 'warning'],
                ['13:32:18', 'Kill-switch armed','by principal pn4jw…',             'sell'],
                ['12:04:55', 'Token added',     'DKP · governance proposal #87 passed', 'info'],
                ['11:47:09', 'Canister upgraded','exchange_backend v2.4.1',         'info'],
                ['10:02:33', 'Recovery resolved','18.4 ICP → hpy3j…',               'buy'],
              ].map(([t, title, sub, tone], i) => (
                <div key={i} style={{display:'flex', gap:10, fontSize:12, alignItems:'flex-start'}}>
                  <span className="tx-mono tx-ink-3" style={{fontSize:10, width:52, flexShrink:0, paddingTop:2}}>{t}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600}}>
                      <span className={`tx-dot tx-${tone}`} style={{display:'inline-block', width:6, height:6, borderRadius:'50%', marginRight:6, background:'currentColor'}}/>
                      {title}
                    </div>
                    <div className="tx-ink-3" style={{fontSize:11, marginTop:1}}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{padding:'10px 14px', borderTop:'1px solid var(--tx-line)'}}>
              <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{width:'100%'}}>View full log →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
