// Tour Script — Grand Tour Visual Novel Data
// Each scene maps to a route. Each line has character, expression, action, and text.

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
  extra?: Partial<Pick<DialogueLine, 'pause' | 'choices' | 'secondary'>>
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
              line('taco', 'neutral', 'idle', "No CEO, no board — just voters. Pretty based if you ask me."),
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
              line('taco', 'happy', 'bounce', "That's the spirit! No time for lore dumps — let's MOVE!"),
            ]
          }
        ]
      }),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 2: DAO PAGE
  // ═══════════════════════════════════════
  {
    route: '/dao',
    lines: [
      line('taco', 'happy', 'idle', "This is the DAO page! The big brain center!"),
      line('taco', 'neutral', 'idle', "See all these allocations? The community VOTES on where to put the treasury's money."),
      line('taco', 'happy', 'idle', "Pretty cool right? Democracy, but for crypto nerds."),
      line('taco', 'neutral', 'idle', "You can see which tokens the DAO holds, trading logs, and how voting power is distributed."),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 3: VOTE PAGE
  // ═══════════════════════════════════════
  {
    route: '/vote',
    lines: [
      line('taco', 'happy', 'bounce', "HERE is where the magic happens! You vote on proposals!"),
      line('taco', 'neutral', 'idle', "If you stake TACO in a neuron, you get voting power."),
      line('taco', 'happy', 'idle', "I LOVE voting day. It's like election night but every week!"),
      line('taco', 'neutral', 'idle', "Seriously though, your vote actually matters here. Every neuron counts."),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 4: WALLET PAGE
  // ═══════════════════════════════════════
  {
    route: '/wallet',
    lines: [
      line('taco', 'neutral', 'idle', "Your wallet! Tokens, neurons, swaps — it's all here."),
      line('taco', 'happy', 'idle', "Think of it as your crypto junk drawer. But organized. Mostly."),
      line('taco', 'neutral', 'idle', "You can swap tokens, create neurons, stake, send — the works."),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 5: REWARDS PAGE
  // ═══════════════════════════════════════
  {
    route: '/rewards',
    lines: [
      line('taco', 'happy', 'bounce', "THE BEST PAGE! REWARDS!"),
      line('taco', 'happy', 'idle', "Vote, hold neurons, and get rewarded. Every. Single. Week."),
      line('taco', 'happy', 'idle', "I mean, that's basically free money. I love free money."),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 6: PERFORMANCE PAGE — THE SCREEN SLAP
  // ═══════════════════════════════════════
  {
    route: '/performance',
    lines: [
      line('taco', 'neutral', 'idle', "For the analytics nerds among us — and I respect that."),
      line('taco', 'neutral', 'idle', "Charts, leaderboards, all that good stuff."),
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
      line('nacho', 'neutral', 'idle', "The vault lets you mint stablecoins backed by crypto. Pretty important stuff.", {
        secondary: { character: 'taco', expression: 'suspicious', action: 'idle' }
      }),
      line('taco', 'surprised', 'idle', "...okay that's actually pretty cool", {
        secondary: { character: 'nacho', expression: 'happy', action: 'idle' }
      }),
      line('nacho', 'happy', 'idle', "See? We're complementary. You're the community, I'm the stability.", {
        secondary: { character: 'taco', expression: 'neutral', action: 'idle' }
      }),
      line('taco', 'suspicious', 'idle', "...Fine. You can stay. BUT I'm still the main character.", {
        secondary: { character: 'nacho', expression: 'happy', action: 'idle' }
      }),
      line('nacho', 'happy', 'idle', "Whatever you say, taco-breath.", {
        secondary: { character: 'taco', expression: 'happy', action: 'idle' }
      }),
    ]
  },

  // ═══════════════════════════════════════
  // ACT 8: BACK TO HOME — FINALE
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
      line('taco', 'angry', 'shake', "NOBODY ASKED YOU—", {
        secondary: { character: 'nacho', expression: 'happy', action: 'idle' }
      }),
      line('taco', 'neutral', 'idle', "...okay fine, there's also a forum and chat. Check out the Chat page.", {
        secondary: { character: 'nacho', expression: 'neutral', action: 'idle' }
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
