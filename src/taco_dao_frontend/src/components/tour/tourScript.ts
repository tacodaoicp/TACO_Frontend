// Tour Script — Grand Tour Visual Novel Data
// Each scene maps to a route. Each line has character, expression, action, and text.
// Interactive fields: highlight, scrollTo, click, animateSliders, toggleBattle

export type Expression = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'excited' | 'confused' | 'suspicious' | 'embarrassed' | 'smug'
export type Action = 'idle' | 'enter' | 'exit' | 'bounce' | 'shake' | 'slap-screen' | null
export type Character = 'taco' | 'nacho'

export interface DialogueLine {
  character: Character
  expression: Expression
  action: Action
  text: string
  /** If set, this line is a timed pause (ms) before auto-advancing */
  pause?: number
  /** If set, show FAQ choices instead of advancing on space */
  choices?: TourChoice[]
  /** Secondary character state (for scenes with both on screen) */
  secondary?: {
    character: Character
    expression: Expression
    action: Action
  }
  /** CSS selector — element gets z-index elevation + golden glow highlight */
  highlight?: string
  /** CSS selector — smooth scroll to this element (defaults to highlight if not set) */
  scrollTo?: string
  /** CSS selector — programmatically .click() this element */
  click?: string
  /** Smooth slider animation config */
  animateSliders?: {
    container: string
    demoValues: number[]
    duration: number
  }
  /** Hover over chart data points to trigger tooltips */
  hoverChartPoints?: {
    /** CSS selector for the chart container */
    container: string
    /** How many points to hover (from the end of the series) */
    count: number
    /** Dwell time on each point in ms */
    dwellMs: number
  }
  /** Comedy toggle battle (Buy page TACO vs NACHO) */
  toggleBattle?: {
    selectorA: string
    selectorB: string
    rounds: number
    delayMs: number
  }
  /** Escalating battle — accelerates through 4 phases then climaxes with lightning/whiteout */
  escalatingBattle?: {
    selectorA: string
    selectorB: string
  }
  /** Delay in ms before showing this line (for animations to settle) */
  delay?: number
  /** Explicitly remove current highlight */
  clearHighlight?: boolean
  /** Runtime condition — if returns false, this line is skipped */
  condition?: () => boolean
}

export interface TourChoice {
  label: string
  /** Lines to show when this choice is picked, then resume normal flow */
  response: DialogueLine[]
}

export interface TourScene {
  route: string
  lines: DialogueLine[]
}

// Helper to create a line more concisely
function line(
  character: Character,
  expression: Expression,
  action: Action,
  text: string,
  extra?: Partial<Omit<DialogueLine, 'character' | 'expression' | 'action' | 'text'>>
): DialogueLine {
  return { character, expression, action, text, ...extra }
}

export const tourScript: TourScene[] = [

  // ═══════════════════════════════════════
  // ACT 1: HOME PAGE
  // ═══════════════════════════════════════
  {
    route: '/',
    lines: [
      line('taco', 'happy', 'enter', "Hey! HEY!! Yeah, you! I'm TACO. Welcome to the TACO DAO!"),
      line('taco', 'happy', 'idle', "Want me to show you around? I know EVERYTHING about this place."),
      line('taco', 'neutral', 'idle', "...Okay, I know MOST things. Let's go!", {
        choices: [
          {
            label: "What's a DAO?",
            response: [
              line('taco', 'happy', 'idle', "A DAO is a Decentralized Autonomous Organization. Basically, the community runs the show."),
              line('taco', 'neutral', 'idle', "No CEO, no board. Just voters. Pretty based if you ask me."),
              line('taco', 'neutral', 'idle', "On the IC, even the code gets changed using votes. Even the developers don't fully control it."),
            ]
          },
          {
            label: "What's TACO token?",
            response: [
              line('taco', 'happy', 'bounce', "TACO is the governance token! Stake it, vote with it, get rewarded for it."),
              line('taco', 'neutral', 'idle', "It's how you have a say in this whole operation. Power to the people!"),
            ]
          },
          {
            label: "Let's just go!",
            response: [
              line('taco', 'happy', 'bounce', "That's the spirit! No time for lore dumps, let's MOVE!"),
            ]
          }
        ]
      }),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 2: DAO PAGE — Holdings & Trade Log
  // ═══════════════════════════════════════
  {
    route: '/dao',
    lines: [
      line('taco', 'happy', 'idle', "This is the DAO page! The big brain center!"),
      line('taco', 'neutral', 'idle', "See all those holdings? That's the treasury. The tokens the DAO actually owns right now.", {
        scrollTo: '#dao-allocations',
        highlight: '#dao-allocations',
      }),
      line('taco', 'happy', 'idle', "Those holdings are shaped by allocations from the community. YOU get to decide where the money goes."),
      line('taco', 'neutral', 'idle', "The DAO autonomously trades on KongSwap and ICPSwap every 5 minutes based on the community vote.", {
        clearHighlight: true,
      }),
      line('taco', 'neutral', 'idle', "Let me show you the trade log...", {
        scrollTo: '#dao-news',
        highlight: '#dao-news',
        click: '#dao-news .btn-group button:nth-child(2)',
      }),
      line('taco', 'happy', 'idle', "Every trade the DAO makes is logged right here. Fully transparent.", {
        highlight: '#dao-news',
      }),
      line('taco', 'neutral', 'idle', "Now let me show you where YOU get to have your say.", {
        clearHighlight: true,
      }),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 3: VOTE PAGE — Sliders & Voting
  // ═══════════════════════════════════════
  {
    route: '/vote',
    lines: [
      line('taco', 'happy', 'bounce', "HERE is where the magic happens!"),
      line('taco', 'neutral', 'idle', "This is the voting page. If you stake TACO in a neuron, you get voting power."),
      line('taco', 'neutral', 'idle', "TACO DAO participants can change their allocation at any time by moving these sliders.", {
        highlight: '#vote-slider-list',
      }),
      line('taco', 'happy', 'bounce', "Watch! The sliders control where the treasury invests!", {
        scrollTo: '#vote-slider-list',
        highlight: '#vote-slider-list',
        animateSliders: {
          container: '#vote-slider-list',
          demoValues: [60, 25, 10, 5],
          duration: 2000,
        },
      }),
      line('taco', 'neutral', 'idle', "Seriously though, your vote actually matters here. Every neuron counts.", {
        clearHighlight: true,
      }),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 4: PERFORMANCE PAGE — Leaderboard + Screen Slap
  // ═══════════════════════════════════════
  {
    route: '/performance',
    lines: [
      line('taco', 'neutral', 'idle', "This is where you can see your own performance and how everyone's doing."),
      line('taco', 'happy', 'idle', "Check out the Best Performers!", {
        scrollTo: '#leaderboard',
        highlight: '#leaderboard',
      }),
      line('taco', 'happy', 'bounce', "Let's peek at number one...", {
        click: '#leaderboard .lb-table tbody tr.clickable-row:first-child',
        delay: 600,
      }),
      line('taco', 'neutral', 'idle', "See that chart? That's their actual performance over time.", {
        scrollTo: '.expanded-content-row',
        highlight: '.expanded-content-row',
        hoverChartPoints: {
          container: '.expanded-content-row',
          count: 2,
          dwellMs: 3000,
        },
        pause: 9000,
      }),
      line('taco', 'happy', 'idle', "You can even follow their allocations!", {
        scrollTo: '#leaderboard .lb-table tbody tr.clickable-row:first-child',
        highlight: '#leaderboard .lb-table tbody tr.clickable-row:first-child .btn.taco-btn--success',
      }),
      line('taco', 'happy', 'idle', "Following means when their allocation changes, yours automatically follows it."),
      line('taco', 'neutral', 'idle', "And the best allocation makers get the most weekly TACO rewards.", {
        clearHighlight: true,
      }),
      // Dramatic pause — TACO watches the user
      line('taco', 'suspicious', 'idle', "...", { pause: 2000 }),
      line('taco', 'suspicious', 'idle', "Hey."),
      line('taco', 'angry', 'idle', "HEY! Are you still with me?!"),
      // THE SLAP
      line('taco', 'angry', 'slap-screen', "WAKE UP!"),
      line('taco', 'happy', 'idle', "Good. Just checking. Can't have you zoning out on MY tour."),
      line('taco', 'neutral', 'idle', "Anyway... where were we? Right. Next stop!"),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 5: ROADMAP — What's Coming Next
  // ═══════════════════════════════════════
  {
    route: '/info',
    lines: [
      line('taco', 'happy', 'idle', "Before we move on, check out what's coming next!", {
        scrollTo: '#roadmap',
        highlight: '#roadmap',
      }),
      line('taco', 'neutral', 'idle', "Multichain expansion, a white-label platform, and our own DEX. Big things ahead."),
      line('taco', 'happy', 'bounce', "Stick around. You don't want to miss this.", {
        clearHighlight: true,
      }),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 6: WALLET PAGE — TACO, Neurons, Tokens
  // ═══════════════════════════════════════
  {
    route: '/wallet',
    lines: [
      line('taco', 'angry', 'idle', "Still here? GOOD."),
      line('taco', 'neutral', 'idle', "This is TACO! You can stake it into a neuron, swap it, and transfer it.", {
        scrollTo: '#wallet-taco',
        highlight: '#wallet-taco',
      }),
      line('taco', 'happy', 'idle', "You can also see the rewards you've gotten in the weekly distribution."),
      line('taco', 'neutral', 'idle', "Here you can create new neurons to increase your voting power and manage existing ones.", {
        scrollTo: '#wallet-neurons',
        highlight: '#wallet-neurons',
        click: '.token-card__neurons .fa-chevron-right',
      }),
      line('taco', 'neutral', 'idle', "And down here, your core tokens. Hold them, swap between them anytime.", {
        scrollTo: '#wallet-tokens',
        highlight: '#wallet-tokens',
      }),
      line('taco', 'neutral', 'idle', "Alright, next up is... the Vault. I don't go there much.", {
        clearHighlight: true,
      }),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 7: VAULT PAGE — THE PLOT TWIST
  // ═══════════════════════════════════════
  {
    route: '/vault',
    lines: [
      line('taco', 'suspicious', 'idle', "Okay so... this is the Vault."),
      line('taco', 'suspicious', 'idle', "NACHOS territory."),
      // NACHO enters
      line('nacho', 'neutral', 'enter', "", {
        secondary: { character: 'taco', expression: 'surprised', action: 'idle' }
      }),
      line('taco', 'angry', 'shake', "WHO ARE YOU?! THIS IS MY TOUR!", {
        secondary: { character: 'nacho', expression: 'neutral', action: 'idle' }
      }),
      line('nacho', 'neutral', 'idle', "Relax, chip-head. I'm NACHO. I handle the vault.", {
        secondary: { character: 'taco', expression: 'angry', action: 'idle' }
      }),
      line('taco', 'suspicious', 'idle', "I don't trust triangles...", {
        secondary: { character: 'nacho', expression: 'neutral', action: 'idle' }
      }),
      line('nacho', 'neutral', 'idle', "The vault lets you mint NACHOS. A token backed by TACO's entire portfolio.", {
        secondary: { character: 'taco', expression: 'suspicious', action: 'idle' },
        scrollTo: '#vault-actions',
        highlight: '#vault-actions',
      }),
      line('nacho', 'neutral', 'idle', "The NAV price shows what 1 NACHO is worth in ICP. And yes, it changes with the portfolio.", {
        secondary: { character: 'taco', expression: 'neutral', action: 'idle' },
      }),
      line('nacho', 'neutral', 'idle', "Mint NACHOS by depositing ICP. Burn them to get part of the portfolio in your wallet.", {
        secondary: { character: 'taco', expression: 'neutral', action: 'idle' },
      }),
      line('taco', 'surprised', 'idle', "...okay that's actually pretty cool", {
        secondary: { character: 'nacho', expression: 'happy', action: 'idle' },
        clearHighlight: true,
      }),
      line('nacho', 'happy', 'idle', "See? We're complementary. You're the community, I'm the diversified bet.", {
        secondary: { character: 'taco', expression: 'neutral', action: 'idle' }
      }),
      line('taco', 'suspicious', 'idle', "...Fine. You can stay. BUT I'm still the main character.", {
        secondary: { character: 'nacho', expression: 'happy', action: 'idle' }
      }),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 8: BUY PAGE — Purchase + Toggle Battle
  // ═══════════════════════════════════════
  {
    route: '/buy',
    lines: [
      line('taco', 'happy', 'idle', "And HERE you can purchase ICP using credit card or other payment methods!", {
        secondary: { character: 'nacho', expression: 'neutral', action: 'idle' },
      }),
      line('taco', 'neutral', 'idle', "Get ICP, then swap it to TACO later on the wallet page.", {
        secondary: { character: 'nacho', expression: 'neutral', action: 'idle' },
        scrollTo: '#buy-product-toggle',
        highlight: '#buy-product-toggle',
      }),
      line('nacho', 'happy', 'idle', "...or mint it to NACHO!", {
        secondary: { character: 'taco', expression: 'angry', action: 'idle' },
        click: '.buy-taco-view__product-btn:nth-child(2)',
      }),
      line('taco', 'angry', 'shake', "HEY! This is a TACO operation!", {
        secondary: { character: 'nacho', expression: 'happy', action: 'idle' },
        click: '.buy-taco-view__product-btn:first-child',
      }),
      // The escalating battle — faster and faster until lightning climax
      line('nacho', 'smug', 'idle', "...", {
        secondary: { character: 'taco', expression: 'angry', action: 'idle' },
        escalatingBattle: {
          selectorA: '.buy-taco-view__product-btn:first-child',
          selectorB: '.buy-taco-view__product-btn:nth-child(2)',
        },
        pause: 18000,
      }),
      // Aftermath — both exhausted
      line('taco', 'sad', 'idle', "...", {
        secondary: { character: 'nacho', expression: 'sad', action: 'idle' },
        pause: 2000,
      }),
      line('taco', 'surprised', 'idle', "Did... did we both just win?", {
        secondary: { character: 'nacho', expression: 'surprised', action: 'idle' },
      }),
      line('nacho', 'happy', 'idle', "I think... we both did.", {
        secondary: { character: 'taco', expression: 'happy', action: 'idle' },
        clearHighlight: true,
      }),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 9: BACK TO HOME — FINALE
  // ═══════════════════════════════════════
  {
    route: '/',
    lines: [
      line('taco', 'happy', 'idle', "And that's the grand tour! Not bad right?", {
        secondary: { character: 'nacho', expression: 'neutral', action: 'idle' }
      }),
      line('nacho', 'neutral', 'idle', "You forgot to mention the forum.", {
        secondary: { character: 'taco', expression: 'happy', action: 'idle' }
      }),
      line('taco', 'angry', 'shake', "NOBODY ASKED YOU!", {
        secondary: { character: 'nacho', expression: 'happy', action: 'idle' }
      }),
      line('taco', 'neutral', 'idle', "...okay fine, there's also a forum and chat. Check out the Chat page.", {
        secondary: { character: 'nacho', expression: 'neutral', action: 'idle' }
      }),
      line('nacho', 'excited', 'bounce', "Oh! And don't forget, we have our own exchange!", {
        secondary: { character: 'taco', expression: 'happy', action: 'idle' },
        scrollTo: '.home-view__exchange-cta',
        highlight: '.home-view__exchange-cta',
      }),
      line('nacho', 'neutral', 'idle', "V3 concentrated liquidity pools, limit orders merged with AMM liquidity. It's a hybrid DEX.", {
        secondary: { character: 'taco', expression: 'neutral', action: 'idle' }
      }),
      line('taco', 'happy', 'idle', "The DAO's allocation trades actually add liquidity to the exchange! So the more people vote, the deeper the pools get.", {
        secondary: { character: 'nacho', expression: 'neutral', action: 'idle' }
      }),
      line('nacho', 'happy', 'idle', "Plus private OTC trades if you want to move size without slippage.", {
        secondary: { character: 'taco', expression: 'neutral', action: 'idle' }
      }),
      line('nacho', 'neutral', 'idle', "And multi-hop routing finds you the best price across all pools automatically.", {
        secondary: { character: 'taco', expression: 'neutral', action: 'idle' }
      }),
      line('taco', 'smug', 'idle', "Built right here on the IC. No middlemen, no CEX nonsense.", {
        secondary: { character: 'nacho', expression: 'happy', action: 'idle' },
        clearHighlight: true,
      }),
      line('taco', 'happy', 'idle', "Anyway! Get out there, stake some TACO, vote on stuff, earn rewards!", {
        secondary: { character: 'nacho', expression: 'happy', action: 'idle' }
      }),
      line('nacho', 'happy', 'idle', "And check out the vault.", {
        secondary: { character: 'taco', expression: 'neutral', action: 'idle' }
      }),
      line('taco', 'neutral', 'idle', "...And check out the vault. Happy now?", {
        secondary: { character: 'nacho', expression: 'happy', action: 'idle' }
      }),
      line('nacho', 'happy', 'idle', "Ecstatic.", {
        secondary: { character: 'taco', expression: 'happy', action: 'idle' }
      }),
      line('taco', 'happy', 'bounce', "See you around! Now go make some gains!", {
        secondary: { character: 'nacho', expression: 'happy', action: 'bounce' }
      }),
    ]
  },
]

// Character display config
export const characterConfig = {
  taco: {
    name: 'TACO',
    color: '#DA8D28',       // --dark-orange
    nameColor: '#FED66C',   // --orange
  },
  nacho: {
    name: 'NACHO',
    color: '#D4A017',
    nameColor: '#FFD700',
  }
} as const
