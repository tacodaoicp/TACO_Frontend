// components/ProTrade.jsx — flagship terminal artboard

const PT_PAIR = { base: 'TACO', quote: 'ICP', price: 0.01847, change: 4.82 };

const PT_BIDS = [
  { p: 0.01846, a: 12480, t: 230.38 },
  { p: 0.01845, a: 8420,  t: 155.35 },
  { p: 0.01843, a: 22110, t: 407.49 },
  { p: 0.01842, a: 4180,  t:  77.00 },
  { p: 0.01840, a: 19230, t: 353.83 },
  { p: 0.01838, a: 2640,  t:  48.52 },
  { p: 0.01835, a: 31400, t: 576.19 },
  { p: 0.01832, a: 14820, t: 271.50 },
  { p: 0.01830, a: 9210,  t: 168.54 },
];
const PT_ASKS = [
  { p: 0.01848, a:  6820,  t: 126.07 },
  { p: 0.01850, a: 14230,  t: 263.25 },
  { p: 0.01852, a:  9410,  t: 174.27 },
  { p: 0.01854, a: 21800,  t: 404.17 },
  { p: 0.01858, a:  4560,  t:  84.73 },
  { p: 0.01862, a: 18210,  t: 339.07 },
  { p: 0.01865, a: 11320,  t: 211.13 },
  { p: 0.01870, a:  7680,  t: 143.61 },
  { p: 0.01875, a: 23450,  t: 439.69 },
].reverse();

const PT_TRADES = [
  { side: 'buy',  p: 0.01847, a: 2140, t: '14:23:08' },
  { side: 'sell', p: 0.01846, a:  810, t: '14:22:54' },
  { side: 'buy',  p: 0.01847, a: 5620, t: '14:22:31' },
  { side: 'buy',  p: 0.01848, a:  320, t: '14:22:15' },
  { side: 'sell', p: 0.01845, a: 1890, t: '14:21:47' },
  { side: 'sell', p: 0.01844, a: 7210, t: '14:21:22' },
  { side: 'buy',  p: 0.01846, a: 1120, t: '14:20:59' },
];

const PT_OPEN_ORDERS = [
  { pair: 'TACO/ICP', side: 'buy',  type: 'Limit', price: 0.01820, amount: 5000, filled: 0,     age: '3m' },
  { pair: 'ckBTC/ICP', side: 'sell', type: 'Limit', price: 1824.50, amount: 0.042, filled: 0.018, age: '12m' },
  { pair: 'TACO/ICP', side: 'buy',  type: 'Limit', price: 0.01800, amount: 10000, filled: 0,     age: '1h' },
];

function PT_Candles() {
  // Stylized SVG candles (placeholder chart — no real chart lib needed)
  const candles = [
    [34,46,30,44],[44,54,38,52],[52,60,48,50],[50,58,40,42],[42,50,36,48],
    [48,62,42,60],[60,68,54,58],[58,64,50,52],[52,56,44,48],[48,54,42,44],
    [44,50,34,38],[38,46,32,40],[40,52,38,48],[48,58,44,50],[50,62,46,60],
    [60,70,54,64],[64,68,56,58],[58,66,54,60],[60,72,58,68],[68,76,60,70],
    [70,80,64,74],[74,82,68,72],[72,80,66,70],[70,78,60,64],[64,72,56,58],
    [58,66,50,60],[60,70,54,58],[58,64,52,54],[54,62,46,48],[48,60,44,58],
    [58,68,54,62],[62,72,56,66],[66,76,60,72],[72,78,64,66],[66,74,58,60],
    [60,68,50,54],[54,64,48,62],[62,72,58,68],[68,78,62,74],[74,84,68,78],
    [78,86,70,74],[74,80,66,70],[70,76,62,66],[66,74,58,70],[70,78,66,72],
    [72,82,68,78],[78,88,72,84],[84,92,76,88],[88,96,82,86],[86,92,78,80],
  ];
  const w = 10, gap = 2, h = 220;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${candles.length*(w+gap)} 100`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="pt-grid" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--tx-line)" stopOpacity="0.6"/>
          <stop offset="1" stopColor="var(--tx-line)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[20,40,60,80].map(y => (
        <line key={y} x1="0" x2="100%" y1={y} y2={y} stroke="var(--tx-line)" strokeWidth="0.3" strokeDasharray="1 3"/>
      ))}
      {candles.map(([o,h,l,c], i) => {
        const x = i*(w+gap);
        const up = c >= o;
        const color = up ? 'var(--tx-buy)' : 'var(--tx-sell)';
        const top = 100 - h, bot = 100 - l;
        const bodyTop = 100 - Math.max(o,c);
        const bodyBot = 100 - Math.min(o,c);
        return (
          <g key={i} fill={color} stroke={color}>
            <line x1={x+w/2} x2={x+w/2} y1={top} y2={bot} strokeWidth="1"/>
            <rect x={x} y={bodyTop} width={w} height={Math.max(0.8, bodyBot-bodyTop)} fillOpacity={up?0.85:1}/>
          </g>
        );
      })}
    </svg>
  );
}

function PT_Header() {
  return (
    <div className="tx-row tx-row--between" style={{padding:'10px 14px', borderBottom:'1px solid var(--tx-line)', background:'var(--tx-surface-1)'}}>
      <div className="tx-row" style={{gap:14}}>
        <div className="tx-row" style={{gap:8}}>
          <div className="tx-logo-mark">t</div>
          <div style={{fontWeight:700, letterSpacing:'-0.01em'}}>taco<span style={{color:'var(--tx-orange)'}}>·</span>exchange</div>
          <span className="tx-badge tx-badge--orange tx-badge--square" style={{marginLeft:6}}>PRO</span>
        </div>
        <div style={{width:1, height:22, background:'var(--tx-line)'}}/>
        <button className="tx-row" style={{gap:8, background:'var(--tx-surface-2)', border:'1px solid var(--tx-line)', padding:'5px 10px', borderRadius:'var(--tx-r-md)', color:'var(--tx-ink)', cursor:'pointer'}}>
          <div style={{width:16, height:16, borderRadius:'50%', background:'var(--tx-orange)', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#0b0906', fontSize:9, fontWeight:800}}>t</div>
          <span style={{fontWeight:600}}>{PT_PAIR.base}/{PT_PAIR.quote}</span>
          <span className="tx-ink-3" style={{fontSize:11}}>▾</span>
        </button>
        <div className="tx-row" style={{gap:16, paddingLeft:6}}>
          <div>
            <div className="tx-mono tx-tnum" style={{fontSize:16, fontWeight:600, color:'var(--tx-buy)'}}>{PT_PAIR.price.toFixed(5)}</div>
            <div className="tx-ink-3" style={{fontSize:10}}>LAST</div>
          </div>
          <div>
            <div className="tx-mono tx-tnum tx-buy" style={{fontSize:13, fontWeight:500}}>+{PT_PAIR.change}%</div>
            <div className="tx-ink-3" style={{fontSize:10}}>24H</div>
          </div>
          <div>
            <div className="tx-mono tx-tnum" style={{fontSize:13}}>0.01892</div>
            <div className="tx-ink-3" style={{fontSize:10}}>HIGH</div>
          </div>
          <div>
            <div className="tx-mono tx-tnum" style={{fontSize:13}}>0.01762</div>
            <div className="tx-ink-3" style={{fontSize:10}}>LOW</div>
          </div>
          <div>
            <div className="tx-mono tx-tnum" style={{fontSize:13}}>1.42M</div>
            <div className="tx-ink-3" style={{fontSize:10}}>VOL 24H</div>
          </div>
        </div>
      </div>
      <div className="tx-row" style={{gap:8}}>
        <button className="tx-btn tx-btn--ghost tx-btn--sm">⚡ Shortcuts</button>
        <button className="tx-btn tx-btn--ghost tx-btn--sm">⋯</button>
        <div style={{width:1, height:22, background:'var(--tx-line)'}}/>
        <div className="tx-row" style={{gap:6}}>
          <div style={{width:26, height:26, borderRadius:'50%', background:'var(--tx-surface-3)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600}}>JR</div>
          <span className="tx-ink-2 tx-mono" style={{fontSize:11}}>0x3a…b8c1</span>
        </div>
      </div>
    </div>
  );
}

function PT_Chart() {
  const [tf, setTf] = React.useState('15m');
  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div className="tx-row tx-row--between" style={{padding:'8px 12px', borderBottom:'1px solid var(--tx-line)'}}>
        <div className="tx-row" style={{gap:2}}>
          {['1m','5m','15m','1h','4h','1D'].map(t => (
            <button key={t} className="tx-tab"
              aria-selected={tf===t}
              onClick={()=>setTf(t)}
              style={{padding:'4px 10px', fontSize:12}}>
              {t}
            </button>
          ))}
        </div>
        <div className="tx-row" style={{gap:8}}>
          <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{height:24}}>Indicators</button>
          <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{height:24}}>Candles</button>
        </div>
      </div>
      <div style={{flex:1, padding:12, position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:18, left:18, fontSize:10, color:'var(--tx-ink-3)', letterSpacing:'0.08em'}}>TACO/ICP · 15m · Chef</div>
        <div style={{position:'absolute', top:18, right:18, textAlign:'right'}}>
          <div className="tx-mono tx-tnum" style={{fontSize:11, color:'var(--tx-ink-3)'}}>O 0.01842 H 0.01852 L 0.01830 C 0.01847</div>
        </div>
        <div style={{position:'absolute', top:50, bottom:40, left:12, right:50}}>
          <PT_Candles/>
        </div>
        {/* Price axis */}
        <div style={{position:'absolute', top:50, bottom:40, right:6, width:40, display:'flex', flexDirection:'column', justifyContent:'space-between', fontSize:10, fontFamily:'JetBrains Mono, monospace', color:'var(--tx-ink-3)', textAlign:'right'}}>
          <div>0.01920</div><div>0.01880</div><div>0.01840</div><div>0.01800</div><div>0.01760</div>
        </div>
        {/* Current price pill */}
        <div style={{position:'absolute', right:6, top:'60%', background:'var(--tx-buy)', color:'#fff', fontSize:10, padding:'2px 6px', borderRadius:'var(--tx-r-sm)', fontFamily:'JetBrains Mono, monospace'}}>
          0.01847
        </div>
        <div style={{position:'absolute', bottom:12, left:12, right:50, height:24, display:'flex', justifyContent:'space-between', fontSize:10, fontFamily:'JetBrains Mono, monospace', color:'var(--tx-ink-3)'}}>
          <span>10:00</span><span>11:00</span><span>12:00</span><span>13:00</span><span>14:00</span>
        </div>
      </div>
    </div>
  );
}

function PT_Orderbook() {
  const [precision, setPrecision] = React.useState('0.00001');
  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div className="tx-row tx-row--between" style={{padding:'8px 10px', borderBottom:'1px solid var(--tx-line)'}}>
        <div style={{fontSize:11, fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase', color:'var(--tx-ink-2)'}}>Order Book</div>
        <div className="tx-row" style={{gap:4}}>
          <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{height:20, padding:'0 6px', fontSize:10}}>{precision}</button>
          <div className="tx-row" style={{gap:1}}>
            <div style={{width:4, height:14, background:'var(--tx-buy)', opacity:0.8, borderRadius:1}}/>
            <div style={{width:4, height:14, background:'var(--tx-sell)', opacity:0.8, borderRadius:1}}/>
          </div>
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'4px 10px', fontSize:10, color:'var(--tx-ink-3)', letterSpacing:'0.04em', textTransform:'uppercase', borderBottom:'1px solid var(--tx-line)'}}>
        <div>Price (ICP)</div>
        <div style={{textAlign:'right'}}>Amount</div>
        <div style={{textAlign:'right'}}>Total</div>
      </div>

      <div className="tx-scroll" style={{flex:1, overflow:'auto', minHeight:0, display:'flex', flexDirection:'column'}}>
        {/* Asks */}
        <div>
          {PT_ASKS.map((r, i) => (
            <div key={'a'+i} className="tx-depth tx-depth--ask" style={{'--depth': `${Math.min(100, r.t/6)}%`}}>
              <span style={{color:'var(--tx-sell)'}}>{r.p.toFixed(5)}</span>
              <span>{r.a.toLocaleString()}</span>
              <span>{r.t.toFixed(2)}</span>
            </div>
          ))}
        </div>
        {/* Spread row */}
        <div style={{padding:'6px 10px', borderTop:'1px solid var(--tx-line)', borderBottom:'1px solid var(--tx-line)', background:'var(--tx-surface-2)'}}>
          <div className="tx-row tx-row--between">
            <div className="tx-mono tx-tnum" style={{fontSize:14, color:'var(--tx-buy)', fontWeight:600}}>{PT_PAIR.price.toFixed(5)}</div>
            <div className="tx-ink-3" style={{fontSize:10}}>Spread <span className="tx-mono">0.00002</span> · 0.10%</div>
          </div>
        </div>
        {/* Bids */}
        <div>
          {PT_BIDS.map((r, i) => (
            <div key={'b'+i} className="tx-depth tx-depth--bid" style={{'--depth': `${Math.min(100, r.t/6)}%`}}>
              <span style={{color:'var(--tx-buy)'}}>{r.p.toFixed(5)}</span>
              <span>{r.a.toLocaleString()}</span>
              <span>{r.t.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PT_OrderEntry() {
  const [side, setSide] = React.useState('buy');
  const [type, setType] = React.useState('limit');
  const [pct, setPct] = React.useState(25);
  const [price, setPrice] = React.useState('0.01847');
  const [amount, setAmount] = React.useState('2500');
  const total = (parseFloat(price||0) * parseFloat(amount||0)).toFixed(4);

  return (
    <div style={{padding:14, display:'flex', flexDirection:'column', gap:10, height:'100%'}}>
      <div className="tx-segment tx-segment--buysell" style={{width:'100%'}}>
        <button style={{flex:1}} data-side="buy"  aria-pressed={side==='buy'}  onClick={()=>setSide('buy')}>Buy</button>
        <button style={{flex:1}} data-side="sell" aria-pressed={side==='sell'} onClick={()=>setSide('sell')}>Sell</button>
      </div>

      <div className="tx-segment" style={{width:'100%'}}>
        {['limit','market','stop'].map(t => (
          <button key={t} style={{flex:1, textTransform:'capitalize'}}
            aria-pressed={type===t} onClick={()=>setType(t)}>{t}</button>
        ))}
      </div>

      <div className="tx-row tx-row--between" style={{marginTop:4}}>
        <span className="tx-ink-3" style={{fontSize:11}}>Available</span>
        <span className="tx-mono tx-tnum" style={{fontSize:12}}>842.35 <span className="tx-ink-3">ICP</span></span>
      </div>

      <div>
        <label className="tx-ink-3" style={{fontSize:11, display:'block', marginBottom:4}}>Price</label>
        <div style={{position:'relative'}}>
          <input className="tx-input tx-input--mono" value={price} onChange={e=>setPrice(e.target.value)} />
          <span className="tx-ink-3" style={{position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11}}>ICP</span>
        </div>
      </div>

      <div>
        <label className="tx-ink-3" style={{fontSize:11, display:'block', marginBottom:4}}>Amount</label>
        <div style={{position:'relative'}}>
          <input className="tx-input tx-input--mono" value={amount} onChange={e=>setAmount(e.target.value)} />
          <span className="tx-ink-3" style={{position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11}}>TACO</span>
        </div>
      </div>

      {/* Slider */}
      <div>
        <div style={{position:'relative', height:22}}>
          <div style={{position:'absolute', top:10, left:0, right:0, height:2, background:'var(--tx-surface-3)', borderRadius:1}}/>
          <div style={{position:'absolute', top:10, left:0, width:`${pct}%`, height:2, background: side==='buy'?'var(--tx-buy)':'var(--tx-sell)', borderRadius:1}}/>
          {[0,25,50,75,100].map(v => (
            <button key={v}
              onClick={()=>setPct(v)}
              style={{position:'absolute', top:4, left:`calc(${v}% - 7px)`, width:14, height:14, borderRadius:'50%', border:'2px solid var(--tx-bg)',
                background: pct>=v ? (side==='buy'?'var(--tx-buy)':'var(--tx-sell)') : 'var(--tx-surface-3)', cursor:'pointer', padding:0}}/>
          ))}
        </div>
        <div className="tx-row" style={{justifyContent:'space-between', marginTop:2}}>
          {['0','25','50','75','100'].map(v => (
            <span key={v} className="tx-ink-3" style={{fontSize:10}}>{v}%</span>
          ))}
        </div>
      </div>

      <div className="tx-panel-2" style={{padding:'8px 10px', fontSize:11}}>
        <div className="tx-row tx-row--between"><span className="tx-ink-3">Total</span><span className="tx-mono tx-tnum">{total} ICP</span></div>
        <div className="tx-row tx-row--between" style={{marginTop:4}}><span className="tx-ink-3">Fee (0.1%)</span><span className="tx-mono tx-tnum">{(parseFloat(total)*0.001).toFixed(5)} ICP</span></div>
        <div className="tx-row tx-row--between" style={{marginTop:4}}><span className="tx-ink-3">Slippage</span><span className="tx-mono tx-tnum">0.5%</span></div>
      </div>

      <button className={'tx-btn tx-btn--' + (side==='buy'?'buy':'sell') + ' tx-btn--block tx-btn--lg'} style={{marginTop:'auto'}}>
        {side==='buy' ? 'Buy TACO' : 'Sell TACO'}
      </button>
    </div>
  );
}

function PT_BottomPanel() {
  const [tab, setTab] = React.useState('orders');
  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div className="tx-tabs" style={{paddingLeft:8, flexShrink:0}}>
        {[
          ['orders',  'Open Orders',   PT_OPEN_ORDERS.length],
          ['history', 'Trade History', null],
          ['pair',    'Pair Trades',   null],
          ['lp',      'LP Positions',  2],
          ['assets',  'Assets',        null],
        ].map(([id, label, count]) => (
          <button key={id} className="tx-tab" aria-selected={tab===id} onClick={()=>setTab(id)}>
            {label}
            {count != null && (
              <span className="tx-badge tx-badge--square" style={{height:15, padding:'0 5px', fontSize:9}}>{count}</span>
            )}
          </button>
        ))}
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:10, paddingRight:12}}>
          <label className="tx-row" style={{gap:6, fontSize:11, color:'var(--tx-ink-3)'}}>
            <input type="checkbox" style={{margin:0}}/> Current pair only
          </label>
          <button className="tx-btn tx-btn--ghost tx-btn--sm" style={{height:22, fontSize:11}}>Cancel all</button>
        </div>
      </div>
      <div style={{flex:1, overflow:'auto', minHeight:0}} className="tx-scroll">
        <table className="tx-table">
          <thead>
            <tr>
              <th>Pair</th><th>Side</th><th>Type</th>
              <th style={{textAlign:'right'}}>Price</th>
              <th style={{textAlign:'right'}}>Amount</th>
              <th style={{textAlign:'right'}}>Filled</th>
              <th style={{textAlign:'right'}}>Age</th>
              <th style={{textAlign:'right', width:80}}></th>
            </tr>
          </thead>
          <tbody>
            {PT_OPEN_ORDERS.map((o, i) => (
              <tr key={i}>
                <td><span style={{fontWeight:600}}>{o.pair}</span></td>
                <td><span className={'tx-badge ' + (o.side==='buy'?'tx-badge--buy':'tx-badge--sell')} style={{textTransform:'uppercase', fontSize:10}}>{o.side}</span></td>
                <td className="tx-ink-2">{o.type}</td>
                <td className="num">{o.price.toFixed(5)}</td>
                <td className="num">{o.amount.toLocaleString()}</td>
                <td className="num tx-ink-3">{o.filled > 0 ? (o.filled/o.amount*100).toFixed(1)+'%' : '—'}</td>
                <td className="num tx-ink-3">{o.age}</td>
                <td style={{textAlign:'right'}}><button className="tx-btn tx-btn--ghost tx-btn--sm" style={{height:22, fontSize:11}}>Cancel</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProTrade() {
  return (
    <div style={{width:'100%', height:'100%', display:'flex', flexDirection:'column', background:'var(--tx-bg)', color:'var(--tx-ink)'}}>
      <PT_Header/>
      <div style={{flex:1, display:'grid', gridTemplateColumns:'1fr 280px 320px', minHeight:0, borderBottom:'1px solid var(--tx-line)'}}>
        <div style={{borderRight:'1px solid var(--tx-line)', background:'var(--tx-bg)'}}>
          <PT_Chart/>
        </div>
        <div style={{borderRight:'1px solid var(--tx-line)', background:'var(--tx-bg)'}}>
          <PT_Orderbook/>
        </div>
        <div style={{background:'var(--tx-surface-1)'}}>
          <PT_OrderEntry/>
        </div>
      </div>
      <div style={{height:220, background:'var(--tx-bg)'}}>
        <PT_BottomPanel/>
      </div>
    </div>
  );
}

window.ProTrade = ProTrade;
