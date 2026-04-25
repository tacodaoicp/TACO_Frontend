// components/StyleGuide.jsx — tokens, type, components showcase

function Swatch({ name, varName, note }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6}}>
      <div style={{height:60, borderRadius:'var(--tx-r-md)', background:`var(${varName})`, border:'1px solid var(--tx-line)'}}/>
      <div style={{fontSize:11}}>
        <div style={{fontWeight:600}}>{name}</div>
        <div className="tx-mono tx-ink-3" style={{fontSize:10}}>{varName}</div>
        {note && <div className="tx-ink-3" style={{fontSize:10, marginTop:2}}>{note}</div>}
      </div>
    </div>
  );
}

function StyleGuide() {
  return (
    <div style={{width:'100%', height:'100%', background:'var(--tx-bg)', overflow:'auto', padding:36}} className="tx-scroll">
      <div style={{maxWidth:1080, margin:'0 auto', display:'flex', flexDirection:'column', gap:32}}>

        {/* Title */}
        <div>
          <div className="tx-eyebrow" style={{marginBottom:8}}>Style Guide — Exchange</div>
          <h1 className="tx-h1" style={{fontSize:40, letterSpacing:'-0.03em'}}>
            A quieter <span className="tx-serif tx-orange">kitchen</span>. Same heat.
          </h1>
          <p className="tx-ink-2" style={{maxWidth:620, marginTop:10, fontSize:14, lineHeight:1.55}}>
            Less gradient stacking. Fewer browns competing with each other. The burnt-orange stays the hero —
            but it sits on calmer surfaces, and every number picks up a proper monospace. Pro stays precise;
            Easy breathes.
          </p>
        </div>

        <hr className="tx-hr"/>

        {/* Palette */}
        <div>
          <div className="tx-eyebrow" style={{marginBottom:14}}>01 · Palette</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:14}}>
            <Swatch name="Background"  varName="--tx-bg"/>
            <Swatch name="Surface 1"   varName="--tx-surface-1"/>
            <Swatch name="Surface 2"   varName="--tx-surface-2"/>
            <Swatch name="Surface 3"   varName="--tx-surface-3"/>
            <Swatch name="Line"        varName="--tx-line-2"/>
            <Swatch name="Line hi"     varName="--tx-line-hi"/>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:14, marginTop:14}}>
            <Swatch name="Orange · brand" varName="--tx-orange" note="CTAs, focus"/>
            <Swatch name="Orange hover"   varName="--tx-orange-2"/>
            <Swatch name="Amber"          varName="--tx-amber" note="Titles, accents"/>
            <Swatch name="Buy"            varName="--tx-buy"/>
            <Swatch name="Sell"           varName="--tx-sell"/>
            <Swatch name="Info"           varName="--tx-info"/>
          </div>
        </div>

        <hr className="tx-hr"/>

        {/* Type */}
        <div>
          <div className="tx-eyebrow" style={{marginBottom:14}}>02 · Typography</div>
          <div style={{display:'grid', gridTemplateColumns:'180px 1fr', gap:20, alignItems:'baseline'}}>
            <div className="tx-ink-3" style={{fontSize:11}}>Inter · Display 40</div>
            <div style={{fontSize:40, letterSpacing:'-0.03em', fontWeight:600}}>Together, we perfect the recipe.</div>

            <div className="tx-ink-3" style={{fontSize:11}}>Inter · H1 · 28/600</div>
            <div style={{fontSize:28, fontWeight:600, letterSpacing:'-0.02em'}}>Portfolio</div>

            <div className="tx-ink-3" style={{fontSize:11}}>Inter · H2 · 18/600</div>
            <div style={{fontSize:18, fontWeight:600}}>Open orders · 3</div>

            <div className="tx-ink-3" style={{fontSize:11}}>Inter · Body · 13/400</div>
            <div style={{fontSize:13}}>Best route across TACO pools. No wrappers, no bridges.</div>

            <div className="tx-ink-3" style={{fontSize:11}}>Instrument Serif · Accent</div>
            <div className="tx-serif tx-orange" style={{fontSize:28}}>instantly · everywhere · on-chain</div>

            <div className="tx-ink-3" style={{fontSize:11}}>JetBrains Mono · Numerics</div>
            <div className="tx-mono tx-tnum" style={{fontSize:24, fontWeight:500}}>0.01847  · 54,142.6  · $2,304.37</div>

            <div className="tx-ink-3" style={{fontSize:11}}>Eyebrow · 11/600 · UPPER</div>
            <div className="tx-eyebrow">Order book · Depth</div>
          </div>
        </div>

        <hr className="tx-hr"/>

        {/* Buttons */}
        <div>
          <div className="tx-eyebrow" style={{marginBottom:14}}>03 · Buttons</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:10, alignItems:'center'}}>
            <button className="tx-btn tx-btn--primary">Primary</button>
            <button className="tx-btn tx-btn--primary tx-btn--lg">Large CTA</button>
            <button className="tx-btn tx-btn--buy">Buy TACO</button>
            <button className="tx-btn tx-btn--sell">Sell TACO</button>
            <button className="tx-btn tx-btn--outline">Outline</button>
            <button className="tx-btn tx-btn--ghost">Ghost</button>
            <button className="tx-btn tx-btn--ghost tx-btn--sm">Small</button>
            <button className="tx-btn tx-btn--primary" disabled style={{opacity:0.4}}>Disabled</button>
          </div>
        </div>

        <hr className="tx-hr"/>

        {/* Inputs & segments */}
        <div>
          <div className="tx-eyebrow" style={{marginBottom:14}}>04 · Inputs & segments</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              <input className="tx-input" placeholder="Search tokens…"/>
              <input className="tx-input tx-input--mono" defaultValue="0.01847"/>
              <input className="tx-input tx-input--lg tx-input--mono" defaultValue="50"/>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              <div className="tx-segment tx-segment--buysell">
                <button data-side="buy" aria-pressed={true}>Buy</button>
                <button data-side="sell">Sell</button>
              </div>
              <div className="tx-segment">
                <button aria-pressed={true}>Limit</button>
                <button>Market</button>
                <button>Stop</button>
              </div>
              <div className="tx-row" style={{gap:6}}>
                <span className="tx-badge">Default</span>
                <span className="tx-badge tx-badge--orange">Featured</span>
                <span className="tx-badge tx-badge--buy">+4.82%</span>
                <span className="tx-badge tx-badge--sell">-1.24%</span>
                <span className="tx-badge tx-badge--square">AMM</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="tx-hr"/>

        {/* Cards / panels */}
        <div>
          <div className="tx-eyebrow" style={{marginBottom:14}}>05 · Surfaces</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14}}>
            <div className="tx-panel" style={{padding:16}}>
              <div className="tx-ink-3" style={{fontSize:11}}>Panel · surface-1</div>
              <div style={{marginTop:6, fontWeight:600}}>Order Book</div>
              <div className="tx-ink-3" style={{fontSize:12, marginTop:4}}>The default chrome. Soft, settled.</div>
            </div>
            <div className="tx-card" style={{padding:16}}>
              <div className="tx-ink-3" style={{fontSize:11}}>Card · elevated</div>
              <div style={{marginTop:6, fontWeight:600}}>Swap Card</div>
              <div className="tx-ink-3" style={{fontSize:12, marginTop:4}}>Hero modules. Larger radius, soft shadow.</div>
            </div>
            <div style={{padding:16, border:'1px solid var(--tx-orange-line)', background:'var(--tx-orange-dim)', borderRadius:'var(--tx-r-lg)'}}>
              <div className="tx-orange" style={{fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase'}}>Accent</div>
              <div style={{marginTop:6, fontWeight:600}}>Focus state</div>
              <div className="tx-ink-2" style={{fontSize:12, marginTop:4}}>Selected rows, highlighted promos.</div>
            </div>
          </div>
        </div>

        <hr className="tx-hr"/>

        {/* Depth preview */}
        <div>
          <div className="tx-eyebrow" style={{marginBottom:14}}>06 · Depth rows</div>
          <div className="tx-panel" style={{padding:'6px 0', maxWidth:380}}>
            {[
              ['ask', 0.01858, 4560, 84.73, 15],
              ['ask', 0.01854, 21800, 404.17, 70],
              ['ask', 0.01852, 9410, 174.27, 30],
              ['ask', 0.01850, 14230, 263.25, 45],
              ['ask', 0.01848, 6820, 126.07, 22],
            ].map(([side,p,a,t,d],i) => (
              <div key={i} className={`tx-depth tx-depth--${side}`} style={{'--depth':d+'%'}}>
                <span style={{color: side==='ask'?'var(--tx-sell)':'var(--tx-buy)'}}>{p.toFixed(5)}</span>
                <span>{a.toLocaleString()}</span>
                <span>{t.toFixed(2)}</span>
              </div>
            ))}
            <div style={{padding:'6px 10px', borderTop:'1px solid var(--tx-line)', borderBottom:'1px solid var(--tx-line)', background:'var(--tx-surface-2)'}}>
              <div className="tx-row tx-row--between">
                <div className="tx-mono tx-tnum" style={{fontSize:14, color:'var(--tx-buy)', fontWeight:600}}>0.01847</div>
                <div className="tx-ink-3" style={{fontSize:10}}>Spread <span className="tx-mono">0.00002</span></div>
              </div>
            </div>
            {[
              ['bid', 0.01846, 12480, 230.38, 40],
              ['bid', 0.01845, 8420, 155.35, 28],
              ['bid', 0.01843, 22110, 407.49, 65],
              ['bid', 0.01842, 4180, 77.00, 14],
              ['bid', 0.01840, 19230, 353.83, 58],
            ].map(([side,p,a,t,d],i) => (
              <div key={i} className={`tx-depth tx-depth--${side}`} style={{'--depth':d+'%'}}>
                <span style={{color:'var(--tx-buy)'}}>{p.toFixed(5)}</span>
                <span>{a.toLocaleString()}</span>
                <span>{t.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <hr className="tx-hr"/>

        {/* Motion + tokens list */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
          <div>
            <div className="tx-eyebrow" style={{marginBottom:10}}>07 · Radius</div>
            <div className="tx-mono" style={{fontSize:12, lineHeight:2}}>
              <div>--tx-r-sm · small chips, hints</div>
              <div>--tx-r-md · buttons, inputs</div>
              <div>--tx-r-lg · panels, cards</div>
              <div>--tx-r-xl · hero cards, modals</div>
            </div>
          </div>
          <div>
            <div className="tx-eyebrow" style={{marginBottom:10}}>08 · Motion</div>
            <div style={{fontSize:12, lineHeight:1.8, color:'var(--tx-ink-2)'}}>
              <div>• 140–220ms for microinteractions</div>
              <div>• <span className="tx-mono">cubic-bezier(.16, 1, .3, 1)</span> for panels + modals</div>
              <div>• Price flash: 600ms fade, buy/sell tinted bg</div>
              <div>• Full <span className="tx-mono">prefers-reduced-motion</span> honoured</div>
            </div>
          </div>
        </div>

        <div className="tx-ink-3" style={{fontSize:11, textAlign:'center', paddingTop:20}}>
          Designed for taco·exchange · pipe these tokens back into <span className="tx-mono">_variables.scss</span>
        </div>
      </div>
    </div>
  );
}

window.StyleGuide = StyleGuide;
