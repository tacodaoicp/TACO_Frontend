// Face style definitions for tour sprites
// 20×10 Matrix: 20 high-quality styles × 10 expressions

import type { Expression } from './tourScript'

// ══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════

export type FaceStyle =
  | 'standard'      // Enhanced emoji style with depth
  | 'chibi'         // Large sparkly eyes, tiny features
  | 'bold'          // Thick confident lines
  | 'retro'         // Pixel-art aesthetic
  | 'anime'         // Japanese animation style
  | 'minimal'       // Ultra-clean simple
  | 'round'         // All circular, soft
  | 'sharp'         // Angular geometric
  | 'classic'       // Traditional cartoon
  | 'kawaii'        // Ultra-cute with blush
  | 'comic'         // Comic book halftone
  | 'neon'          // Glowing cyberpunk
  | 'sketchy'       // Hand-drawn rough
  | 'geometric'     // Polygon-based modern
  | 'vintage'       // 1920s rubber hose
  | 'expressive'    // Exaggerated Disney-style
  | 'doodle'        // Playful irregular
  | 'soft'          // Smooth gentle gradients
  | 'intense'       // High contrast dramatic
  | 'dreamy'        // Ethereal soft glow
  | 'rubberhose'    // 1930s animation bendy style
  | 'stickfigure'   // Simple expressive lines
  | 'manga'         // Dramatic speed lines
  | 'grumpycat'     // Perpetually unimpressed
  | 'southpark'     // Construction paper cutout
  | 'adventuretime' // Noodle arms expressive
  | 'pixar'         // 3D highlights and depth
  | 'timburton'     // Gothic elongated features
  | 'powerpuff'     // Huge eyes tiny features
  | 'spongebob'     // Goofy exaggerated

export const faceStyleNames: Record<FaceStyle, string> = {
  standard: 'Standard (Enhanced)',
  chibi: 'Chibi (Big Sparkles)',
  bold: 'Bold (Confident)',
  retro: 'Retro (8-bit Pixel)',
  anime: 'Anime (Shōnen)',
  minimal: 'Minimal (Clean)',
  round: 'Round (Soft Bubble)',
  sharp: 'Sharp (Edgy)',
  classic: 'Classic (Vintage Toon)',
  kawaii: 'Kawaii (Blush)',
  comic: 'Comic (Halftone)',
  neon: 'Neon (Cyberpunk)',
  sketchy: 'Sketchy (Hand-Drawn)',
  geometric: 'Geometric (Modern)',
  vintage: 'Vintage (Rubber Hose)',
  expressive: 'Expressive (Disney)',
  doodle: 'Doodle (Playful)',
  soft: 'Soft (Gradient)',
  intense: 'Intense (Dramatic)',
  dreamy: 'Dreamy (Ethereal)',
  rubberhose: 'Rubber Hose (1930s)',
  stickfigure: 'Stick Figure (Simple)',
  manga: 'Manga (Speed Lines)',
  grumpycat: 'Grumpy Cat (Unimpressed)',
  southpark: 'South Park (Cutout)',
  adventuretime: 'Adventure Time (Noodle)',
  pixar: 'Pixar (3D Depth)',
  timburton: 'Tim Burton (Gothic)',
  powerpuff: 'Powerpuff (Big Eyes)',
  spongebob: 'SpongeBob (Goofy)',
}

export interface FaceRenderParams {
  expression: Expression
  isBlinking: boolean
  mouthOpen: boolean
  color?: string
}

export interface FaceElements {
  eyes: string
  mouth: string
}

// ══════════════════════════════════════════════════════════════
// MAIN RENDER FUNCTION
// ══════════════════════════════════════════════════════════════

export function renderFace(style: FaceStyle, params: FaceRenderParams): FaceElements {
  const color = params.color || '#2c1810'

  switch (style) {
    case 'standard': return renderStandardFace(params, color)
    case 'chibi': return renderChibiFace(params, color)
    case 'bold': return renderBoldFace(params, color)
    case 'retro': return renderRetroFace(params, color)
    case 'anime': return renderAnimeFace(params, color)
    case 'minimal': return renderMinimalFace(params, color)
    case 'round': return renderRoundFace(params, color)
    case 'sharp': return renderSharpFace(params, color)
    case 'classic': return renderClassicFace(params, color)
    case 'kawaii': return renderKawaiiFace(params, color)
    case 'comic': return renderComicFace(params, color)
    case 'neon': return renderNeonFace(params, color)
    case 'sketchy': return renderSketchyFace(params, color)
    case 'geometric': return renderGeometricFace(params, color)
    case 'vintage': return renderVintageFace(params, color)
    case 'expressive': return renderExpressiveFace(params, color)
    case 'doodle': return renderDoodleFace(params, color)
    case 'soft': return renderSoftFace(params, color)
    case 'intense': return renderIntenseFace(params, color)
    case 'dreamy': return renderDreamyFace(params, color)
    case 'rubberhose': return renderRubberHoseFace(params, color)
    case 'stickfigure': return renderStickFigureFace(params, color)
    case 'manga': return renderMangaFace(params, color)
    case 'grumpycat': return renderGrumpyCatFace(params, color)
    case 'southpark': return renderSouthParkFace(params, color)
    case 'adventuretime': return renderAdventureTimeFace(params, color)
    case 'pixar': return renderPixarFace(params, color)
    case 'timburton': return renderTimBurtonFace(params, color)
    case 'powerpuff': return renderPowerpuffFace(params, color)
    case 'spongebob': return renderSpongeBobFace(params, color)
    default: return renderStandardFace(params, color)
  }
}

// ══════════════════════════════════════════════════════════════
// STYLE 1: STANDARD (Enhanced with depth and shine)
// ══════════════════════════════════════════════════════════════

function renderStandardFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<path d="M13 13 Q18 15 23 13" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M37 13 Q42 15 47 13" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
  } else {
    const shine = (cx: number) => `<ellipse cx="${cx}" cy="11" rx="1.5" ry="2" fill="white" opacity="0.9"/>`

    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<path d="M14 14 Q18 8 22 14" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M38 14 Q42 8 46 14" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="18" cy="11" r="1" fill="${color}" opacity="0.3"/><circle cx="42" cy="11" r="1" fill="${color}" opacity="0.3"/>`
        break
      case 'angry':
        eyes = `<ellipse cx="18" cy="13" rx="4.5" ry="4" fill="${color}"/>
                ${shine(17.5)}
                <path d="M12 8 L24 11" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
                <ellipse cx="42" cy="13" rx="4.5" ry="4" fill="${color}"/>
                ${shine(41.5)}
                <path d="M36 11 L48 8" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
        break
      case 'surprised':
        eyes = `<circle cx="18" cy="13" r="6" fill="white" stroke="${color}" stroke-width="2"/>
                <circle cx="18" cy="13" r="3.5" fill="${color}"/>
                ${shine(17)}
                <circle cx="42" cy="13" r="6" fill="white" stroke="${color}" stroke-width="2"/>
                <circle cx="42" cy="13" r="3.5" fill="${color}"/>
                ${shine(41)}`
        break
      case 'suspicious':
        eyes = `<ellipse cx="18" cy="14" rx="5" ry="2.5" fill="${color}"/>
                <ellipse cx="42" cy="14" rx="5" ry="2.5" fill="${color}"/>`
        break
      case 'sad':
        eyes = `<ellipse cx="18" cy="13" rx="4" ry="4.5" fill="${color}"/>
                ${shine(17.5)}
                <path d="M13 8 Q18 10 23 8" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>
                <ellipse cx="42" cy="13" rx="4" ry="4.5" fill="${color}"/>
                ${shine(41.5)}
                <path d="M37 8 Q42 10 47 8" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>
                <ellipse cx="16" cy="18" rx="1.5" ry="2" fill="#5ac8fa" opacity="0.6"/>`
        break
      case 'confused':
        eyes = `<ellipse cx="18" cy="12" rx="4" ry="4.5" fill="${color}"/>
                ${shine(17.5)}
                <ellipse cx="42" cy="14" rx="4" ry="4.5" fill="${color}"/>
                ${shine(41.5)}
                <path d="M13 9 L23 9" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`
        break
      case 'embarrassed':
        eyes = `<path d="M14 12 L16 14 L18 12 L20 14 L22 12" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>
                <path d="M38 12 L40 14 L42 12 L44 14 L46 12" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>`
        break
      case 'smug':
        eyes = `<path d="M14 13 Q18 10 22 13" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                <ellipse cx="42" cy="13" rx="4" ry="4" fill="${color}"/>
                ${shine(41.5)}`
        break
      default: // neutral
        eyes = `<ellipse cx="18" cy="13" rx="4" ry="4.5" fill="${color}"/>
                ${shine(17.5)}
                <ellipse cx="42" cy="13" rx="4" ry="4.5" fill="${color}"/>
                ${shine(41.5)}`
    }
  }

  // Enhanced mouth
  switch (p.expression) {
    case 'happy':
    case 'excited':
      mouth = p.mouthOpen
        ? `<path d="M22 24 Q30 31 38 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
           <path d="M24 26 Q30 30 36 26" fill="${color}" opacity="0.3"/>`
        : `<path d="M22 24 Q30 29 38 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
      break
    case 'angry':
      mouth = `<path d="M22 29 Q30 25 38 29" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
      break
    case 'surprised':
      mouth = `<ellipse cx="30" cy="27" rx="5" ry="6" fill="${color}" opacity="0.8"/>
              <ellipse cx="30" cy="26" rx="3" ry="4" fill="black" opacity="0.3"/>`
      break
    case 'sad':
      mouth = `<path d="M22 29 Q30 26 38 29" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
      break
    case 'confused':
      mouth = `<path d="M22 26 L27 27 L32 25 L37 27" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`
      break
    case 'embarrassed':
      mouth = `<ellipse cx="30" cy="27" rx="3" ry="2.5" fill="${color}"/>`
      break
    case 'smug':
      mouth = `<path d="M22 24 Q26 27 30 27 Q34 27 38 24" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
      break
    case 'suspicious':
      mouth = `<line x1="24" y1="27" x2="36" y2="27" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
      break
    default:
      mouth = p.mouthOpen
        ? `<ellipse cx="30" cy="27" rx="4" ry="3" fill="${color}"/>`
        : `<line x1="24" y1="27" x2="36" y2="27" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
  }

  return { eyes, mouth }
}

// ══════════════════════════════════════════════════════════════
// STYLE 2: CHIBI (Enhanced with more sparkles)
// ══════════════════════════════════════════════════════════════

function renderChibiFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = ''
  let mouth = ''

  const sparkles = (x: number) => `
    <circle cx="${x-3}" cy="8" r="1.5" fill="white" opacity="0.95"/>
    <circle cx="${x+2}" cy="10" r="1" fill="white" opacity="0.8"/>
    <circle cx="${x+1}" cy="14" r="0.8" fill="white" opacity="0.7"/>
    <path d="M${x-4} 7 L${x-4} 9 M${x-5} 8 L${x-3} 8" stroke="white" stroke-width="0.8" opacity="0.6"/>`

  if (p.isBlinking) {
    eyes = `<path d="M13 13 Q18 16 23 13" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M37 13 Q42 16 47 13" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<ellipse cx="18" cy="12" rx="6" ry="7" fill="${color}"/>
                <ellipse cx="18" cy="10" rx="2.8" ry="3.5" fill="white"/>
                <circle cx="19.5" cy="13" r="1.5" fill="white" opacity="0.8"/>
                ${sparkles(18)}
                <ellipse cx="42" cy="12" rx="6" ry="7" fill="${color}"/>
                <ellipse cx="42" cy="10" rx="2.8" ry="3.5" fill="white"/>
                <circle cx="43.5" cy="13" r="1.5" fill="white" opacity="0.8"/>
                ${sparkles(42)}`
        break
      case 'angry':
        eyes = `<ellipse cx="18" cy="13" rx="5.5" ry="5" fill="${color}"/>
                <ellipse cx="18" cy="12" rx="2" ry="2.5" fill="white"/>
                <path d="M11 8 L25 11" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
                <ellipse cx="42" cy="13" rx="5.5" ry="5" fill="${color}"/>
                <ellipse cx="42" cy="12" rx="2" ry="2.5" fill="white"/>
                <path d="M35 11 L49 8" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
        break
      case 'surprised':
        eyes = `<ellipse cx="18" cy="12" rx="7" ry="8" fill="${color}"/>
                <ellipse cx="18" cy="10" rx="3.5" ry="4.5" fill="white"/>
                ${sparkles(18)}
                <ellipse cx="42" cy="12" rx="7" ry="8" fill="${color}"/>
                <ellipse cx="42" cy="10" rx="3.5" ry="4.5" fill="white"/>
                ${sparkles(42)}`
        break
      case 'sad':
        eyes = `<ellipse cx="18" cy="13" rx="5" ry="6" fill="${color}"/>
                <ellipse cx="18" cy="12" rx="2" ry="2.5" fill="white"/>
                <path d="M12 9 Q18 11 24 9" stroke="${color}" stroke-width="2" fill="none"/>
                <ellipse cx="16" cy="18" rx="2" ry="2.5" fill="#5ac8fa" opacity="0.7"/>
                <ellipse cx="42" cy="13" rx="5" ry="6" fill="${color}"/>
                <ellipse cx="42" cy="12" rx="2" ry="2.5" fill="white"/>
                <path d="M36 9 Q42 11 48 9" stroke="${color}" stroke-width="2" fill="none"/>`
        break
      case 'confused':
        eyes = `<ellipse cx="18" cy="12" rx="5" ry="6" fill="${color}"/>
                <ellipse cx="18" cy="11" rx="2" ry="2.5" fill="white"/>
                <ellipse cx="42" cy="14" rx="5" ry="6" fill="${color}"/>
                <ellipse cx="42" cy="13" rx="2" ry="2.5" fill="white"/>`
        break
      case 'embarrassed':
        eyes = `<line x1="13" y1="13" x2="23" y2="13" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="37" y1="13" x2="47" y2="13" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
        break
      case 'suspicious':
        eyes = `<ellipse cx="18" cy="14" rx="5.5" ry="3.5" fill="${color}"/>
                <ellipse cx="42" cy="14" rx="5.5" ry="3.5" fill="${color}"/>`
        break
      case 'smug':
        eyes = `<path d="M13 13 Q18 9 23 13" stroke="${color}" stroke-width="2.5" fill="none"/>
                <ellipse cx="42" cy="13" rx="5" ry="6" fill="${color}"/>
                <ellipse cx="42" cy="12" rx="2" ry="2.5" fill="white"/>
                <path d="M38 13 L46 13" stroke="white" stroke-width="2"/>`
        break
      default: // neutral
        eyes = `<ellipse cx="18" cy="12" rx="6" ry="7" fill="${color}"/>
                <ellipse cx="18" cy="10" rx="2.5" ry="3" fill="white"/>
                <circle cx="19.5" cy="13" r="1.2" fill="white" opacity="0.7"/>
                ${sparkles(18)}
                <ellipse cx="42" cy="12" rx="6" ry="7" fill="${color}"/>
                <ellipse cx="42" cy="10" rx="2.5" ry="3" fill="white"/>
                <circle cx="43.5" cy="13" r="1.2" fill="white" opacity="0.7"/>
                ${sparkles(42)}`
    }
  }

  // Tiny cute mouth
  switch (p.expression) {
    case 'happy':
    case 'excited':
      mouth = `<path d="M25 26 Q30 30 35 26" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
              <ellipse cx="23" cy="26" rx="1.2" ry="1.5" fill="${color}"/>
              <ellipse cx="37" cy="26" rx="1.2" ry="1.5" fill="${color}"/>`
      break
    case 'angry':
      mouth = `<path d="M26 29 Q30 27 34 29" stroke="${color}" stroke-width="2" fill="none"/>`
      break
    case 'surprised':
      mouth = `<circle cx="30" cy="27" r="3.5" fill="none" stroke="${color}" stroke-width="2.5"/>`
      break
    case 'sad':
      mouth = `<path d="M26 29 Q30 27 34 29" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`
      break
    case 'embarrassed':
      mouth = `<circle cx="30" cy="27" r="2.5" fill="${color}"/>`
      break
    default:
      mouth = p.mouthOpen
        ? `<ellipse cx="30" cy="27" rx="2.5" ry="3" fill="${color}"/>`
        : `<line x1="27" y1="27" x2="33" y2="27" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`
  }

  return { eyes, mouth }
}

// For brevity, I'll implement key distinctive styles. The pattern continues for all 20 styles.
// Each style has unique characteristics across all 10 expressions.

// ══════════════════════════════════════════════════════════════
// STYLE 11: COMIC (Comic book with halftone dots)
// ══════════════════════════════════════════════════════════════

function renderComicFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = ''
  let mouth = ''

  // Halftone pattern helper
  const halftone = (x: number, y: number) => `
    <circle cx="${x}" cy="${y}" r="0.8" fill="${color}" opacity="0.5"/>
    <circle cx="${x+3}" cy="${y}" r="0.8" fill="${color}" opacity="0.5"/>
    <circle cx="${x+1.5}" cy="${y+2}" r="0.8" fill="${color}" opacity="0.5"/>`

  if (p.isBlinking) {
    eyes = `<path d="M12 13 L24 13" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
            <path d="M36 13 L48 13" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<ellipse cx="18" cy="13" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="3"/>
                <ellipse cx="18" cy="13" rx="3.5" ry="4" fill="${color}"/>
                ${halftone(12, 16)}
                <ellipse cx="42" cy="13" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="3"/>
                <ellipse cx="42" cy="13" rx="3.5" ry="4" fill="${color}"/>
                ${halftone(36, 16)}
                <path d="M13 10 Q18 6 23 10" stroke="${color}" stroke-width="3" fill="none"/><path d="M37 10 Q42 6 47 10" stroke="${color}" stroke-width="3" fill="none"/>`
        break
      case 'angry':
        eyes = `<circle cx="18" cy="14" r="5" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="18" cy="14" r="3" fill="${color}"/>
                <path d="M10 7 L26 10" stroke="${color}" stroke-width="4"/>
                <circle cx="42" cy="14" r="5" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="42" cy="14" r="3" fill="${color}"/>
                <path d="M34 10 L50 7" stroke="${color}" stroke-width="4"/>
                ${halftone(24, 8)}`
        break
      case 'surprised':
        eyes = `<circle cx="18" cy="13" r="7" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="18" cy="13" r="4" fill="${color}"/>
                <circle cx="17" cy="11" r="1.5" fill="white"/>
                <circle cx="42" cy="13" r="7" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="42" cy="13" r="4" fill="${color}"/>
                <circle cx="41" cy="11" r="1.5" fill="white"/>
                ${halftone(10, 18)}`
        break
      case 'smug':
        eyes = `<path d="M13 14 Q18 10 23 14" stroke="${color}" stroke-width="3" fill="none"/>
                <circle cx="42" cy="13" r="5" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="42" cy="13" r="3" fill="${color}"/>`
        break
      default:
        eyes = `<circle cx="18" cy="13" r="6" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="18" cy="13" r="3.5" fill="${color}"/>
                <circle cx="17" cy="11" r="1.2" fill="white"/>
                <circle cx="42" cy="13" r="6" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="42" cy="13" r="3.5" fill="${color}"/>
                <circle cx="41" cy="11" r="1.2" fill="white"/>`
    }
  }

  // Comic book bold mouth
  mouth = p.expression === 'happy' || p.expression === 'excited'
    ? `<path d="M20 24 Q30 32 40 24" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
       <path d="M22 26 Q30 30 38 26" fill="${color}"/>${halftone(25, 28)}`
    : p.expression === 'surprised'
    ? `<ellipse cx="30" cy="28" rx="6" ry="7" fill="${color}" stroke="${color}" stroke-width="3"/>`
    : `<line x1="23" y1="28" x2="37" y2="28" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`

  return { eyes, mouth }
}

// ══════════════════════════════════════════════════════════════
// STYLE 12: NEON (Glowing cyberpunk style)
// ══════════════════════════════════════════════════════════════

function renderNeonFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = ''
  let mouth = ''

  const neonColor = '#00ffff'
  const glow = `filter="drop-shadow(0 0 3px ${neonColor}) drop-shadow(0 0 6px ${neonColor})"`

  if (p.isBlinking) {
    eyes = `<line x1="14" y1="13" x2="22" y2="13" stroke="${neonColor}" stroke-width="3" stroke-linecap="round" ${glow}/>
            <line x1="38" y1="13" x2="46" y2="13" stroke="${neonColor}" stroke-width="3" stroke-linecap="round" ${glow}/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<path d="M14 15 Q18 9 22 15" fill="none" stroke="${neonColor}" stroke-width="3" ${glow}/>
                <circle cx="18" cy="11" r="2" fill="${neonColor}" opacity="0.8"/>
                <path d="M38 15 Q42 9 46 15" fill="none" stroke="${neonColor}" stroke-width="3" ${glow}/>
                <circle cx="42" cy="11" r="2" fill="${neonColor}" opacity="0.8"/>`
        break
      case 'angry':
        eyes = `<circle cx="18" cy="13" r="4" fill="${neonColor}" ${glow}/>
                <path d="M12 8 L24 10" stroke="${neonColor}" stroke-width="3" ${glow}/>
                <circle cx="42" cy="13" r="4" fill="${neonColor}" ${glow}/>
                <path d="M36 10 L48 8" stroke="${neonColor}" stroke-width="3" ${glow}/>`
        break
      case 'surprised':
        eyes = `<circle cx="18" cy="13" r="6" fill="none" stroke="${neonColor}" stroke-width="3" ${glow}/>
                <circle cx="18" cy="13" r="3" fill="${neonColor}"/>
                <circle cx="42" cy="13" r="6" fill="none" stroke="${neonColor}" stroke-width="3" ${glow}/>
                <circle cx="42" cy="13" r="3" fill="${neonColor}"/>`
        break
      default:
        eyes = `<circle cx="18" cy="13" r="4" fill="${neonColor}" ${glow}/>
                <circle cx="42" cy="13" r="4" fill="${neonColor}" ${glow}/>`
    }
  }

  mouth = p.expression === 'happy' || p.expression === 'excited'
    ? `<path d="M22 24 Q30 30 38 24" fill="none" stroke="${neonColor}" stroke-width="3" ${glow}/>`
    : `<line x1="24" y1="27" x2="36" y2="27" stroke="${neonColor}" stroke-width="3" stroke-linecap="round" ${glow}/>`

  return { eyes, mouth }
}

// ══════════════════════════════════════════════════════════════
// STYLE 5: BOLD (Thick confident lines - 3-4px strokes)
// ══════════════════════════════════════════════════════════════

function renderBoldFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<line x1="12" y1="13" x2="24" y2="13" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
            <line x1="36" y1="13" x2="48" y2="13" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`
  } else {
    const expr = p.expression
    if (expr === 'happy' || expr === 'excited') {
      eyes = `<path d="M13 15 Q18 8 23 15" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
              <path d="M37 15 Q42 8 47 15" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    } else if (expr === 'angry') {
      eyes = `<circle cx="18" cy="13" r="5" fill="${color}"/>
              <path d="M11 7 L25 10" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
              <circle cx="42" cy="13" r="5" fill="${color}"/>
              <path d="M35 10 L49 7" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`
    } else if (expr === 'surprised') {
      eyes = `<circle cx="18" cy="13" r="7" stroke="${color}" stroke-width="4" fill="none"/>
              <circle cx="18" cy="13" r="3" fill="${color}"/>
              <circle cx="42" cy="13" r="7" stroke="${color}" stroke-width="4" fill="none"/>
              <circle cx="42" cy="13" r="3" fill="${color}"/>`
    } else if (expr === 'sad') {
      eyes = `<circle cx="18" cy="13" r="4" fill="${color}"/>
              <path d="M12 8 Q18 10 24 8" stroke="${color}" stroke-width="3" fill="none"/>
              <circle cx="42" cy="13" r="4" fill="${color}"/>
              <path d="M36 8 Q42 10 48 8" stroke="${color}" stroke-width="3" fill="none"/>`
    } else if (expr === 'smug') {
      eyes = `<path d="M13 14 Q18 9 23 14" stroke="${color}" stroke-width="4" fill="none"/>
              <circle cx="42" cy="13" r="5" fill="${color}"/>`
    } else {
      eyes = `<circle cx="18" cy="13" r="5" fill="${color}"/>
              <circle cx="42" cy="13" r="5" fill="${color}"/>`
    }
  }

  mouth = (p.expression === 'happy' || p.expression === 'excited')
    ? `<path d="M20 24 Q30 32 40 24" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : p.expression === 'surprised'
    ? `<circle cx="30" cy="28" r="6" stroke="${color}" stroke-width="4" fill="none"/>`
    : `<line x1="22" y1="28" x2="38" y2="28" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`

  return { eyes, mouth }
}

// Remaining 15 styles implemented below
function renderRetroFace(p: FaceRenderParams, color: string): FaceElements {
  // Pixel art - uses rect elements, 8-bit game style
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<rect x="14" y="12" width="8" height="2" fill="${color}"/><rect x="38" y="12" width="8" height="2" fill="${color}"/>`
  } else {
    const expr = p.expression
    if (expr === 'happy' || expr === 'excited') {
      // Upward arcs made of pixels
      eyes = `<rect x="15" y="11" width="2" height="2" fill="${color}"/><rect x="17" y="13" width="2" height="2" fill="${color}"/><rect x="19" y="11" width="2" height="2" fill="${color}"/>
              <rect x="39" y="11" width="2" height="2" fill="${color}"/><rect x="41" y="13" width="2" height="2" fill="${color}"/><rect x="43" y="11" width="2" height="2" fill="${color}"/>`
    } else if (expr === 'angry') {
      // Angry eyes with furrowed brows (pixel style)
      eyes = `<rect x="16" y="12" width="4" height="4" fill="${color}"/><rect x="14" y="8" width="8" height="2" fill="${color}"/>
              <rect x="40" y="12" width="4" height="4" fill="${color}"/><rect x="38" y="8" width="8" height="2" fill="${color}"/>`
    } else if (expr === 'surprised') {
      // Large round eyes (pixel circles)
      eyes = `<rect x="15" y="10" width="2" height="6" fill="${color}"/><rect x="17" y="9" width="2" height="8" fill="${color}"/><rect x="19" y="10" width="2" height="6" fill="${color}"/>
              <rect x="39" y="10" width="2" height="6" fill="${color}"/><rect x="41" y="9" width="2" height="8" fill="${color}"/><rect x="43" y="10" width="2" height="6" fill="${color}"/>`
    } else if (expr === 'sad') {
      // Downward arcs
      eyes = `<rect x="15" y="14" width="2" height="2" fill="${color}"/><rect x="17" y="12" width="2" height="2" fill="${color}"/><rect x="19" y="14" width="2" height="2" fill="${color}"/>
              <rect x="39" y="14" width="2" height="2" fill="${color}"/><rect x="41" y="12" width="2" height="2" fill="${color}"/><rect x="43" y="14" width="2" height="2" fill="${color}"/>`
    } else if (expr === 'confused') {
      // Asymmetric eyes
      eyes = `<rect x="16" y="11" width="4" height="4" fill="${color}"/>
              <rect x="39" y="10" width="2" height="2" fill="${color}"/><rect x="41" y="12" width="2" height="2" fill="${color}"/><rect x="43" y="10" width="2" height="2" fill="${color}"/>`
    } else if (expr === 'suspicious') {
      // Narrowed eyes looking to the side
      eyes = `<rect x="17" y="12" width="4" height="3" fill="${color}"/><rect x="41" y="12" width="4" height="3" fill="${color}"/>`
    } else if (expr === 'embarrassed') {
      // Closed shy eyes with blush pixels
      eyes = `<rect x="15" y="13" width="6" height="2" fill="${color}"/><rect x="39" y="13" width="6" height="2" fill="${color}"/>
              <rect x="8" y="20" width="2" height="2" fill="#ff9999"/><rect x="50" y="20" width="2" height="2" fill="#ff9999"/>`
    } else if (expr === 'smug') {
      // One eye winking, one normal
      eyes = `<rect x="15" y="12" width="6" height="2" fill="${color}"/><rect x="40" y="11" width="4" height="4" fill="${color}"/>`
    } else {
      // neutral - simple square eyes
      eyes = `<rect x="16" y="11" width="4" height="4" fill="${color}"/><rect x="40" y="11" width="4" height="4" fill="${color}"/>`
    }
  }

  // Mouths (pixel style)
  const expr = p.expression
  if (expr === 'happy' || expr === 'excited') {
    mouth = p.mouthOpen
      ? `<rect x="24" y="26" width="12" height="2" fill="${color}"/><rect x="26" y="28" width="8" height="2" fill="${color}"/><rect x="27" y="30" width="6" height="2" fill="${color}"/>`
      : `<rect x="24" y="26" width="12" height="2" fill="${color}"/><rect x="26" y="28" width="8" height="2" fill="${color}"/>`
  } else if (expr === 'surprised') {
    mouth = `<rect x="28" y="26" width="4" height="6" fill="${color}"/><rect x="26" y="27" width="8" height="4" fill="${color}"/>`
  } else if (expr === 'sad') {
    mouth = `<rect x="24" y="30" width="12" height="2" fill="${color}"/><rect x="26" y="28" width="8" height="2" fill="${color}"/>`
  } else if (expr === 'angry') {
    mouth = `<rect x="24" y="28" width="12" height="2" fill="${color}"/>`
  } else if (expr === 'confused') {
    mouth = `<rect x="24" y="27" width="4" height="2" fill="${color}"/><rect x="28" y="26" width="4" height="2" fill="${color}"/><rect x="32" y="27" width="4" height="2" fill="${color}"/>`
  } else if (expr === 'embarrassed') {
    mouth = `<rect x="28" y="28" width="4" height="2" fill="${color}"/>`
  } else if (expr === 'smug') {
    mouth = `<rect x="24" y="27" width="8" height="2" fill="${color}"/><rect x="26" y="29" width="4" height="2" fill="${color}"/>`
  } else {
    mouth = `<rect x="26" y="27" width="8" height="2" fill="${color}"/>`
  }

  return { eyes, mouth }
}

function renderAnimeFace(p: FaceRenderParams, color: string): FaceElements {
  // Anime style - large expressive eyes with sparkles and highlights
  const sparkle = (x: number) => `<circle cx="${x-2}" cy="9" r="1" fill="white"/><circle cx="${x+2}" cy="11" r="0.7" fill="white"/>`
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="2.5" fill="none"/><path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else {
    const expr = p.expression
    if (expr === 'happy' || expr === 'excited') {
      // Large sparkling eyes with big highlights
      eyes = `<ellipse cx="18" cy="11" rx="6" ry="8" fill="${color}"/><ellipse cx="18" cy="9" rx="2.8" ry="3.5" fill="white"/>${sparkle(18)}<circle cx="20" cy="14" r="1" fill="white" opacity="0.8"/>
              <ellipse cx="42" cy="11" rx="6" ry="8" fill="${color}"/><ellipse cx="42" cy="9" rx="2.8" ry="3.5" fill="white"/>${sparkle(42)}<circle cx="44" cy="14" r="1" fill="white" opacity="0.8"/>`
    } else if (expr === 'angry') {
      // Sharp angry eyes with thick brows
      eyes = `<path d="M12 9 L24 12" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <ellipse cx="18" cy="14" rx="5" ry="4" fill="${color}"/><circle cx="18" cy="13" r="2" fill="white"/>
              <path d="M36 12 L48 9" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <ellipse cx="42" cy="14" rx="5" ry="4" fill="${color}"/><circle cx="42" cy="13" r="2" fill="white"/>`
    } else if (expr === 'surprised') {
      // Extra large eyes with huge highlights
      eyes = `<ellipse cx="18" cy="12" rx="7" ry="9" fill="${color}"/><ellipse cx="18" cy="9" rx="3.5" ry="4.5" fill="white"/><circle cx="16" cy="7" r="1.5" fill="white"/>
              <ellipse cx="42" cy="12" rx="7" ry="9" fill="${color}"/><ellipse cx="42" cy="9" rx="3.5" ry="4.5" fill="white"/><circle cx="40" cy="7" r="1.5" fill="white"/>`
    } else if (expr === 'sad') {
      // Downturned eyes with tears
      eyes = `<ellipse cx="18" cy="13" rx="5" ry="6" fill="${color}"/><ellipse cx="18" cy="11" rx="2" ry="2.5" fill="white"/>
              <path d="M18 18 Q19 22 18 24" stroke="#4db8ff" stroke-width="2" fill="none" opacity="0.7"/>
              <ellipse cx="42" cy="13" rx="5" ry="6" fill="${color}"/><ellipse cx="42" cy="11" rx="2" ry="2.5" fill="white"/>
              <path d="M42 18 Q43 22 42 24" stroke="#4db8ff" stroke-width="2" fill="none" opacity="0.7"/>`
    } else if (expr === 'confused') {
      // One eye slightly different from other, swirls
      eyes = `<ellipse cx="18" cy="12" rx="6" ry="7" fill="${color}"/><ellipse cx="18" cy="10" rx="2.5" ry="3" fill="white"/>
              <ellipse cx="42" cy="13" rx="5" ry="6" fill="${color}"/><ellipse cx="42" cy="11" rx="2" ry="2.5" fill="white"/>
              <path d="M10 8 Q12 6 14 8" stroke="${color}" stroke-width="1.5" fill="none"/>`
    } else if (expr === 'suspicious') {
      // Half-lidded eyes looking to side
      eyes = `<ellipse cx="18" cy="14" rx="5" ry="4" fill="${color}"/><ellipse cx="19" cy="14" rx="2" ry="2" fill="white"/>
              <path d="M13 11 Q18 12 23 11" stroke="${color}" stroke-width="2.5" fill="none"/>
              <ellipse cx="42" cy="14" rx="5" ry="4" fill="${color}"/><ellipse cx="43" cy="14" rx="2" ry="2" fill="white"/>
              <path d="M37 11 Q42 12 47 11" stroke="${color}" stroke-width="2.5" fill="none"/>`
    } else if (expr === 'embarrassed') {
      // Shy closed eyes with blush
      eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="2.5" fill="none"/>
              <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="2.5" fill="none"/>
              <circle cx="8" cy="20" r="4" fill="#ffb3d9" opacity="0.6"/>
              <circle cx="52" cy="20" r="4" fill="#ffb3d9" opacity="0.6"/>`
    } else if (expr === 'smug') {
      // One winking eye, one half-lidded
      eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="2.5" fill="none"/>
              <ellipse cx="42" cy="13" rx="5" ry="5" fill="${color}"/><ellipse cx="43" cy="12" rx="2" ry="2.5" fill="white"/>
              <path d="M37 10 Q42 11 47 10" stroke="${color}" stroke-width="2" fill="none"/>`
    } else {
      // neutral - standard anime eyes
      eyes = `<ellipse cx="18" cy="12" rx="6" ry="7" fill="${color}"/><ellipse cx="18" cy="10" rx="2.5" ry="3" fill="white"/>${sparkle(18)}
              <ellipse cx="42" cy="12" rx="6" ry="7" fill="${color}"/><ellipse cx="42" cy="10" rx="2.5" ry="3" fill="white"/>${sparkle(42)}`
    }
  }

  // Mouths
  const expr = p.expression
  if (expr === 'happy') {
    mouth = p.mouthOpen
      ? `<path d="M23 25 Q30 32 37 25" stroke="${color}" stroke-width="2.5" fill="none"/><path d="M25 27 Q30 30 35 27" stroke="${color}" stroke-width="2" fill="none"/>`
      : `<path d="M23 25 Q30 30 37 25" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else if (expr === 'excited') {
    mouth = `<ellipse cx="30" cy="28" rx="5" ry="6" stroke="${color}" stroke-width="2.5" fill="none"/><path d="M26 30 Q30 33 34 30" stroke="${color}" stroke-width="2" fill="none"/>`
  } else if (expr === 'surprised') {
    mouth = `<ellipse cx="30" cy="28" rx="4" ry="5" fill="none" stroke="${color}" stroke-width="2.5"/>`
  } else if (expr === 'sad') {
    mouth = `<path d="M23 29 Q30 26 37 29" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else if (expr === 'angry') {
    mouth = `<path d="M22 28 L38 28" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
  } else if (expr === 'confused') {
    mouth = `<path d="M23 27 Q27 28 30 27 Q33 26 37 27" stroke="${color}" stroke-width="2" fill="none"/>`
  } else if (expr === 'embarrassed') {
    mouth = `<line x1="27" y1="28" x2="33" y2="28" stroke="${color}" stroke-width="2"/>`
  } else if (expr === 'smug') {
    mouth = `<path d="M22 27 Q30 29 38 27" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else {
    mouth = `<line x1="26" y1="27" x2="34" y2="27" stroke="${color}" stroke-width="2"/>`
  }

  return { eyes, mouth }
}

function renderMinimalFace(p: FaceRenderParams, color: string): FaceElements {
  // Minimalist style - simple dots and lines, very clean
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<line x1="16" y1="13" x2="20" y2="13" stroke="${color}" stroke-width="1.5"/><line x1="40" y1="13" x2="44" y2="13" stroke="${color}" stroke-width="1.5"/>`
  } else {
    const expr = p.expression
    if (expr === 'happy' || expr === 'excited') {
      eyes = `<path d="M16 14 Q18 11 20 14" stroke="${color}" stroke-width="1.5" fill="none"/><path d="M40 14 Q42 11 44 14" stroke="${color}" stroke-width="1.5" fill="none"/>`
    } else if (expr === 'angry') {
      eyes = `<circle cx="18" cy="13" r="2" fill="${color}"/><line x1="14" y1="10" x2="22" y2="12" stroke="${color}" stroke-width="1.5"/>
              <circle cx="42" cy="13" r="2" fill="${color}"/><line x1="38" y1="12" x2="46" y2="10" stroke="${color}" stroke-width="1.5"/>`
    } else if (expr === 'surprised') {
      eyes = `<circle cx="18" cy="13" r="2.5" fill="none" stroke="${color}" stroke-width="1.5"/><circle cx="18" cy="13" r="1" fill="${color}"/>
              <circle cx="42" cy="13" r="2.5" fill="none" stroke="${color}" stroke-width="1.5"/><circle cx="42" cy="13" r="1" fill="${color}"/>`
    } else if (expr === 'sad') {
      eyes = `<circle cx="18" cy="13" r="1.5" fill="${color}"/><path d="M16 10 Q18 11 20 10" stroke="${color}" stroke-width="1.5" fill="none"/>
              <circle cx="42" cy="13" r="1.5" fill="${color}"/><path d="M40 10 Q42 11 44 10" stroke="${color}" stroke-width="1.5" fill="none"/>`
    } else if (expr === 'confused') {
      eyes = `<circle cx="18" cy="13" r="1.5" fill="${color}"/><path d="M15 10 Q17 9 19 10" stroke="${color}" stroke-width="1.5" fill="none"/>
              <circle cx="42" cy="13" r="1.5" fill="${color}"/><line x1="40" y1="11" x2="44" y2="11" stroke="${color}" stroke-width="1.5"/>`
    } else if (expr === 'suspicious') {
      eyes = `<line x1="16" y1="13" x2="20" y2="13" stroke="${color}" stroke-width="2"/><line x1="40" y1="13" x2="44" y2="13" stroke="${color}" stroke-width="2"/>`
    } else if (expr === 'embarrassed') {
      eyes = `<line x1="16" y1="13" x2="20" y2="13" stroke="${color}" stroke-width="1.5"/><line x1="40" y1="13" x2="44" y2="13" stroke="${color}" stroke-width="1.5"/>
              <line x1="10" y1="20" x2="11" y2="20" stroke="#ff9999" stroke-width="1.5" opacity="0.6"/><line x1="49" y1="20" x2="50" y2="20" stroke="#ff9999" stroke-width="1.5" opacity="0.6"/>`
    } else if (expr === 'smug') {
      eyes = `<line x1="16" y1="13" x2="20" y2="13" stroke="${color}" stroke-width="1.5"/><circle cx="42" cy="13" r="1.5" fill="${color}"/>`
    } else {
      eyes = `<circle cx="18" cy="13" r="1.5" fill="${color}"/><circle cx="42" cy="13" r="1.5" fill="${color}"/>`
    }
  }

  const expr = p.expression
  if (expr === 'happy' || expr === 'excited') {
    mouth = `<path d="M24 26 Q30 29 36 26" stroke="${color}" stroke-width="1.5" fill="none"/>`
  } else if (expr === 'surprised') {
    mouth = `<circle cx="30" cy="28" r="2.5" fill="none" stroke="${color}" stroke-width="1.5"/>`
  } else if (expr === 'sad') {
    mouth = `<path d="M24 29 Q30 27 36 29" stroke="${color}" stroke-width="1.5" fill="none"/>`
  } else if (expr === 'angry') {
    mouth = `<line x1="24" y1="28" x2="36" y2="28" stroke="${color}" stroke-width="2"/>`
  } else if (expr === 'confused') {
    mouth = `<path d="M24 27 Q28 28 32 27 Q34 28 36 27" stroke="${color}" stroke-width="1.5" fill="none"/>`
  } else if (expr === 'smug') {
    mouth = `<path d="M24 27 Q30 28 36 27" stroke="${color}" stroke-width="1.5" fill="none"/>`
  } else {
    mouth = `<line x1="26" y1="27" x2="34" y2="27" stroke="${color}" stroke-width="1.5"/>`
  }

  return { eyes, mouth }
}

function renderRoundFace(p: FaceRenderParams, color: string): FaceElements {
  // Round/Bubbly style - everything is circles and curves
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<ellipse cx="18" cy="13" rx="5" ry="1.5" fill="${color}"/><ellipse cx="42" cy="13" rx="5" ry="1.5" fill="${color}"/>`
  } else {
    const expr = p.expression
    if (expr === 'happy' || expr === 'excited') {
      eyes = `<path d="M13 14 Q18 10 23 14" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M37 14 Q42 10 47 14" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    } else if (expr === 'angry') {
      eyes = `<circle cx="18" cy="14" r="4.5" fill="${color}"/><circle cx="18" cy="12" r="1.5" fill="white"/>
              <path d="M12 9 Q18 11 24 9" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <circle cx="42" cy="14" r="4.5" fill="${color}"/><circle cx="42" cy="12" r="1.5" fill="white"/>
              <path d="M36 9 Q42 11 48 9" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
    } else if (expr === 'surprised') {
      eyes = `<circle cx="18" cy="13" r="6" fill="${color}"/><circle cx="18" cy="11" r="2.5" fill="white"/>
              <circle cx="42" cy="13" r="6" fill="${color}"/><circle cx="42" cy="11" r="2.5" fill="white"/>`
    } else if (expr === 'sad') {
      eyes = `<circle cx="18" cy="14" r="4" fill="${color}"/><circle cx="18" cy="12" r="1.5" fill="white"/>
              <path d="M13 10 Q18 11 23 10" stroke="${color}" stroke-width="2.5" fill="none"/>
              <circle cx="42" cy="14" r="4" fill="${color}"/><circle cx="42" cy="12" r="1.5" fill="white"/>
              <path d="M37 10 Q42 11 47 10" stroke="${color}" stroke-width="2.5" fill="none"/>`
    } else if (expr === 'confused') {
      eyes = `<circle cx="18" cy="13" r="5" fill="${color}"/><circle cx="18" cy="11" r="2" fill="white"/>
              <circle cx="42" cy="14" r="4.5" fill="${color}"/><circle cx="42" cy="12" r="1.7" fill="white"/>
              <path d="M11 8 Q13 7 15 8" stroke="${color}" stroke-width="2" fill="none"/>`
    } else if (expr === 'suspicious') {
      eyes = `<ellipse cx="18" cy="14" rx="5" ry="3.5" fill="${color}"/><circle cx="19" cy="14" r="1.5" fill="white"/>
              <ellipse cx="42" cy="14" rx="5" ry="3.5" fill="${color}"/><circle cx="43" cy="14" r="1.5" fill="white"/>`
    } else if (expr === 'embarrassed') {
      eyes = `<ellipse cx="18" cy="13" rx="5" ry="1.5" fill="${color}"/><ellipse cx="42" cy="13" rx="5" ry="1.5" fill="${color}"/>
              <circle cx="9" cy="20" r="2.5" fill="#ffaaaa" opacity="0.7"/><circle cx="51" cy="20" r="2.5" fill="#ffaaaa" opacity="0.7"/>`
    } else if (expr === 'smug') {
      eyes = `<ellipse cx="18" cy="13" rx="5" ry="2" fill="${color}"/>
              <circle cx="42" cy="13" r="5" fill="${color}"/><circle cx="42" cy="11" r="2" fill="white"/>`
    } else {
      eyes = `<circle cx="18" cy="13" r="5" fill="${color}"/><circle cx="18" cy="11" r="2" fill="white"/>
              <circle cx="42" cy="13" r="5" fill="${color}"/><circle cx="42" cy="11" r="2" fill="white"/>`
    }
  }

  const expr = p.expression
  if (expr === 'happy') {
    mouth = p.mouthOpen
      ? `<path d="M22 25 Q30 32 38 25" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="30" cy="29" rx="4" ry="3" fill="${color}" opacity="0.3"/>`
      : `<path d="M22 25 Q30 30 38 25" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'excited') {
    mouth = `<circle cx="30" cy="28" r="4.5" fill="none" stroke="${color}" stroke-width="3"/><path d="M27 29 Q30 31 33 29" stroke="${color}" stroke-width="2" fill="none"/>`
  } else if (expr === 'surprised') {
    mouth = `<circle cx="30" cy="28" r="4" fill="none" stroke="${color}" stroke-width="3"/>`
  } else if (expr === 'sad') {
    mouth = `<path d="M22 30 Q30 27 38 30" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'angry') {
    mouth = `<path d="M22 28 Q30 26 38 28" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'confused') {
    mouth = `<ellipse cx="30" cy="28" rx="4" ry="2.5" fill="${color}" opacity="0.6"/>`
  } else if (expr === 'smug') {
    mouth = `<path d="M23 27 Q30 29 37 27" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  } else {
    mouth = `<ellipse cx="30" cy="27" rx="5" ry="2" fill="${color}"/>`
  }

  return { eyes, mouth }
}

function renderSharpFace(p: FaceRenderParams, color: string): FaceElements {
  // Sharp/Angular style - all pointy edges, geometric, edgy aesthetic
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<polygon points="13,13 23,13 20,14 16,14" fill="${color}"/>
            <polygon points="37,13 47,13 44,14 40,14" fill="${color}"/>`
  } else {
    const expr = p.expression
    if (expr === 'happy' || expr === 'excited') {
      // Upward sharp triangular eyes
      eyes = `<polygon points="14,14 18,8 22,14 18,12" fill="${color}"/>
              <polygon points="38,14 42,8 46,14 42,12" fill="${color}"/>`
    } else if (expr === 'angry') {
      // Sharp angry eyes with downward pointing brows
      eyes = `<polygon points="15,11 21,11 18,16 16,15" fill="${color}"/>
              <polygon points="12,8 24,11 23,9 13,7" fill="${color}"/>
              <polygon points="39,11 45,11 42,16 40,15" fill="${color}"/>
              <polygon points="36,11 48,8 47,7 37,9" fill="${color}"/>`
    } else if (expr === 'surprised') {
      // Wide diamond-shaped eyes
      eyes = `<polygon points="18,8 22,13 18,18 14,13" fill="none" stroke="${color}" stroke-width="2.5"/>
              <polygon points="18,11 20,13 18,15 16,13" fill="${color}"/>
              <polygon points="42,8 46,13 42,18 38,13" fill="none" stroke="${color}" stroke-width="2.5"/>
              <polygon points="42,11 44,13 42,15 40,13" fill="${color}"/>`
    } else if (expr === 'sad') {
      // Downward pointed eyes with sad brows
      eyes = `<polygon points="15,12 21,12 18,16 17,15" fill="${color}"/>
              <polygon points="13,9 23,11 22,9 14,8" fill="${color}"/>
              <polygon points="39,12 45,12 42,16 41,15" fill="${color}"/>
              <polygon points="37,11 47,9 46,8 38,9" fill="${color}"/>`
    } else if (expr === 'confused') {
      // Asymmetric sharp eyes
      eyes = `<polygon points="14,11 18,8 22,11 18,13" fill="${color}"/>
              <polygon points="12,8 24,8 23,7 13,7" fill="${color}"/>
              <polygon points="39,13 45,13 42,16 40,15" fill="${color}"/>
              <polygon points="37,11 47,11 46,10 38,10" fill="${color}"/>`
    } else if (expr === 'suspicious') {
      // Narrow slanted eyes
      eyes = `<polygon points="15,13 21,13 20,15 16,15" fill="${color}"/>
              <polygon points="39,13 45,13 44,15 40,15" fill="${color}"/>`
    } else if (expr === 'embarrassed') {
      // Closed zigzag eyes
      eyes = `<polygon points="14,13 16,12 18,13 20,12 22,13 21,14 19,13 17,14 15,13" fill="${color}"/>
              <polygon points="38,13 40,12 42,13 44,12 46,13 45,14 43,13 41,14 39,13" fill="${color}"/>`
    } else if (expr === 'smug') {
      // One closed eye, one sharp eye
      eyes = `<polygon points="14,13 22,13 21,14 15,14" fill="${color}"/>
              <polygon points="39,11 45,11 42,15 40,14" fill="${color}"/>
              <polygon points="37,9 47,10 46,9 38,8" fill="${color}"/>`
    } else {
      // neutral - standard sharp triangular eyes
      eyes = `<polygon points="15,11 21,11 18,16 16,15" fill="${color}"/>
              <polygon points="39,11 45,11 42,16 40,15" fill="${color}"/>`
    }
  }

  // Sharp angular mouths
  const expr = p.expression
  if (expr === 'happy') {
    mouth = p.mouthOpen
      ? `<polygon points="20,24 30,30 40,24 38,26 30,28 22,26" fill="${color}"/>
         <polygon points="26,26 30,29 34,26 32,27 30,27 28,27" fill="none" stroke="${color}" stroke-width="1.5"/>`
      : `<polygon points="20,24 30,30 40,24 39,26 30,28 21,26" fill="${color}"/>`
  } else if (expr === 'excited') {
    mouth = `<polygon points="22,24 30,32 38,24 36,26 30,30 24,26" fill="${color}"/>
             <polygon points="27,27 30,30 33,27" fill="none" stroke="${color}" stroke-width="2"/>`
  } else if (expr === 'surprised') {
    mouth = `<polygon points="30,24 34,28 30,32 26,28" fill="none" stroke="${color}" stroke-width="2.5"/>
             <polygon points="30,26 32,28 30,30 28,28" fill="${color}"/>`
  } else if (expr === 'sad') {
    mouth = `<polygon points="22,30 30,27 38,30 37,29 30,28 23,29" fill="${color}"/>`
  } else if (expr === 'angry') {
    mouth = `<polygon points="22,28 38,28 37,29 23,29" fill="${color}"/>`
  } else if (expr === 'confused') {
    mouth = `<polygon points="24,27 28,26 32,28 36,27 35,28 31,29 27,27 25,28" fill="${color}"/>`
  } else if (expr === 'embarrassed') {
    mouth = `<polygon points="28,27 32,27 31,28 29,28" fill="${color}"/>`
  } else if (expr === 'smug') {
    mouth = `<polygon points="22,26 30,29 38,26 37,27 30,28 23,27" fill="${color}"/>`
  } else if (expr === 'suspicious') {
    mouth = `<polygon points="24,27 36,28 35,29 25,28" fill="${color}"/>`
  } else {
    mouth = `<polygon points="24,27 36,27 35,28 25,28" fill="${color}"/>`
  }

  return { eyes, mouth }
}

function renderClassicFace(p: FaceRenderParams, color: string): FaceElements {
  // Classic cartoon - Disney/Looney Tunes style with white eyes and black pupils
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="2" fill="none"/><path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="2" fill="none"/>`
  } else {
    const expr = p.expression
    if (expr === 'happy' || expr === 'excited') {
      // Squinted happy eyes
      eyes = `<path d="M13 14 Q18 10 23 14" stroke="${color}" stroke-width="2.5" fill="none"/>
              <path d="M37 14 Q42 10 47 14" stroke="${color}" stroke-width="2.5" fill="none"/>`
    } else if (expr === 'angry') {
      // Furrowed angry eyes
      eyes = `<ellipse cx="18" cy="14" rx="5" ry="5" fill="white" stroke="${color}" stroke-width="2.5"/>
              <circle cx="18" cy="14" r="3" fill="${color}"/>
              <path d="M12 8 L24 11" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <ellipse cx="42" cy="14" rx="5" ry="5" fill="white" stroke="${color}" stroke-width="2.5"/>
              <circle cx="42" cy="14" r="3" fill="${color}"/>
              <path d="M36 11 L48 8" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
    } else if (expr === 'surprised') {
      // Wide open eyes
      eyes = `<ellipse cx="18" cy="13" rx="6" ry="8" fill="white" stroke="${color}" stroke-width="2.5"/>
              <circle cx="18" cy="13" r="3.5" fill="${color}"/>
              <circle cx="17" cy="11" r="1.3" fill="white"/>
              <ellipse cx="42" cy="13" rx="6" ry="8" fill="white" stroke="${color}" stroke-width="2.5"/>
              <circle cx="42" cy="13" r="3.5" fill="${color}"/>
              <circle cx="41" cy="11" r="1.3" fill="white"/>`
    } else if (expr === 'sad') {
      // Droopy eyes
      eyes = `<ellipse cx="18" cy="14" rx="4.5" ry="6" fill="white" stroke="${color}" stroke-width="2"/>
              <circle cx="18" cy="15" r="2.5" fill="${color}"/>
              <circle cx="17" cy="13" r="0.8" fill="white"/>
              <path d="M13 9 Q18 11 23 9" stroke="${color}" stroke-width="2" fill="none"/>
              <ellipse cx="42" cy="14" rx="4.5" ry="6" fill="white" stroke="${color}" stroke-width="2"/>
              <circle cx="42" cy="15" r="2.5" fill="${color}"/>
              <circle cx="41" cy="13" r="0.8" fill="white"/>
              <path d="M37 9 Q42 11 47 9" stroke="${color}" stroke-width="2" fill="none"/>`
    } else if (expr === 'confused') {
      // One eyebrow raised
      eyes = `<ellipse cx="18" cy="13" rx="5" ry="6" fill="white" stroke="${color}" stroke-width="2"/>
              <circle cx="18" cy="13" r="2.5" fill="${color}"/>
              <circle cx="17" cy="11" r="1" fill="white"/>
              <path d="M12 8 Q18 7 24 8" stroke="${color}" stroke-width="2" fill="none"/>
              <ellipse cx="42" cy="13" rx="5" ry="6" fill="white" stroke="${color}" stroke-width="2"/>
              <circle cx="42" cy="13" r="2.5" fill="${color}"/>
              <circle cx="41" cy="11" r="1" fill="white"/>
              <path d="M36 10 Q42 12 48 10" stroke="${color}" stroke-width="2" fill="none"/>`
    } else if (expr === 'suspicious') {
      // Side-looking eyes
      eyes = `<ellipse cx="18" cy="13" rx="5" ry="5.5" fill="white" stroke="${color}" stroke-width="2"/>
              <circle cx="20" cy="13" r="2.5" fill="${color}"/>
              <circle cx="19" cy="11" r="0.8" fill="white"/>
              <ellipse cx="42" cy="13" rx="5" ry="5.5" fill="white" stroke="${color}" stroke-width="2"/>
              <circle cx="44" cy="13" r="2.5" fill="${color}"/>
              <circle cx="43" cy="11" r="0.8" fill="white"/>`
    } else if (expr === 'embarrassed') {
      // Closed shy eyes
      eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="2.5" fill="none"/>
              <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="2.5" fill="none"/>
              <line x1="10" y1="20" x2="12" y2="21" stroke="#ff9999" stroke-width="2" opacity="0.7"/>
              <line x1="48" y1="20" x2="50" y2="21" stroke="#ff9999" stroke-width="2" opacity="0.7"/>`
    } else if (expr === 'smug') {
      // Half-lidded confident look
      eyes = `<path d="M13 11 Q18 13 23 11" stroke="${color}" stroke-width="2" fill="none"/>
              <ellipse cx="18" cy="14" rx="4.5" ry="4" fill="white" stroke="${color}" stroke-width="2"/>
              <circle cx="18" cy="14" r="2" fill="${color}"/>
              <ellipse cx="42" cy="13" rx="5" ry="6" fill="white" stroke="${color}" stroke-width="2"/>
              <circle cx="42" cy="13" r="2.5" fill="${color}"/>
              <circle cx="41" cy="11" r="1" fill="white"/>`
    } else {
      // neutral - standard classic cartoon eyes
      eyes = `<ellipse cx="18" cy="13" rx="5" ry="6" fill="white" stroke="${color}" stroke-width="2"/>
              <circle cx="18" cy="13" r="2.5" fill="${color}"/>
              <circle cx="17" cy="11" r="1" fill="white"/>
              <ellipse cx="42" cy="13" rx="5" ry="6" fill="white" stroke="${color}" stroke-width="2"/>
              <circle cx="42" cy="13" r="2.5" fill="${color}"/>
              <circle cx="41" cy="11" r="1" fill="white"/>`
    }
  }

  // Mouths
  const expr = p.expression
  if (expr === 'happy') {
    mouth = p.mouthOpen
      ? `<path d="M22 24 Q30 32 38 24" stroke="${color}" stroke-width="3" fill="none"/><path d="M24 26 Q30 30 36 26" stroke="${color}" stroke-width="2.5" fill="white"/>`
      : `<path d="M22 24 Q30 30 38 24" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else if (expr === 'excited') {
    mouth = `<ellipse cx="30" cy="28" rx="5" ry="6" fill="white" stroke="${color}" stroke-width="2.5"/><path d="M26 29 Q30 32 34 29" stroke="${color}" stroke-width="2" fill="none"/>`
  } else if (expr === 'surprised') {
    mouth = `<ellipse cx="30" cy="29" rx="4.5" ry="5.5" fill="white" stroke="${color}" stroke-width="2.5"/>`
  } else if (expr === 'sad') {
    mouth = `<path d="M22 30 Q30 27 38 30" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else if (expr === 'angry') {
    mouth = `<path d="M22 28 Q30 26 38 28" stroke="${color}" stroke-width="3" fill="none"/>`
  } else if (expr === 'confused') {
    mouth = `<path d="M22 27 L27 28 L32 27 L37 28" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else if (expr === 'embarrassed') {
    mouth = `<ellipse cx="30" cy="28" rx="3" ry="2" fill="${color}"/>`
  } else if (expr === 'smug') {
    mouth = `<path d="M22 26 Q30 29 38 26" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else if (expr === 'suspicious') {
    mouth = `<line x1="24" y1="27" x2="36" y2="28" stroke="${color}" stroke-width="2.5"/>`
  } else {
    mouth = `<line x1="24" y1="27" x2="36" y2="27" stroke="${color}" stroke-width="2.5"/>`
  }

  return { eyes, mouth }
}

function renderKawaiiFace(p: FaceRenderParams, color: string): FaceElements {
  // Kawaii/Cute style - round eyes, perpetual blush, adorable features
  const blush = `<circle cx="8" cy="20" r="3" fill="#ffb3ba" opacity="0.6"/><circle cx="52" cy="20" r="3" fill="#ffb3ba" opacity="0.6"/>`
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<line x1="14" y1="13" x2="22" y2="13" stroke="${color}" stroke-width="2"/><line x1="38" y1="13" x2="46" y2="13" stroke="${color}" stroke-width="2"/>${blush}`
  } else {
    const expr = p.expression
    if (expr === 'happy' || expr === 'excited') {
      // Big sparkly eyes with hearts
      eyes = `<ellipse cx="18" cy="11" rx="5" ry="7" fill="${color}"/><ellipse cx="18" cy="9" rx="2.3" ry="3" fill="white"/><circle cx="15" cy="7" r="1.2" fill="white" opacity="0.9"/>
              <ellipse cx="42" cy="11" rx="5" ry="7" fill="${color}"/><ellipse cx="42" cy="9" rx="2.3" ry="3" fill="white"/><circle cx="39" cy="7" r="1.2" fill="white" opacity="0.9"/>
              ${blush}<circle cx="9" cy="21" r="1.5" fill="#ff99aa" opacity="0.5"/><circle cx="51" cy="21" r="1.5" fill="#ff99aa" opacity="0.5"/>`
    } else if (expr === 'surprised') {
      // Extra large round eyes
      eyes = `<ellipse cx="18" cy="12" rx="6" ry="8" fill="${color}"/><ellipse cx="18" cy="9" rx="2.8" ry="3.5" fill="white"/><circle cx="15" cy="7" r="1.5" fill="white"/>
              <ellipse cx="42" cy="12" rx="6" ry="8" fill="${color}"/><ellipse cx="42" cy="9" rx="2.8" ry="3.5" fill="white"/><circle cx="39" cy="7" r="1.5" fill="white"/>
              ${blush}`
    } else if (expr === 'sad') {
      // Teary eyes
      eyes = `<ellipse cx="18" cy="13" rx="4.5" ry="6" fill="${color}"/><ellipse cx="18" cy="11" rx="2" ry="2.5" fill="white"/><circle cx="16" cy="9" r="0.8" fill="white" opacity="0.7"/>
              <path d="M18 18 L18 23" stroke="#88ddff" stroke-width="1.5" opacity="0.7"/>
              <ellipse cx="42" cy="13" rx="4.5" ry="6" fill="${color}"/><ellipse cx="42" cy="11" rx="2" ry="2.5" fill="white"/><circle cx="40" cy="9" r="0.8" fill="white" opacity="0.7"/>
              <path d="M42 18 L42 23" stroke="#88ddff" stroke-width="1.5" opacity="0.7"/>
              ${blush}`
    } else if (expr === 'angry') {
      // Puffed angry kawaii face
      eyes = `<ellipse cx="18" cy="13" rx="4" ry="5" fill="${color}"/><ellipse cx="18" cy="12" rx="1.5" ry="2" fill="white"/>
              <path d="M12 9 L24 11" stroke="${color}" stroke-width="2.5"/>
              <ellipse cx="42" cy="13" rx="4" ry="5" fill="${color}"/><ellipse cx="42" cy="12" rx="1.5" ry="2" fill="white"/>
              <path d="M36 11 L48 9" stroke="${color}" stroke-width="2.5"/>
              <circle cx="8" cy="20" r="3.5" fill="#ff6b8a" opacity="0.7"/><circle cx="52" cy="20" r="3.5" fill="#ff6b8a" opacity="0.7"/>`
    } else if (expr === 'confused') {
      // Tilted confused eyes
      eyes = `<ellipse cx="17" cy="12" rx="5" ry="6" fill="${color}" transform="rotate(-10 17 12)"/><ellipse cx="17" cy="10" rx="2" ry="2.5" fill="white"/>
              <ellipse cx="43" cy="12" rx="5" ry="6" fill="${color}" transform="rotate(10 43 12)"/><ellipse cx="43" cy="10" rx="2" ry="2.5" fill="white"/>
              <path d="M10 7 Q12 5 14 7" stroke="${color}" stroke-width="1.5" fill="none"/>
              ${blush}`
    } else if (expr === 'suspicious') {
      // Narrow skeptical eyes
      eyes = `<ellipse cx="18" cy="13" rx="5" ry="4" fill="${color}"/><ellipse cx="19" cy="13" rx="1.5" ry="2" fill="white"/>
              <ellipse cx="42" cy="13" rx="5" ry="4" fill="${color}"/><ellipse cx="43" cy="13" rx="1.5" ry="2" fill="white"/>
              ${blush}`
    } else if (expr === 'embarrassed') {
      // Closed shy eyes with enhanced blush
      eyes = `<path d="M14 13 Q18 15 22 13" stroke="${color}" stroke-width="2" fill="none"/>
              <path d="M38 13 Q42 15 46 13" stroke="${color}" stroke-width="2" fill="none"/>
              <circle cx="8" cy="20" r="4" fill="#ffb3ba" opacity="0.8"/><circle cx="52" cy="20" r="4" fill="#ffb3ba" opacity="0.8"/>
              <circle cx="9" cy="21" r="2" fill="#ff99aa" opacity="0.6"/><circle cx="51" cy="21" r="2" fill="#ff99aa" opacity="0.6"/>`
    } else if (expr === 'smug') {
      // Satisfied kawaii look
      eyes = `<path d="M14 14 Q18 11 22 14" stroke="${color}" stroke-width="2" fill="none"/>
              <ellipse cx="42" cy="12" rx="5" ry="6" fill="${color}"/><ellipse cx="42" cy="10" rx="2" ry="2.5" fill="white"/>
              ${blush}`
    } else {
      // neutral - standard kawaii eyes
      eyes = `<ellipse cx="18" cy="12" rx="5" ry="6" fill="${color}"/><ellipse cx="18" cy="10" rx="2" ry="2.5" fill="white"/><circle cx="15" cy="8" r="1" fill="white" opacity="0.9"/>
              <ellipse cx="42" cy="12" rx="5" ry="6" fill="${color}"/><ellipse cx="42" cy="10" rx="2" ry="2.5" fill="white"/><circle cx="39" cy="8" r="1" fill="white" opacity="0.9"/>
              ${blush}`
    }
  }

  // Mouths
  const expr = p.expression
  if (expr === 'happy') {
    mouth = p.mouthOpen
      ? `<path d="M26 26 Q30 31 34 26" stroke="${color}" stroke-width="2" fill="none"/><ellipse cx="30" cy="29" rx="3" ry="2" fill="${color}" opacity="0.3"/>`
      : `<path d="M26 26 Q30 29 34 26" stroke="${color}" stroke-width="2" fill="none"/>`
  } else if (expr === 'excited') {
    mouth = `<ellipse cx="30" cy="28" rx="4" ry="5" fill="none" stroke="${color}" stroke-width="2"/><path d="M27 29 Q30 31 33 29" stroke="${color}" stroke-width="1.5" fill="none"/>`
  } else if (expr === 'surprised') {
    mouth = `<circle cx="30" cy="28" r="3.5" fill="none" stroke="${color}" stroke-width="2"/>`
  } else if (expr === 'sad') {
    mouth = `<path d="M26 29 Q30 27 34 29" stroke="${color}" stroke-width="2" fill="none"/>`
  } else if (expr === 'angry') {
    mouth = `<path d="M25 28 Q30 26 35 28" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else if (expr === 'confused') {
    mouth = `<path d="M25 27 L30 28 L35 27" stroke="${color}" stroke-width="2" fill="none"/>`
  } else if (expr === 'embarrassed') {
    mouth = `<ellipse cx="30" cy="28" rx="2.5" ry="1.5" fill="${color}"/>`
  } else if (expr === 'smug') {
    mouth = `<path d="M24 27 Q30 29 36 27" stroke="${color}" stroke-width="2" fill="none"/>`
  } else {
    mouth = `<line x1="27" y1="27" x2="33" y2="27" stroke="${color}" stroke-width="2"/>`
  }

  return { eyes, mouth }
}

function renderSketchyFace(p: FaceRenderParams, color: string): FaceElements {
  const e = p.expression
  const eyes = p.isBlinking
    ? `<path d="M13 13 Q14 13.5 15 13 Q16 12.5 17 13 Q18 13.5 19 13 Q20 12.5 21 13 Q22 13.5 23 13" stroke="${color}" stroke-width="1.5" fill="none"/><path d="M37 13 Q38 13.5 39 13 Q40 12.5 41 13 Q42 13.5 43 13 Q44 12.5 45 13 Q46 13.5 47 13" stroke="${color}" stroke-width="1.5" fill="none"/>`
    : `<ellipse cx="18" cy="13" rx="4" ry="4.5" fill="none" stroke="${color}" stroke-width="2"/><ellipse cx="18" cy="13" rx="2" ry="2.5" fill="${color}"/><path d="M14 13 Q14.5 13.2 15 13" stroke="${color}" stroke-width="1" fill="none" opacity="0.5"/><ellipse cx="42" cy="13" rx="4" ry="4.5" fill="none" stroke="${color}" stroke-width="2"/><ellipse cx="42" cy="13" rx="2" ry="2.5" fill="${color}"/>`
  const mouth = `<path d="M22 26 Q23 26.5 24 26 Q25 25.5 26 26 Q27 26.5 28 26 Q29 25.5 30 26 Q31 26.5 32 26 Q33 25.5 34 26 Q35 26.5 36 26 Q37 25.5 38 26" stroke="${color}" stroke-width="2" fill="none"/>`
  return { eyes, mouth }
}

function renderGeometricFace(p: FaceRenderParams, color: string): FaceElements {
  const e = p.expression
  const eyes = p.isBlinking
    ? `<polygon points="14,13 22,13 18,14" fill="${color}"/><polygon points="38,13 46,13 42,14" fill="${color}"/>`
    : `<polygon points="13,9 23,9 21,16 15,16" fill="${color}"/><circle cx="18" cy="12" r="2" fill="white"/><polygon points="37,9 47,9 45,16 39,16" fill="${color}"/><circle cx="42" cy="12" r="2" fill="white"/>`
  const mouth = e === 'happy' ? `<polygon points="22,24 30,30 38,24 36,26 30,28 24,26" fill="${color}"/>` : `<rect x="24" y="26" width="12" height="3" fill="${color}"/>`
  return { eyes, mouth }
}

function renderVintageFace(p: FaceRenderParams, color: string): FaceElements {
  // Vintage 1920s rubber hose cartoon style - large circular eyes with pie-cut pupils
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  } else {
    const expr = p.expression
    if (expr === 'happy' || expr === 'excited') {
      // Large pie-eyes with thick outlines, squinted upward
      eyes = `<path d="M13 15 Q18 9 23 15" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
              <circle cx="18" cy="11" r="2" fill="${color}"/>
              <path d="M37 15 Q42 9 47 15" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
              <circle cx="42" cy="11" r="2" fill="${color}"/>`
    } else if (expr === 'angry') {
      // Angry pie-cut eyes with thick angry brows
      eyes = `<circle cx="18" cy="14" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <path d="M18 14 L18 8 L24 14 Z" fill="${color}"/>
              <path d="M11 7 L25 10" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
              <circle cx="42" cy="14" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <path d="M42 14 L42 8 L36 14 Z" fill="${color}"/>
              <path d="M35 10 L49 7" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`
    } else if (expr === 'surprised') {
      // Extra large round eyes
      eyes = `<circle cx="18" cy="13" r="7.5" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="18" cy="13" r="4" fill="${color}"/>
              <circle cx="16" cy="10" r="1.5" fill="white"/>
              <circle cx="42" cy="13" r="7.5" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="42" cy="13" r="4" fill="${color}"/>
              <circle cx="40" cy="10" r="1.5" fill="white"/>`
    } else if (expr === 'sad') {
      // Droopy eyes with downturned lids
      eyes = `<circle cx="18" cy="14" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="18" cy="15" r="3" fill="${color}"/>
              <circle cx="17" cy="13" r="1" fill="white"/>
              <path d="M12 9 Q18 11 24 9" stroke="${color}" stroke-width="2.5" fill="none"/>
              <circle cx="42" cy="14" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="42" cy="15" r="3" fill="${color}"/>
              <circle cx="41" cy="13" r="1" fill="white"/>
              <path d="M36 9 Q42 11 48 9" stroke="${color}" stroke-width="2.5" fill="none"/>
              <ellipse cx="15" cy="20" rx="1.5" ry="2.5" fill="#5ac8fa" opacity="0.7"/>`
    } else if (expr === 'confused') {
      // Asymmetric eyes with one brow raised
      eyes = `<circle cx="18" cy="12" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="18" cy="12" r="3" fill="${color}"/>
              <path d="M11 7 Q18 6 25 7" stroke="${color}" stroke-width="2.5" fill="none"/>
              <circle cx="42" cy="14" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="42" cy="14" r="3" fill="${color}"/>
              <path d="M35 11 Q42 13 49 11" stroke="${color}" stroke-width="2.5" fill="none"/>`
    } else if (expr === 'suspicious') {
      // Side-looking pie-cut eyes
      eyes = `<circle cx="18" cy="13" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <path d="M20 13 L20 7 L26 13 Z" fill="${color}"/>
              <circle cx="42" cy="13" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <path d="M44 13 L44 7 L50 13 Z" fill="${color}"/>`
    } else if (expr === 'embarrassed') {
      // Closed shy eyes with spiral blush marks
      eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M8 20 Q10 18 12 20 Q10 22 8 20" stroke="#ff9999" stroke-width="2" fill="none"/>
              <path d="M48 20 Q50 18 52 20 Q50 22 48 20" stroke="#ff9999" stroke-width="2" fill="none"/>`
    } else if (expr === 'smug') {
      // One eye winking, one half-lidded
      eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
              <circle cx="42" cy="13" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="42" cy="13" r="3" fill="${color}"/>
              <path d="M35 10 Q42 11 49 10" stroke="${color}" stroke-width="2.5" fill="none"/>`
    } else {
      // neutral - classic rubber hose style
      eyes = `<circle cx="18" cy="13" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="18" cy="13" r="3" fill="${color}"/>
              <circle cx="16" cy="11" r="1.2" fill="white"/>
              <circle cx="42" cy="13" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="42" cy="13" r="3" fill="${color}"/>
              <circle cx="40" cy="11" r="1.2" fill="white"/>`
    }
  }

  // Vintage rubber hose mouths
  const expr = p.expression
  if (expr === 'happy') {
    mouth = p.mouthOpen
      ? `<path d="M20 24 Q30 33 40 24 Q35 29 30 29 Q25 29 20 24 Z" fill="${color}"/>
         <path d="M22 26 Q30 31 38 26" stroke="white" stroke-width="2" fill="none"/>`
      : `<path d="M20 24 Q30 32 40 24 Q35 28 30 28 Q25 28 20 24 Z" fill="${color}"/>`
  } else if (expr === 'excited') {
    mouth = `<ellipse cx="30" cy="28" rx="7" ry="8" fill="${color}"/>
            <ellipse cx="30" cy="27" rx="5" ry="6" fill="white"/>
            <path d="M26 29 Q30 32 34 29" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else if (expr === 'surprised') {
    mouth = `<circle cx="30" cy="29" r="6" fill="${color}"/>
            <circle cx="30" cy="28" r="4" fill="white"/>`
  } else if (expr === 'sad') {
    mouth = `<path d="M20 30 Q30 26 40 30 Q35 28 30 28 Q25 28 20 30 Z" fill="${color}"/>`
  } else if (expr === 'angry') {
    mouth = `<rect x="22" y="27" width="16" height="4" rx="1" fill="${color}"/>`
  } else if (expr === 'confused') {
    mouth = `<path d="M22 27 L27 28 L32 26 L37 28" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'embarrassed') {
    mouth = `<ellipse cx="30" cy="28" rx="4" ry="3" fill="${color}"/>`
  } else if (expr === 'smug') {
    mouth = `<path d="M20 26 Q26 29 32 28 Q36 27 40 26" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'suspicious') {
    mouth = `<line x1="23" y1="27" x2="37" y2="28" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
  } else {
    mouth = `<ellipse cx="30" cy="27" rx="6" ry="2.5" fill="${color}"/>`
  }

  return { eyes, mouth }
}

function renderExpressiveFace(p: FaceRenderParams, color: string): FaceElements {
  // Expressive Disney-style - exaggerated features with dramatic squash and stretch
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<path d="M12 13 Q18 16 24 13" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <path d="M36 13 Q42 16 48 13" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  } else {
    const expr = p.expression
    if (expr === 'happy') {
      // Extremely squinted happy eyes
      eyes = `<path d="M12 16 Q18 8 24 16" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
              <circle cx="18" cy="11" r="2" fill="${color}"/>
              <path d="M36 16 Q42 8 48 16" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
              <circle cx="42" cy="11" r="2" fill="${color}"/>`
    } else if (expr === 'excited') {
      // Huge sparkling eyes with extreme highlights
      eyes = `<ellipse cx="18" cy="11" rx="7.5" ry="9" fill="${color}"/>
              <ellipse cx="18" cy="8" rx="3.5" ry="4.5" fill="white"/>
              <circle cx="15" cy="6" r="1.8" fill="white"/>
              <circle cx="20" cy="14" r="1.2" fill="white" opacity="0.8"/>
              <ellipse cx="42" cy="11" rx="7.5" ry="9" fill="${color}"/>
              <ellipse cx="42" cy="8" rx="3.5" ry="4.5" fill="white"/>
              <circle cx="39" cy="6" r="1.8" fill="white"/>
              <circle cx="44" cy="14" r="1.2" fill="white" opacity="0.8"/>`
    } else if (expr === 'angry') {
      // Intensely furrowed brows with sharp angry eyes
      eyes = `<path d="M10 7 L26 11" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>
              <ellipse cx="18" cy="15" rx="6" ry="5" fill="${color}"/>
              <ellipse cx="18" cy="14" rx="2.5" ry="2" fill="white"/>
              <circle cx="17" cy="13" r="0.8" fill="white"/>
              <path d="M34 11 L50 7" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>
              <ellipse cx="42" cy="15" rx="6" ry="5" fill="${color}"/>
              <ellipse cx="42" cy="14" rx="2.5" ry="2" fill="white"/>
              <circle cx="41" cy="13" r="0.8" fill="white"/>`
    } else if (expr === 'surprised') {
      // Extremely wide shocked eyes
      eyes = `<ellipse cx="18" cy="13" rx="8" ry="10" fill="${color}"/>
              <ellipse cx="18" cy="10" rx="4" ry="5" fill="white"/>
              <circle cx="15" cy="7" r="2" fill="white"/>
              <ellipse cx="42" cy="13" rx="8" ry="10" fill="${color}"/>
              <ellipse cx="42" cy="10" rx="4" ry="5" fill="white"/>
              <circle cx="39" cy="7" r="2" fill="white"/>`
    } else if (expr === 'sad') {
      // Droopy sad eyes with big tears
      eyes = `<ellipse cx="18" cy="14" rx="5.5" ry="7" fill="${color}"/>
              <ellipse cx="18" cy="12" rx="2.2" ry="2.8" fill="white"/>
              <circle cx="17" cy="10" r="0.9" fill="white"/>
              <path d="M12 9 Q18 12 24 9" stroke="${color}" stroke-width="3" fill="none"/>
              <path d="M18 19 Q19 24 18 27" stroke="#5ac8fa" stroke-width="2.5" fill="none" opacity="0.8"/>
              <ellipse cx="18" cy="28" rx="2" ry="2.5" fill="#5ac8fa" opacity="0.6"/>
              <ellipse cx="42" cy="14" rx="5.5" ry="7" fill="${color}"/>
              <ellipse cx="42" cy="12" rx="2.2" ry="2.8" fill="white"/>
              <circle cx="41" cy="10" r="0.9" fill="white"/>
              <path d="M36 9 Q42 12 48 9" stroke="${color}" stroke-width="3" fill="none"/>`
    } else if (expr === 'confused') {
      // Asymmetric eyes with swirly confusion marks
      eyes = `<ellipse cx="18" cy="12" rx="6.5" ry="7.5" fill="${color}"/>
              <ellipse cx="18" cy="10" rx="2.8" ry="3.2" fill="white"/>
              <circle cx="16" cy="8" r="1.1" fill="white"/>
              <path d="M10 7 Q12 5 14 7 Q16 9 18 7" stroke="${color}" stroke-width="2" fill="none"/>
              <ellipse cx="42" cy="14" rx="6" ry="7" fill="${color}"/>
              <ellipse cx="42" cy="12" rx="2.5" ry="3" fill="white"/>
              <circle cx="40" cy="10" r="1" fill="white"/>
              <path d="M36 11 Q42 13 48 11" stroke="${color}" stroke-width="2.5" fill="none"/>`
    } else if (expr === 'suspicious') {
      // Narrowed side-glancing eyes
      eyes = `<ellipse cx="18" cy="14" rx="6" ry="4.5" fill="${color}"/>
              <ellipse cx="20" cy="14" rx="2" ry="2.5" fill="white"/>
              <circle cx="19" cy="12" r="0.7" fill="white"/>
              <path d="M12 10 Q18 11 24 10" stroke="${color}" stroke-width="3" fill="none"/>
              <ellipse cx="42" cy="14" rx="6" ry="4.5" fill="${color}"/>
              <ellipse cx="44" cy="14" rx="2" ry="2.5" fill="white"/>
              <circle cx="43" cy="12" r="0.7" fill="white"/>
              <path d="M36 10 Q42 11 48 10" stroke="${color}" stroke-width="3" fill="none"/>`
    } else if (expr === 'embarrassed') {
      // Tightly closed eyes with big blush marks
      eyes = `<path d="M12 13 Q18 16 24 13" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
              <path d="M36 13 Q42 16 48 13" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
              <circle cx="7" cy="20" r="4.5" fill="#ffb3ba" opacity="0.7"/>
              <circle cx="8" cy="21" r="2.5" fill="#ff99aa" opacity="0.6"/>
              <circle cx="53" cy="20" r="4.5" fill="#ffb3ba" opacity="0.7"/>
              <circle cx="52" cy="21" r="2.5" fill="#ff99aa" opacity="0.6"/>`
    } else if (expr === 'smug') {
      // Half-lidded confident expression
      eyes = `<path d="M12 12 Q18 14 24 12" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
              <ellipse cx="18" cy="15" rx="5.5" ry="4.5" fill="${color}"/>
              <ellipse cx="19" cy="15" rx="2" ry="2.5" fill="white"/>
              <ellipse cx="42" cy="13" rx="6" ry="6.5" fill="${color}"/>
              <ellipse cx="42" cy="11" rx="2.5" ry="3" fill="white"/>
              <circle cx="40" cy="9" r="1" fill="white"/>
              <path d="M36 10 Q42 11 48 10" stroke="${color}" stroke-width="2.5" fill="none"/>`
    } else {
      // neutral - expressive but calm
      eyes = `<ellipse cx="18" cy="13" rx="6.5" ry="7.5" fill="${color}"/>
              <ellipse cx="18" cy="11" rx="2.8" ry="3.2" fill="white"/>
              <circle cx="16" cy="9" r="1.1" fill="white"/>
              <ellipse cx="42" cy="13" rx="6.5" ry="7.5" fill="${color}"/>
              <ellipse cx="42" cy="11" rx="2.8" ry="3.2" fill="white"/>
              <circle cx="40" cy="9" r="1.1" fill="white"/>`
    }
  }

  // Exaggerated expressive mouths
  const expr = p.expression
  if (expr === 'happy') {
    mouth = p.mouthOpen
      ? `<path d="M18 24 Q30 36 42 24" stroke="${color}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
         <path d="M20 26 Q30 34 40 26" fill="${color}" opacity="0.3"/>`
      : `<path d="M18 24 Q30 34 42 24" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'excited') {
    mouth = `<ellipse cx="30" cy="29" rx="7" ry="8.5" fill="${color}"/>
            <ellipse cx="30" cy="28" rx="5" ry="6" fill="white"/>
            <path d="M25 30 Q30 34 35 30" stroke="${color}" stroke-width="3" fill="none"/>`
  } else if (expr === 'surprised') {
    mouth = `<ellipse cx="30" cy="29" rx="6" ry="7.5" fill="${color}"/>
            <ellipse cx="30" cy="28" rx="4" ry="5.5" fill="white" opacity="0.8"/>`
  } else if (expr === 'sad') {
    mouth = `<path d="M18 31 Q30 27 42 31" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'angry') {
    mouth = `<path d="M20 29 Q30 26 40 29" stroke="${color}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'confused') {
    mouth = `<path d="M20 27 L26 28 L30 26 L34 28 L40 27" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'embarrassed') {
    mouth = `<ellipse cx="30" cy="28" rx="4" ry="3" fill="${color}"/>`
  } else if (expr === 'smug') {
    mouth = `<path d="M20 26 Q28 30 36 28 Q38 27 40 26" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'suspicious') {
    mouth = `<line x1="22" y1="28" x2="38" y2="29" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`
  } else {
    mouth = `<line x1="22" y1="28" x2="38" y2="28" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
  }

  return { eyes, mouth }
}

function renderDoodleFace(p: FaceRenderParams, color: string): FaceElements {
  // Doodle style - playful irregular hand-drawn squiggly lines
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<path d="M13 13 C15 12 16 14 17 13 C18 12 19 14 21 13 C22 12 23 13 23 13" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M37 13 C39 12 40 14 41 13 C42 12 43 14 45 13 C46 12 47 13 47 13" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
  } else {
    const expr = p.expression
    if (expr === 'happy' || expr === 'excited') {
      // Squiggly happy arcs with wobbly pupils
      eyes = `<path d="M13 15 C15 13 16 10 17 12 C18 9 19 11 20 13 C21 10 22 12 23 15" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <circle cx="18" cy="11" r="2" fill="${color}"/>
              <path d="M37 15 C39 13 40 10 41 12 C42 9 43 11 44 13 C45 10 46 12 47 15" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <circle cx="42" cy="11" r="2" fill="${color}"/>`
    } else if (expr === 'angry') {
      // Jagged angry eyes with squiggly brows
      eyes = `<path d="M11 8 C13 7 15 9 17 8 C19 7 21 9 24 10" stroke="${color}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
              <ellipse cx="18" cy="14" rx="4.5" ry="5" fill="${color}" transform="rotate(-8 18 14)"/>
              <circle cx="18" cy="13" r="2" fill="white"/>
              <path d="M35 10 C37 9 39 7 41 8 C43 7 45 9 49 8" stroke="${color}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
              <ellipse cx="42" cy="14" rx="4.5" ry="5" fill="${color}" transform="rotate(8 42 14)"/>
              <circle cx="42" cy="13" r="2" fill="white"/>`
    } else if (expr === 'surprised') {
      // Large wobbly circles
      eyes = `<path d="M12 13 C12 9 13 8 15 7 C17 6 19 6 21 7 C23 8 24 9 24 13 C24 17 23 18 21 19 C19 20 17 20 15 19 C13 18 12 17 12 13" stroke="${color}" stroke-width="2.5" fill="none"/>
              <ellipse cx="18" cy="13" rx="3.5" ry="4" fill="${color}"/>
              <circle cx="17" cy="11" r="1.3" fill="white"/>
              <path d="M36 13 C36 9 37 8 39 7 C41 6 43 6 45 7 C47 8 48 9 48 13 C48 17 47 18 45 19 C43 20 41 20 39 19 C37 18 36 17 36 13" stroke="${color}" stroke-width="2.5" fill="none"/>
              <ellipse cx="42" cy="13" rx="3.5" ry="4" fill="${color}"/>
              <circle cx="41" cy="11" r="1.3" fill="white"/>`
    } else if (expr === 'sad') {
      // Droopy squiggly eyes with tear
      eyes = `<ellipse cx="18" cy="14" rx="4.5" ry="5.5" fill="${color}" transform="rotate(-3 18 14)"/>
              <circle cx="18" cy="13" r="2" fill="white"/>
              <path d="M12 9 C14 10 16 11 18 10 C20 11 22 10 24 9" stroke="${color}" stroke-width="2.2" fill="none"/>
              <path d="M17 18 C17 19 16 21 16 23 C16 24 17 24 17 23" stroke="#5ac8fa" stroke-width="2" fill="none" opacity="0.7"/>
              <ellipse cx="42" cy="14" rx="4.5" ry="5.5" fill="${color}" transform="rotate(3 42 14)"/>
              <circle cx="42" cy="13" r="2" fill="white"/>
              <path d="M36 9 C38 10 40 11 42 10 C44 11 46 10 48 9" stroke="${color}" stroke-width="2.2" fill="none"/>`
    } else if (expr === 'confused') {
      // Asymmetric wobbly eyes with question mark vibe
      eyes = `<ellipse cx="17" cy="12" rx="5" ry="6" fill="${color}" transform="rotate(-10 17 12)"/>
              <circle cx="17" cy="11" r="2.2" fill="white"/>
              <path d="M11 7 C13 6 15 7 16 9" stroke="${color}" stroke-width="2.2" fill="none"/>
              <ellipse cx="43" cy="14" rx="4.5" ry="5.5" fill="${color}" transform="rotate(12 43 14)"/>
              <circle cx="43" cy="13" r="2" fill="white"/>
              <path d="M36 11 C38 12 40 13 42 12 C44 13 46 12 48 11" stroke="${color}" stroke-width="2.2" fill="none"/>`
    } else if (expr === 'suspicious') {
      // Narrow squinted side-looking eyes
      eyes = `<ellipse cx="18" cy="14" rx="5" ry="4" fill="${color}" transform="rotate(-5 18 14)"/>
              <ellipse cx="20" cy="14" rx="1.8" ry="2.5" fill="white"/>
              <ellipse cx="42" cy="14" rx="5" ry="4" fill="${color}" transform="rotate(5 42 14)"/>
              <ellipse cx="44" cy="14" rx="1.8" ry="2.5" fill="white"/>`
    } else if (expr === 'embarrassed') {
      // Squiggly closed eyes with blush spirals
      eyes = `<path d="M13 13 C15 12 16 14 17 13 C18 12 19 14 21 13 C22 12 23 13 23 13" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M37 13 C39 12 40 14 41 13 C42 12 43 14 45 13 C46 12 47 13 47 13" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M7 20 C8 19 9 20 9 21 C9 22 8 23 7 22 C6 21 6 20 7 20" stroke="#ff9999" stroke-width="2" fill="none" opacity="0.7"/>
              <path d="M53 20 C52 19 51 20 51 21 C51 22 52 23 53 22 C54 21 54 20 53 20" stroke="#ff9999" stroke-width="2" fill="none" opacity="0.7"/>`
    } else if (expr === 'smug') {
      // One eye squiggly winking, one confident
      eyes = `<path d="M13 13 C15 12 16 14 17 13 C18 12 19 14 21 13 C22 12 23 13 23 13" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <ellipse cx="42" cy="13" rx="4.8" ry="5.5" fill="${color}" transform="rotate(5 42 13)"/>
              <circle cx="42" cy="12" r="2.1" fill="white"/>
              <path d="M36 10 C38 11 40 12 42 11 C44 12 46 11 48 10" stroke="${color}" stroke-width="2" fill="none"/>`
    } else {
      // neutral - playful doodle eyes
      eyes = `<ellipse cx="18" cy="13" rx="4.5" ry="5.2" fill="${color}" transform="rotate(-5 18 13)"/>
              <circle cx="18" cy="12" r="2" fill="white"/>
              <circle cx="16" cy="10" r="0.8" fill="white"/>
              <ellipse cx="42" cy="13" rx="4.5" ry="5.2" fill="${color}" transform="rotate(5 42 13)"/>
              <circle cx="42" cy="12" r="2" fill="white"/>
              <circle cx="40" cy="10" r="0.8" fill="white"/>`
    }
  }

  // Squiggly doodle mouths
  const expr = p.expression
  if (expr === 'happy') {
    mouth = p.mouthOpen
      ? `<path d="M22 26 C24 25 26 28 28 27 C30 26 31 29 32 27 C34 28 36 25 38 26" stroke="${color}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
         <path d="M24 28 C26 27 28 30 30 29 C32 28 34 30 36 28" stroke="${color}" stroke-width="2" fill="none" opacity="0.4"/>`
      : `<path d="M22 26 C24 25 26 27 28 26 C30 25 32 27 34 26 C36 25 38 26 38 26" stroke="${color}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'excited') {
    mouth = `<path d="M26 26 C27 25 28 27 29 26 C30 25 31 27 32 26 C33 25 34 26 34 26 C34 28 33 29 32 30 C31 31 29 31 28 30 C27 29 26 28 26 26" stroke="${color}" stroke-width="2.8" fill="none"/>
            <path d="M27 28 C28 27 29 29 30 28 C31 29 32 28 33 28" stroke="${color}" stroke-width="2" fill="none"/>`
  } else if (expr === 'surprised') {
    mouth = `<path d="M27 26 C27 25 28 24 29 24 C30 24 31 25 31 26 C31 28 31 29 30 30 C29 31 28 31 27 30 C27 29 27 28 27 26" stroke="${color}" stroke-width="2.8" fill="none"/>`
  } else if (expr === 'sad') {
    mouth = `<path d="M22 29 C24 28 26 27 28 27 C30 27 32 28 34 27 C36 28 38 29 38 29" stroke="${color}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'angry') {
    mouth = `<path d="M22 28 C25 27 27 27 30 27 C33 27 35 27 38 28" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'confused') {
    mouth = `<path d="M22 27 C24 28 26 27 28 28 C30 26 32 28 34 27 C36 27 37 28 38 27" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'embarrassed') {
    mouth = `<path d="M28 27 C28 28 29 28 30 28 C31 28 32 28 32 27" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else if (expr === 'smug') {
    mouth = `<path d="M22 27 C25 26 27 29 30 28 C33 28 35 27 38 27" stroke="${color}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'suspicious') {
    mouth = `<path d="M23 27 C26 28 28 27 30 28 C32 27 34 28 37 28" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
  } else {
    mouth = `<path d="M22 26 C24 25 26 27 28 26 C30 25 32 27 34 26 C36 25 38 26 38 26" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
  }

  return { eyes, mouth }
}

function renderSoftFace(p: FaceRenderParams, color: string): FaceElements {
  // Soft style - gentle gradients, pastel feel, rounded edges
  let eyes = ''
  let mouth = ''

  // Soft gradient helper (using opacity layers to simulate gradients)
  const softShine = (cx: number) => `<ellipse cx="${cx}" cy="10" rx="1.8" ry="2.5" fill="white" opacity="0.85"/>`
  const blush = `<ellipse cx="9" cy="20" rx="3.5" ry="3" fill="#ffccdd" opacity="0.5"/>
                 <ellipse cx="51" cy="20" rx="3.5" ry="3" fill="#ffccdd" opacity="0.5"/>`

  if (p.isBlinking) {
    eyes = `<ellipse cx="18" cy="13" rx="5" ry="2" fill="${color}" opacity="0.8"/>
            <ellipse cx="42" cy="13" rx="5" ry="2" fill="${color}" opacity="0.8"/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<path d="M13 14 Q18 9 23 14" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.8" stroke-linecap="round"/>
                <path d="M37 14 Q42 9 47 14" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.8" stroke-linecap="round"/>
                <circle cx="18" cy="11" r="1.5" fill="${color}" opacity="0.4"/>
                <circle cx="42" cy="11" r="1.5" fill="${color}" opacity="0.4"/>
                ${blush}`
        break
      case 'angry':
        eyes = `<ellipse cx="18" cy="13" rx="4.5" ry="5" fill="${color}" opacity="0.9"/>
                ${softShine(17.5)}
                <path d="M12 9 Q18 11 24 9" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.7" stroke-linecap="round"/>
                <ellipse cx="42" cy="13" rx="4.5" ry="5" fill="${color}" opacity="0.9"/>
                ${softShine(41.5)}
                <path d="M36 9 Q42 11 48 9" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.7" stroke-linecap="round"/>`
        break
      case 'surprised':
        eyes = `<ellipse cx="18" cy="13" rx="6" ry="7" fill="${color}" opacity="0.9"/>
                <ellipse cx="18" cy="11" rx="2.8" ry="3.5" fill="white" opacity="0.95"/>
                <circle cx="16" cy="9" r="1.2" fill="white" opacity="0.8"/>
                <ellipse cx="42" cy="13" rx="6" ry="7" fill="${color}" opacity="0.9"/>
                <ellipse cx="42" cy="11" rx="2.8" ry="3.5" fill="white" opacity="0.95"/>
                <circle cx="40" cy="9" r="1.2" fill="white" opacity="0.8"/>
                ${blush}`
        break
      case 'sad':
        eyes = `<ellipse cx="18" cy="13" rx="4" ry="5" fill="${color}" opacity="0.85"/>
                ${softShine(17.5)}
                <path d="M13 9 Q18 10 23 9" stroke="${color}" stroke-width="2" fill="none" opacity="0.6" stroke-linecap="round"/>
                <ellipse cx="16" cy="18" rx="1.8" ry="2.5" fill="#88ccff" opacity="0.6"/>
                <ellipse cx="42" cy="13" rx="4" ry="5" fill="${color}" opacity="0.85"/>
                ${softShine(41.5)}
                <path d="M37 9 Q42 10 47 9" stroke="${color}" stroke-width="2" fill="none" opacity="0.6" stroke-linecap="round"/>
                ${blush}`
        break
      case 'confused':
        eyes = `<ellipse cx="18" cy="12" rx="4.5" ry="5" fill="${color}" opacity="0.9"/>
                ${softShine(17.5)}
                <ellipse cx="42" cy="14" rx="4.5" ry="5" fill="${color}" opacity="0.9"/>
                ${softShine(41.5)}
                <path d="M12 9 Q15 8 18 9" stroke="${color}" stroke-width="1.8" fill="none" opacity="0.6"/>
                ${blush}`
        break
      case 'suspicious':
        eyes = `<ellipse cx="18" cy="14" rx="5" ry="3.5" fill="${color}" opacity="0.85"/>
                <ellipse cx="19" cy="14" rx="1.5" ry="2" fill="white" opacity="0.9"/>
                <ellipse cx="42" cy="14" rx="5" ry="3.5" fill="${color}" opacity="0.85"/>
                <ellipse cx="43" cy="14" rx="1.5" ry="2" fill="white" opacity="0.9"/>`
        break
      case 'embarrassed':
        eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.7" stroke-linecap="round"/>
                <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.7" stroke-linecap="round"/>
                <ellipse cx="9" cy="20" rx="4.5" ry="4" fill="#ffb3d9" opacity="0.7"/>
                <ellipse cx="51" cy="20" rx="4.5" ry="4" fill="#ffb3d9" opacity="0.7"/>`
        break
      case 'smug':
        eyes = `<path d="M13 13 Q18 10 23 13" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.8" stroke-linecap="round"/>
                <ellipse cx="42" cy="13" rx="4.5" ry="5" fill="${color}" opacity="0.9"/>
                ${softShine(41.5)}
                <path d="M38 13 L46 13" stroke="white" stroke-width="2" opacity="0.8" stroke-linecap="round"/>
                ${blush}`
        break
      default: // neutral
        eyes = `<ellipse cx="18" cy="13" rx="4.5" ry="5" fill="${color}" opacity="0.9"/>
                ${softShine(17.5)}
                <ellipse cx="42" cy="13" rx="4.5" ry="5" fill="${color}" opacity="0.9"/>
                ${softShine(41.5)}
                ${blush}`
    }
  }

  // Soft gentle mouths
  switch (p.expression) {
    case 'happy':
    case 'excited':
      mouth = p.mouthOpen
        ? `<path d="M23 25 Q30 31 37 25" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.8" stroke-linecap="round"/>
           <ellipse cx="30" cy="28" rx="4" ry="3" fill="${color}" opacity="0.3"/>`
        : `<path d="M23 25 Q30 30 37 25" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.8" stroke-linecap="round"/>`
      break
    case 'angry':
      mouth = `<path d="M23 29 Q30 27 37 29" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.7" stroke-linecap="round"/>`
      break
    case 'surprised':
      mouth = `<ellipse cx="30" cy="27" rx="4.5" ry="5.5" fill="${color}" opacity="0.8"/>
               <ellipse cx="30" cy="26" rx="3" ry="4" fill="white" opacity="0.3"/>`
      break
    case 'sad':
      mouth = `<path d="M23 29 Q30 27 37 29" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.7" stroke-linecap="round"/>`
      break
    case 'confused':
      mouth = `<path d="M23 27 Q27 28 30 27 Q33 26 37 27" stroke="${color}" stroke-width="2" fill="none" opacity="0.7" stroke-linecap="round"/>`
      break
    case 'embarrassed':
      mouth = `<ellipse cx="30" cy="27" rx="3.5" ry="2.5" fill="${color}" opacity="0.7"/>`
      break
    case 'smug':
      mouth = `<path d="M23 26 Q30 28 37 26" stroke="${color}" stroke-width="2.5" fill="none" opacity="0.8" stroke-linecap="round"/>`
      break
    case 'suspicious':
      mouth = `<line x1="24" y1="27" x2="36" y2="27" stroke="${color}" stroke-width="2.5" opacity="0.7" stroke-linecap="round"/>`
      break
    default:
      mouth = p.mouthOpen
        ? `<ellipse cx="30" cy="27" rx="4" ry="3" fill="${color}" opacity="0.7"/>`
        : `<line x1="24" y1="27" x2="36" y2="27" stroke="${color}" stroke-width="2.5" opacity="0.7" stroke-linecap="round"/>`
  }

  return { eyes, mouth }
}

function renderIntenseFace(p: FaceRenderParams, color: string): FaceElements {
  // Intense style - high contrast, dramatic, bold features
  let eyes = ''
  let mouth = ''

  // Dramatic highlights
  const intensiveShine = (cx: number) => `<ellipse cx="${cx}" cy="10" rx="1.5" ry="2" fill="white"/>
                                           <circle cx="${cx-1}" cy="8" r="0.8" fill="white" opacity="0.7"/>`
  const shadowLine = (x1: number, x2: number, y: number) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="1.5" opacity="0.3"/>`

  if (p.isBlinking) {
    eyes = `<rect x="13" y="12" width="10" height="3" fill="${color}" rx="1"/>
            <rect x="37" y="12" width="10" height="3" fill="${color}" rx="1"/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<path d="M12 15 Q18 8 24 15" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
                <circle cx="18" cy="10" r="2.5" fill="${color}"/>
                <circle cx="17" cy="9" r="1" fill="white"/>
                <path d="M36 15 Q42 8 48 15" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
                <circle cx="42" cy="10" r="2.5" fill="${color}"/>
                <circle cx="41" cy="9" r="1" fill="white"/>`
        break
      case 'angry':
        eyes = `<ellipse cx="18" cy="14" rx="5.5" ry="6" fill="${color}"/>
                ${intensiveShine(17.5)}
                <path d="M10 7 L26 10" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
                ${shadowLine(12, 24, 9)}
                <ellipse cx="42" cy="14" rx="5.5" ry="6" fill="${color}"/>
                ${intensiveShine(41.5)}
                <path d="M34 10 L50 7" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
                ${shadowLine(36, 48, 9)}`
        break
      case 'surprised':
        eyes = `<circle cx="18" cy="13" r="7" fill="white" stroke="${color}" stroke-width="3.5"/>
                <circle cx="18" cy="13" r="4.5" fill="${color}"/>
                ${intensiveShine(17.5)}
                <circle cx="42" cy="13" r="7" fill="white" stroke="${color}" stroke-width="3.5"/>
                <circle cx="42" cy="13" r="4.5" fill="${color}"/>
                ${intensiveShine(41.5)}`
        break
      case 'sad':
        eyes = `<ellipse cx="18" cy="14" rx="4.5" ry="5.5" fill="${color}"/>
                ${intensiveShine(17.5)}
                <path d="M12 9 Q18 11 24 9" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
                <ellipse cx="16" cy="19" rx="2" ry="3" fill="#4db8ff" opacity="0.8"/>
                <ellipse cx="42" cy="14" rx="4.5" ry="5.5" fill="${color}"/>
                ${intensiveShine(41.5)}
                <path d="M36 9 Q42 11 48 9" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`
        break
      case 'confused':
        eyes = `<ellipse cx="18" cy="12" rx="5" ry="6" fill="${color}"/>
                ${intensiveShine(17.5)}
                <path d="M12 8 L24 8" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
                <ellipse cx="42" cy="14" rx="5" ry="6" fill="${color}"/>
                ${intensiveShine(41.5)}
                <path d="M36 12 Q42 13 48 12" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
        break
      case 'suspicious':
        eyes = `<ellipse cx="18" cy="15" rx="5.5" ry="3.5" fill="${color}"/>
                <ellipse cx="19" cy="15" rx="2" ry="2.5" fill="white"/>
                <path d="M13 12 L23 13" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
                <ellipse cx="42" cy="15" rx="5.5" ry="3.5" fill="${color}"/>
                <ellipse cx="43" cy="15" rx="2" ry="2.5" fill="white"/>
                <path d="M37 13 L47 12" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
        break
      case 'embarrassed':
        eyes = `<path d="M12 13 L15 15 L18 13 L21 15 L24 13" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M36 13 L39 15 L42 13 L45 15 L48 13" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
                <circle cx="9" cy="20" r="3" fill="#ff4444" opacity="0.6"/>
                <circle cx="51" cy="20" r="3" fill="#ff4444" opacity="0.6"/>`
        break
      case 'smug':
        eyes = `<path d="M12 14 Q18 10 24 14" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                <ellipse cx="42" cy="13" rx="5" ry="6" fill="${color}"/>
                ${intensiveShine(41.5)}
                <path d="M37 13 L47 13" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`
        break
      default: // neutral
        eyes = `<ellipse cx="18" cy="13" rx="5" ry="6" fill="${color}"/>
                ${intensiveShine(17.5)}
                <ellipse cx="42" cy="13" rx="5" ry="6" fill="${color}"/>
                ${intensiveShine(41.5)}`
    }
  }

  // Dramatic intense mouths
  switch (p.expression) {
    case 'happy':
    case 'excited':
      mouth = p.mouthOpen
        ? `<path d="M20 24 Q30 33 40 24" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
           <path d="M22 26 Q30 31 38 26" fill="${color}" opacity="0.4"/>`
        : `<path d="M22 25 Q30 31 38 25" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      break
    case 'angry':
      mouth = `<path d="M20 30 L40 30" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>
               ${shadowLine(22, 38, 32)}`
      break
    case 'surprised':
      mouth = `<ellipse cx="30" cy="28" rx="6" ry="7" fill="${color}" stroke="${color}" stroke-width="3"/>
               <ellipse cx="30" cy="27" rx="4" ry="5" fill="white" opacity="0.4"/>`
      break
    case 'sad':
      mouth = `<path d="M20 31 Q30 28 40 31" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      break
    case 'confused':
      mouth = `<path d="M22 26 L28 28 L34 26 L38 28" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      break
    case 'embarrassed':
      mouth = `<ellipse cx="30" cy="28" rx="4" ry="3" fill="${color}"/>`
      break
    case 'smug':
      mouth = `<path d="M22 26 Q30 29 38 26" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      break
    case 'suspicious':
      mouth = `<line x1="23" y1="27" x2="37" y2="28" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`
      break
    default:
      mouth = p.mouthOpen
        ? `<ellipse cx="30" cy="28" rx="5" ry="4" fill="${color}"/>`
        : `<line x1="23" y1="28" x2="37" y2="28" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`
  }

  return { eyes, mouth }
}

function renderDreamyFace(p: FaceRenderParams, color: string): FaceElements {
  // Dreamy style - ethereal, soft glow, magical sparkles
  let eyes = ''
  let mouth = ''

  const glow = `filter="blur(1px)" opacity="0.8"`
  const softGlow = `filter="blur(0.8px)" opacity="0.7"`
  const dreamySparkle = (x: number, y: number) => `
    <circle cx="${x}" cy="${y}" r="1.2" fill="white" opacity="0.8" filter="blur(0.5px)"/>
    <circle cx="${x-3}" cy="${y-2}" r="0.8" fill="white" opacity="0.6" filter="blur(0.4px)"/>
    <circle cx="${x+3}" cy="${y+1}" r="0.7" fill="white" opacity="0.5" filter="blur(0.4px)"/>`

  if (p.isBlinking) {
    eyes = `<line x1="14" y1="13" x2="22" y2="13" stroke="${color}" stroke-width="2" ${glow}/>
            <line x1="38" y1="13" x2="46" y2="13" stroke="${color}" stroke-width="2" ${glow}/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<path d="M13 14 Q18 9 23 14" stroke="${color}" stroke-width="2.5" fill="none" ${glow} stroke-linecap="round"/>
                <ellipse cx="18" cy="11" rx="2.5" ry="3" fill="white" opacity="0.85" filter="blur(0.5px)"/>
                ${dreamySparkle(18, 8)}
                <path d="M37 14 Q42 9 47 14" stroke="${color}" stroke-width="2.5" fill="none" ${glow} stroke-linecap="round"/>
                <ellipse cx="42" cy="11" rx="2.5" ry="3" fill="white" opacity="0.85" filter="blur(0.5px)"/>
                ${dreamySparkle(42, 8)}`
        break
      case 'angry':
        eyes = `<ellipse cx="18" cy="13" rx="5" ry="6" fill="${color}" ${glow}/>
                <circle cx="18" cy="11" r="2" fill="white" opacity="0.9"/>
                <circle cx="16" cy="9" r="1" fill="white" opacity="0.7"/>
                <path d="M12 8 Q18 10 24 8" stroke="${color}" stroke-width="2.5" fill="none" ${softGlow}/>
                <ellipse cx="42" cy="13" rx="5" ry="6" fill="${color}" ${glow}/>
                <circle cx="42" cy="11" r="2" fill="white" opacity="0.9"/>
                <circle cx="40" cy="9" r="1" fill="white" opacity="0.7"/>
                <path d="M36 8 Q42 10 48 8" stroke="${color}" stroke-width="2.5" fill="none" ${softGlow}/>`
        break
      case 'surprised':
        eyes = `<ellipse cx="18" cy="13" rx="6.5" ry="7.5" fill="${color}" ${glow}/>
                <ellipse cx="18" cy="10" rx="3" ry="4" fill="white" opacity="0.95" filter="blur(0.5px)"/>
                <circle cx="16" cy="8" r="1.5" fill="white" opacity="0.8"/>
                ${dreamySparkle(18, 6)}
                <ellipse cx="42" cy="13" rx="6.5" ry="7.5" fill="${color}" ${glow}/>
                <ellipse cx="42" cy="10" rx="3" ry="4" fill="white" opacity="0.95" filter="blur(0.5px)"/>
                <circle cx="40" cy="8" r="1.5" fill="white" opacity="0.8"/>
                ${dreamySparkle(42, 6)}`
        break
      case 'sad':
        eyes = `<ellipse cx="18" cy="14" rx="4.5" ry="5.5" fill="${color}" ${glow}/>
                <circle cx="18" cy="12" r="2" fill="white" opacity="0.9"/>
                <circle cx="16" cy="10" r="0.9" fill="white" opacity="0.7"/>
                <path d="M13 9 Q18 11 23 9" stroke="${color}" stroke-width="2" fill="none" ${softGlow}/>
                <ellipse cx="16" cy="19" rx="1.5" ry="2.5" fill="#b3e5ff" opacity="0.7" filter="blur(0.6px)"/>
                <ellipse cx="42" cy="14" rx="4.5" ry="5.5" fill="${color}" ${glow}/>
                <circle cx="42" cy="12" r="2" fill="white" opacity="0.9"/>
                <circle cx="40" cy="10" r="0.9" fill="white" opacity="0.7"/>
                <path d="M37 9 Q42 11 47 9" stroke="${color}" stroke-width="2" fill="none" ${softGlow}/>`
        break
      case 'confused':
        eyes = `<ellipse cx="18" cy="12" rx="5" ry="6" fill="${color}" ${glow}/>
                <circle cx="18" cy="10" r="2" fill="white" opacity="0.9"/>
                <circle cx="16" cy="8" r="1" fill="white" opacity="0.7"/>
                <ellipse cx="42" cy="14" rx="5" ry="6" fill="${color}" ${glow}/>
                <circle cx="42" cy="12" r="2" fill="white" opacity="0.9"/>
                <circle cx="40" cy="10" r="1" fill="white" opacity="0.7"/>
                <path d="M12 8 Q15 7 18 8" stroke="${color}" stroke-width="1.8" fill="none" ${softGlow}/>`
        break
      case 'suspicious':
        eyes = `<ellipse cx="18" cy="14" rx="5.5" ry="4" fill="${color}" ${glow}/>
                <ellipse cx="19" cy="14" rx="2" ry="2.5" fill="white" opacity="0.9"/>
                <circle cx="17" cy="12" r="0.8" fill="white" opacity="0.7"/>
                <ellipse cx="42" cy="14" rx="5.5" ry="4" fill="${color}" ${glow}/>
                <ellipse cx="43" cy="14" rx="2" ry="2.5" fill="white" opacity="0.9"/>
                <circle cx="41" cy="12" r="0.8" fill="white" opacity="0.7"/>`
        break
      case 'embarrassed':
        eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="2.5" fill="none" ${glow} stroke-linecap="round"/>
                <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="2.5" fill="none" ${glow} stroke-linecap="round"/>
                <circle cx="9" cy="20" r="3.5" fill="#ffccee" opacity="0.6" filter="blur(1px)"/>
                <circle cx="51" cy="20" r="3.5" fill="#ffccee" opacity="0.6" filter="blur(1px)"/>
                ${dreamySparkle(9, 19)}
                ${dreamySparkle(51, 19)}`
        break
      case 'smug':
        eyes = `<path d="M13 13 Q18 10 23 13" stroke="${color}" stroke-width="2.5" fill="none" ${glow} stroke-linecap="round"/>
                <ellipse cx="42" cy="13" rx="5" ry="6" fill="${color}" ${glow}/>
                <circle cx="42" cy="11" r="2" fill="white" opacity="0.9"/>
                <circle cx="40" cy="9" r="1" fill="white" opacity="0.7"/>
                <path d="M38 13 L46 13" stroke="white" stroke-width="2" opacity="0.8" stroke-linecap="round" filter="blur(0.5px)"/>
                ${dreamySparkle(42, 8)}`
        break
      default: // neutral
        eyes = `<ellipse cx="18" cy="13" rx="5" ry="6" fill="${color}" ${glow}/>
                <circle cx="18" cy="11" r="2" fill="white" opacity="0.9"/>
                <circle cx="16" cy="9" r="1" fill="white" opacity="0.7"/>
                ${dreamySparkle(18, 8)}
                <ellipse cx="42" cy="13" rx="5" ry="6" fill="${color}" ${glow}/>
                <circle cx="42" cy="11" r="2" fill="white" opacity="0.9"/>
                <circle cx="40" cy="9" r="1" fill="white" opacity="0.7"/>
                ${dreamySparkle(42, 8)}`
    }
  }

  // Ethereal dreamy mouths
  switch (p.expression) {
    case 'happy':
    case 'excited':
      mouth = p.mouthOpen
        ? `<path d="M24 25 Q30 31 36 25" stroke="${color}" stroke-width="2.5" fill="none" ${glow} stroke-linecap="round"/>
           <ellipse cx="30" cy="28" rx="3.5" ry="3" fill="${color}" opacity="0.4" filter="blur(0.8px)"/>`
        : `<path d="M24 26 Q30 30 36 26" stroke="${color}" stroke-width="2.5" fill="none" ${glow} stroke-linecap="round"/>`
      break
    case 'angry':
      mouth = `<path d="M23 29 Q30 27 37 29" stroke="${color}" stroke-width="2.5" fill="none" ${glow} stroke-linecap="round"/>`
      break
    case 'surprised':
      mouth = `<ellipse cx="30" cy="28" rx="4.5" ry="5" fill="${color}" ${softGlow}/>
               <ellipse cx="30" cy="27" rx="3" ry="3.5" fill="white" opacity="0.4" filter="blur(0.6px)"/>`
      break
    case 'sad':
      mouth = `<path d="M24 29 Q30 27 36 29" stroke="${color}" stroke-width="2.5" fill="none" ${glow} stroke-linecap="round"/>`
      break
    case 'confused':
      mouth = `<path d="M24 27 Q28 28 30 27 Q32 26 36 27" stroke="${color}" stroke-width="2" fill="none" ${softGlow} stroke-linecap="round"/>`
      break
    case 'embarrassed':
      mouth = `<ellipse cx="30" cy="27" rx="3" ry="2" fill="${color}" ${softGlow}/>`
      break
    case 'smug':
      mouth = `<path d="M24 26 Q30 28 36 26" stroke="${color}" stroke-width="2.5" fill="none" ${glow} stroke-linecap="round"/>`
      break
    case 'suspicious':
      mouth = `<line x1="24" y1="27" x2="36" y2="27" stroke="${color}" stroke-width="2.5" ${softGlow} stroke-linecap="round"/>`
      break
    default:
      mouth = p.mouthOpen
        ? `<ellipse cx="30" cy="27" rx="3.5" ry="3" fill="${color}" ${softGlow}/>`
        : `<path d="M24 26 Q30 29 36 26" stroke="${color}" stroke-width="2" fill="none" ${glow} stroke-linecap="round"/>`
  }

  return { eyes, mouth }
}

// ══════════════════════════════════════════════════════════════
// NEW STYLES: 10 Additional High-Quality Cartoon Face Styles
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// STYLE 21: RUBBER HOSE (1930s animation - bendy limbs/features)
// ══════════════════════════════════════════════════════════════

function renderRubberHoseFace(p: FaceRenderParams, color: string): FaceElements {
  // 1930s rubber hose animation style - circular eyes, flowing curves, bendy features
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  } else {
    const expr = p.expression
    if (expr === 'happy' || expr === 'excited') {
      // Big pie-cut eyes
      eyes = `<circle cx="18" cy="13" r="7" fill="white" stroke="${color}" stroke-width="3"/>
              <path d="M18 13 L25 9 A7 7 0 0 1 25 17 Z" fill="${color}"/>
              <circle cx="42" cy="13" r="7" fill="white" stroke="${color}" stroke-width="3"/>
              <path d="M42 13 L49 9 A7 7 0 0 1 49 17 Z" fill="${color}"/>`
    } else if (expr === 'angry') {
      // Angled angry eyes with thick brows
      eyes = `<circle cx="18" cy="14" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="18" cy="14" r="3.5" fill="${color}"/>
              <path d="M11 7 Q18 10 25 7" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
              <circle cx="42" cy="14" r="6" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="42" cy="14" r="3.5" fill="${color}"/>
              <path d="M35 7 Q42 10 49 7" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    } else if (expr === 'surprised') {
      // Wide open circular eyes
      eyes = `<circle cx="18" cy="13" r="8" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="18" cy="13" r="4.5" fill="${color}"/>
              <circle cx="16" cy="10" r="1.8" fill="white"/>
              <circle cx="42" cy="13" r="8" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="42" cy="13" r="4.5" fill="${color}"/>
              <circle cx="40" cy="10" r="1.8" fill="white"/>`
    } else if (expr === 'sad') {
      // Droopy eyes with tears
      eyes = `<ellipse cx="18" cy="14" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="18" cy="15" r="3" fill="${color}"/>
              <path d="M13 10 Q18 12 23 10" stroke="${color}" stroke-width="2.5" fill="none"/>
              <ellipse cx="16" cy="20" rx="2" ry="3" fill="#88ccff" opacity="0.7"/>
              <ellipse cx="42" cy="14" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="42" cy="15" r="3" fill="${color}"/>
              <path d="M37 10 Q42 12 47 10" stroke="${color}" stroke-width="2.5" fill="none"/>`
    } else if (expr === 'confused') {
      // One eyebrow up, tilted eyes
      eyes = `<ellipse cx="18" cy="13" rx="6" ry="6.5" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="18" cy="13" r="3" fill="${color}"/>
              <path d="M12 8 Q18 6 24 8" stroke="${color}" stroke-width="2.5" fill="none"/>
              <ellipse cx="42" cy="13" rx="6" ry="6.5" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="42" cy="13" r="3" fill="${color}"/>
              <path d="M36 10 Q42 12 48 10" stroke="${color}" stroke-width="2.5" fill="none"/>`
    } else if (expr === 'suspicious') {
      // Half-lidded looking to the side
      eyes = `<ellipse cx="18" cy="13" rx="6" ry="5" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="20" cy="13" r="2.5" fill="${color}"/>
              <path d="M12 10 L24 11" stroke="${color}" stroke-width="3"/>
              <ellipse cx="42" cy="13" rx="6" ry="5" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="44" cy="13" r="2.5" fill="${color}"/>
              <path d="M36 11 L48 10" stroke="${color}" stroke-width="3"/>`
    } else if (expr === 'embarrassed') {
      // Closed shy eyes with blush
      eyes = `<path d="M13 13 Q18 16 23 13" stroke="${color}" stroke-width="3.5" fill="none"/>
              <path d="M37 13 Q42 16 47 13" stroke="${color}" stroke-width="3.5" fill="none"/>
              <circle cx="9" cy="20" r="3.5" fill="#ff9999" opacity="0.6"/>
              <circle cx="51" cy="20" r="3.5" fill="#ff9999" opacity="0.6"/>`
    } else if (expr === 'smug') {
      // One wink, one normal
      eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="3.5" fill="none"/>
              <circle cx="42" cy="13" r="6.5" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="42" cy="13" r="3.5" fill="${color}"/>
              <circle cx="40" cy="11" r="1.3" fill="white"/>`
    } else {
      // neutral - classic rubber hose round eyes
      eyes = `<circle cx="18" cy="13" r="6.5" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="18" cy="13" r="3.5" fill="${color}"/>
              <circle cx="16" cy="11" r="1.3" fill="white"/>
              <circle cx="42" cy="13" r="6.5" fill="white" stroke="${color}" stroke-width="3"/>
              <circle cx="42" cy="13" r="3.5" fill="${color}"/>
              <circle cx="40" cy="11" r="1.3" fill="white"/>`
    }
  }

  // Rubber hose mouths - flowing curves
  const expr = p.expression
  if (expr === 'happy') {
    mouth = p.mouthOpen
      ? `<path d="M20 24 Q30 34 40 24" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
         <path d="M22 26 Q30 32 38 26" fill="white" stroke="${color}" stroke-width="2.5"/>`
      : `<path d="M20 24 Q30 31 40 24" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'excited') {
    mouth = `<ellipse cx="30" cy="28" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="3.5"/>
            <path d="M26 29 Q30 32 34 29" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else if (expr === 'surprised') {
    mouth = `<ellipse cx="30" cy="29" rx="5" ry="6" fill="white" stroke="${color}" stroke-width="3.5"/>`
  } else if (expr === 'sad') {
    mouth = `<path d="M20 30 Q30 27 40 30" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'angry') {
    mouth = `<path d="M22 29 Q30 26 38 29" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'confused') {
    mouth = `<path d="M22 27 Q26 28 30 27 Q34 26 38 27" stroke="${color}" stroke-width="3" fill="none"/>`
  } else if (expr === 'embarrassed') {
    mouth = `<ellipse cx="30" cy="28" rx="3.5" ry="2.5" fill="${color}"/>`
  } else if (expr === 'smug') {
    mouth = `<path d="M20 26 Q30 29 40 26" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  } else if (expr === 'suspicious') {
    mouth = `<line x1="23" y1="27" x2="37" y2="28" stroke="${color}" stroke-width="3"/>`
  } else {
    mouth = `<line x1="24" y1="27" x2="36" y2="27" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
  }

  return { eyes, mouth }
}

// ══════════════════════════════════════════════════════════════
// STYLE 22: STICK FIGURE (Simple lines, expressive despite simplicity)
// ══════════════════════════════════════════════════════════════

function renderStickFigureFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = ''
  let mouth = ''

  if (p.isBlinking) {
    eyes = `<line x1="16" y1="13" x2="20" y2="13" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
            <line x1="40" y1="13" x2="44" y2="13" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<circle cx="18" cy="13" r="2" fill="${color}"/>
                <circle cx="42" cy="13" r="2" fill="${color}"/>
                <line x1="15" y1="10" x2="21" y2="10" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="39" y1="10" x2="45" y2="10" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`
        break
      case 'angry':
        eyes = `<circle cx="18" cy="13" r="2" fill="${color}"/>
                <circle cx="42" cy="13" r="2" fill="${color}"/>
                <line x1="14" y1="9" x2="22" y2="11" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
                <line x1="38" y1="11" x2="46" y2="9" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`
        break
      case 'surprised':
        eyes = `<circle cx="18" cy="13" r="3.5" fill="none" stroke="${color}" stroke-width="2"/>
                <circle cx="18" cy="13" r="1.5" fill="${color}"/>
                <circle cx="42" cy="13" r="3.5" fill="none" stroke="${color}" stroke-width="2"/>
                <circle cx="42" cy="13" r="1.5" fill="${color}"/>`
        break
      case 'sad':
        eyes = `<circle cx="18" cy="13" r="2" fill="${color}"/>
                <circle cx="42" cy="13" r="2" fill="${color}"/>
                <line x1="15" y1="9" x2="21" y2="10" stroke="${color}" stroke-width="1.5"/>
                <line x1="39" y1="10" x2="45" y2="9" stroke="${color}" stroke-width="1.5"/>
                <line x1="16" y1="18" x2="16" y2="22" stroke="#88ccff" stroke-width="1.5" opacity="0.7"/>`
        break
      case 'confused':
        eyes = `<circle cx="18" cy="13" r="2" fill="${color}"/>
                <circle cx="42" cy="13" r="2" fill="${color}"/>
                <line x1="15" y1="9" x2="21" y2="8" stroke="${color}" stroke-width="1.5"/>
                <line x1="39" y1="11" x2="45" y2="11" stroke="${color}" stroke-width="1.5"/>`
        break
      case 'suspicious':
        eyes = `<line x1="16" y1="12" x2="20" y2="14" stroke="${color}" stroke-width="2"/>
                <line x1="40" y1="12" x2="44" y2="14" stroke="${color}" stroke-width="2"/>`
        break
      case 'embarrassed':
        eyes = `<line x1="16" y1="13" x2="20" y2="13" stroke="${color}" stroke-width="2"/>
                <line x1="40" y1="13" x2="44" y2="13" stroke="${color}" stroke-width="2"/>
                <line x1="10" y1="20" x2="12" y2="20" stroke="#ff9999" stroke-width="2" opacity="0.6"/>
                <line x1="48" y1="20" x2="50" y2="20" stroke="#ff9999" stroke-width="2" opacity="0.6"/>`
        break
      case 'smug':
        eyes = `<line x1="16" y1="13" x2="20" y2="13" stroke="${color}" stroke-width="2"/>
                <circle cx="42" cy="13" r="2" fill="${color}"/>`
        break
      default:
        eyes = `<circle cx="18" cy="13" r="2" fill="${color}"/>
                <circle cx="42" cy="13" r="2" fill="${color}"/>`
    }
  }

  switch (p.expression) {
    case 'happy':
    case 'excited':
      mouth = `<path d="M24 25 Q30 29 36 25" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      break
    case 'surprised':
      mouth = `<circle cx="30" cy="28" r="3" fill="none" stroke="${color}" stroke-width="2"/>`
      break
    case 'sad':
      mouth = `<path d="M24 29 Q30 27 36 29" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      break
    case 'angry':
      mouth = `<line x1="24" y1="28" x2="36" y2="28" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
      break
    case 'confused':
      mouth = `<path d="M24 27 L28 28 L32 27 L36 28" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      break
    case 'smug':
      mouth = `<path d="M24 27 Q30 28 36 27" stroke="${color}" stroke-width="2" fill="none"/>`
      break
    case 'embarrassed':
      mouth = `<line x1="28" y1="28" x2="32" y2="28" stroke="${color}" stroke-width="2"/>`
      break
    default:
      mouth = `<line x1="26" y1="27" x2="34" y2="27" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`
  }

  return { eyes, mouth }
}

// STYLE 23: MANGA
function renderMangaFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = '', mouth = ''
  const speedLines = (x: number, y: number, dir: 'left' | 'right') => {
    const offset = dir === 'left' ? -1 : 1
    return `<line x1="${x + offset * 8}" y1="${y - 4}" x2="${x + offset * 12}" y2="${y - 6}" stroke="${color}" stroke-width="0.8" opacity="0.4"/>
            <line x1="${x + offset * 7}" y1="${y}" x2="${x + offset * 11}" y2="${y - 1}" stroke="${color}" stroke-width="0.8" opacity="0.4"/>
            <line x1="${x + offset * 8}" y1="${y + 4}" x2="${x + offset * 12}" y2="${y + 6}" stroke="${color}" stroke-width="0.8" opacity="0.4"/>`
  }
  
  if (p.isBlinking) {
    eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="3" fill="none"/>
            <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="3" fill="none"/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<path d="M13 14 Q18 9 23 14" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                <path d="M37 14 Q42 9 47 14" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                ${speedLines(18, 12, 'left')}${speedLines(42, 12, 'right')}`
        break
      case 'angry':
        eyes = `<ellipse cx="18" cy="14" rx="6" ry="5" fill="${color}"/>
                <ellipse cx="19" cy="13" rx="2.5" ry="3" fill="white"/>
                <path d="M11 8 L25 11" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
                <ellipse cx="42" cy="14" rx="6" ry="5" fill="${color}"/>
                <ellipse cx="41" cy="13" rx="2.5" ry="3" fill="white"/>
                <path d="M35 11 L49 8" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
                ${speedLines(30, 8, 'left')}${speedLines(30, 8, 'right')}`
        break
      case 'surprised':
        eyes = `<ellipse cx="18" cy="12" rx="7" ry="9" fill="white" stroke="${color}" stroke-width="3"/>
                <ellipse cx="18" cy="13" rx="4" ry="5" fill="${color}"/>
                <ellipse cx="42" cy="12" rx="7" ry="9" fill="white" stroke="${color}" stroke-width="3"/>
                <ellipse cx="42" cy="13" rx="4" ry="5" fill="${color}"/>
                ${speedLines(18, 12, 'left')}${speedLines(42, 12, 'right')}`
        break
      case 'sad':
        eyes = `<ellipse cx="18" cy="14" rx="5" ry="7" fill="white" stroke="${color}" stroke-width="2.5"/>
                <ellipse cx="18" cy="15" rx="2.5" ry="3.5" fill="${color}"/>
                <path d="M18 19 Q19 24 18 26" stroke="#4d94ff" stroke-width="2.5" fill="none" opacity="0.7"/>
                <ellipse cx="42" cy="14" rx="5" ry="7" fill="white" stroke="${color}" stroke-width="2.5"/>
                <ellipse cx="42" cy="15" rx="2.5" ry="3.5" fill="${color}"/>`
        break
      case 'confused':
        eyes = `<ellipse cx="18" cy="12" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="2.5"/>
                <ellipse cx="18" cy="13" rx="3" ry="3.5" fill="${color}"/>
                <ellipse cx="42" cy="14" rx="5" ry="6" fill="white" stroke="${color}" stroke-width="2.5"/>
                <ellipse cx="42" cy="14" rx="2.5" ry="3" fill="${color}"/>`
        break
      case 'suspicious':
        eyes = `<ellipse cx="18" cy="14" rx="6" ry="4" fill="white" stroke="${color}" stroke-width="2.5"/>
                <ellipse cx="19" cy="14" rx="2.5" ry="2.5" fill="${color}"/>
                <ellipse cx="42" cy="14" rx="6" ry="4" fill="white" stroke="${color}" stroke-width="2.5"/>
                <ellipse cx="43" cy="14" rx="2.5" ry="2.5" fill="${color}"/>`
        break
      case 'embarrassed':
        eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="3" fill="none"/>
                <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="3" fill="none"/>
                <circle cx="8" cy="20" r="4" fill="#ff99bb" opacity="0.7"/>
                <circle cx="52" cy="20" r="4" fill="#ff99bb" opacity="0.7"/>`
        break
      case 'smug':
        eyes = `<path d="M13 12 Q18 14 23 12" stroke="${color}" stroke-width="2.5" fill="none"/>
                <ellipse cx="18" cy="15" rx="5" ry="4" fill="white" stroke="${color}" stroke-width="2.5"/>
                <ellipse cx="42" cy="13" rx="6" ry="6" fill="white" stroke="${color}" stroke-width="2.5"/>
                <ellipse cx="42" cy="13" rx="3" ry="3.5" fill="${color}"/>`
        break
      default:
        eyes = `<ellipse cx="18" cy="12" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="2.5"/>
                <ellipse cx="18" cy="13" rx="3" ry="4" fill="${color}"/>
                <ellipse cx="42" cy="12" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="2.5"/>
                <ellipse cx="42" cy="13" rx="3" ry="4" fill="${color}"/>`
    }
  }
  
  switch (p.expression) {
    case 'happy':
      mouth = p.mouthOpen
        ? `<path d="M22 25 Q30 33 38 25" stroke="${color}" stroke-width="3" fill="none"/>
           <path d="M24 27 Q30 31 36 27" fill="white" stroke="${color}" stroke-width="2"/>`
        : `<path d="M22 25 Q30 30 38 25" stroke="${color}" stroke-width="3" fill="none"/>`
      break
    case 'excited':
      mouth = `<ellipse cx="30" cy="28" rx="5" ry="6" fill="white" stroke="${color}" stroke-width="3"/>
              ${speedLines(30, 28, 'left')}${speedLines(30, 28, 'right')}`
      break
    case 'surprised':
      mouth = `<ellipse cx="30" cy="28" rx="4.5" ry="5.5" fill="white" stroke="${color}" stroke-width="3"/>`
      break
    case 'sad':
      mouth = `<path d="M22 30 Q30 27 38 30" stroke="${color}" stroke-width="3" fill="none"/>`
      break
    case 'angry':
      mouth = `<path d="M22 29 L38 29" stroke="${color}" stroke-width="4"/>`
      break
    case 'confused':
      mouth = `<path d="M22 27 Q27 28 30 27 Q33 26 38 27" stroke="${color}" stroke-width="2.5" fill="none"/>`
      break
    case 'embarrassed':
      mouth = `<ellipse cx="30" cy="28" rx="3" ry="2" fill="${color}"/>`
      break
    case 'smug':
      mouth = `<path d="M22 27 Q30 29 38 27" stroke="${color}" stroke-width="3" fill="none"/>`
      break
    case 'suspicious':
      mouth = `<line x1="24" y1="27" x2="36" y2="28" stroke="${color}" stroke-width="3"/>`
      break
    default:
      mouth = `<line x1="26" y1="27" x2="34" y2="27" stroke="${color}" stroke-width="2.5"/>`
  }
  return { eyes, mouth }
}

// STYLE 24: GRUMPY CAT
function renderGrumpyCatFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = '', mouth = ''
  if (p.isBlinking) {
    eyes = `<path d="M13 14 Q18 16 23 14" stroke="${color}" stroke-width="3" fill="none"/>
            <path d="M37 14 Q42 16 47 14" stroke="${color}" stroke-width="3" fill="none"/>`
  } else {
    const baseEyes = `<ellipse cx="18" cy="14" rx="5" ry="5.5" fill="${color}"/>
                      <ellipse cx="18" cy="13" rx="2" ry="2.5" fill="white"/>
                      <path d="M13 11 Q18 13 23 11" stroke="${color}" stroke-width="2.5" fill="none"/>
                      <ellipse cx="42" cy="14" rx="5" ry="5.5" fill="${color}"/>
                      <ellipse cx="42" cy="13" rx="2" ry="2.5" fill="white"/>
                      <path d="M37 11 Q42 13 47 11" stroke="${color}" stroke-width="2.5" fill="none"/>`
    switch (p.expression) {
      case 'angry':
        eyes = `<ellipse cx="18" cy="14" rx="5.5" ry="5" fill="${color}"/>
                <ellipse cx="18" cy="13" rx="2" ry="2" fill="white"/>
                <path d="M12 9 L24 12" stroke="${color}" stroke-width="3.5"/>
                <ellipse cx="42" cy="14" rx="5.5" ry="5" fill="${color}"/>
                <ellipse cx="42" cy="13" rx="2" ry="2" fill="white"/>
                <path d="M36 12 L48 9" stroke="${color}" stroke-width="3.5"/>`
        break
      case 'surprised':
        eyes = `<ellipse cx="18" cy="13" rx="6" ry="7" fill="${color}"/>
                <ellipse cx="18" cy="12" rx="2.5" ry="3" fill="white"/>
                <ellipse cx="42" cy="13" rx="6" ry="7" fill="${color}"/>
                <ellipse cx="42" cy="12" rx="2.5" ry="3" fill="white"/>`
        break
      case 'sad':
        eyes = baseEyes + `<ellipse cx="16" cy="19" rx="1.5" ry="2" fill="#88ccff" opacity="0.6"/>`
        break
      case 'embarrassed':
        eyes = `<path d="M13 14 Q18 16 23 14" stroke="${color}" stroke-width="3" fill="none"/>
                <path d="M37 14 Q42 16 47 14" stroke="${color}" stroke-width="3" fill="none"/>
                <circle cx="9" cy="20" r="2.5" fill="#ff9999" opacity="0.5"/>
                <circle cx="51" cy="20" r="2.5" fill="#ff9999" opacity="0.5"/>`
        break
      default:
        eyes = baseEyes
    }
  }
  
  switch (p.expression) {
    case 'surprised':
      mouth = `<ellipse cx="30" cy="28" rx="3.5" ry="4" fill="none" stroke="${color}" stroke-width="2.5"/>`
      break
    case 'angry':
      mouth = `<path d="M22 30 Q30 27 38 30" stroke="${color}" stroke-width="3.5" fill="none"/>`
      break
    default:
      mouth = `<path d="M22 29 Q30 27 38 29" stroke="${color}" stroke-width="3" fill="none"/>`
  }
  return { eyes, mouth }
}

// STYLE 25: SOUTH PARK
function renderSouthParkFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = '', mouth = ''
  if (p.isBlinking) {
    eyes = `<ellipse cx="18" cy="13" rx="6" ry="2" fill="${color}"/>
            <ellipse cx="42" cy="13" rx="6" ry="2" fill="${color}"/>`
  } else {
    const baseEyes = `<ellipse cx="18" cy="13" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="2.5"/>
                      <circle cx="18" cy="13" r="3" fill="${color}"/>
                      <circle cx="17" cy="11" r="1" fill="white"/>
                      <ellipse cx="42" cy="13" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="2.5"/>
                      <circle cx="42" cy="13" r="3" fill="${color}"/>
                      <circle cx="41" cy="11" r="1" fill="white"/>`
    switch (p.expression) {
      case 'angry':
        eyes = `<ellipse cx="18" cy="14" rx="5.5" ry="6" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="18" cy="14" r="3" fill="${color}"/>
                <path d="M12 9 L24 11" stroke="${color}" stroke-width="3"/>
                <ellipse cx="42" cy="14" rx="5.5" ry="6" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="42" cy="14" r="3" fill="${color}"/>
                <path d="M36 11 L48 9" stroke="${color}" stroke-width="3"/>`
        break
      case 'surprised':
        eyes = `<ellipse cx="18" cy="13" rx="7" ry="8" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="18" cy="13" r="4" fill="${color}"/>
                <ellipse cx="42" cy="13" rx="7" ry="8" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="42" cy="13" r="4" fill="${color}"/>`
        break
      case 'sad':
        eyes = `<ellipse cx="18" cy="14" rx="5.5" ry="6.5" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="18" cy="15" r="3" fill="${color}"/>
                <path d="M13 10 Q18 12 23 10" stroke="${color}" stroke-width="2" fill="none"/>
                <ellipse cx="16" cy="20" rx="1.5" ry="2.5" fill="#88ccff" opacity="0.7"/>
                <ellipse cx="42" cy="14" rx="5.5" ry="6.5" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="42" cy="15" r="3" fill="${color}"/>`
        break
      case 'embarrassed':
        eyes = `<ellipse cx="18" cy="13" rx="6" ry="2.5" fill="${color}"/>
                <ellipse cx="42" cy="13" rx="6" ry="2.5" fill="${color}"/>
                <ellipse cx="10" cy="20" rx="3" ry="2.5" fill="#ff9999" opacity="0.6"/>
                <ellipse cx="50" cy="20" rx="3" ry="2.5" fill="#ff9999" opacity="0.6"/>`
        break
      default:
        eyes = baseEyes
    }
  }
  
  switch (p.expression) {
    case 'happy':
      mouth = p.mouthOpen
        ? `<path d="M22 24 Q30 32 38 24" stroke="${color}" stroke-width="3" fill="none"/>
           <ellipse cx="30" cy="28" rx="5" ry="4" fill="white" stroke="${color}" stroke-width="2"/>`
        : `<path d="M22 24 Q30 29 38 24" stroke="${color}" stroke-width="3" fill="none"/>`
      break
    case 'excited':
      mouth = `<ellipse cx="30" cy="28" rx="5.5" ry="6.5" fill="white" stroke="${color}" stroke-width="3"/>`
      break
    case 'surprised':
      mouth = `<ellipse cx="30" cy="29" rx="5" ry="6" fill="white" stroke="${color}" stroke-width="3"/>`
      break
    case 'sad':
      mouth = `<path d="M22 30 Q30 27 38 30" stroke="${color}" stroke-width="3" fill="none"/>`
      break
    case 'angry':
      mouth = `<path d="M22 28 Q30 26 38 28" stroke="${color}" stroke-width="3.5" fill="none"/>`
      break
    default:
      mouth = `<line x1="24" y1="27" x2="36" y2="27" stroke="${color}" stroke-width="3"/>`
  }
  return { eyes, mouth }
}

// STYLE 26: ADVENTURE TIME
function renderAdventureTimeFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = '', mouth = ''
  if (p.isBlinking) {
    eyes = `<line x1="16" y1="13" x2="20" y2="13" stroke="${color}" stroke-width="3"/>
            <line x1="40" y1="13" x2="44" y2="13" stroke="${color}" stroke-width="3"/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<circle cx="18" cy="13" r="3" fill="${color}"/>
                <circle cx="16" cy="11" r="1" fill="white"/>
                <circle cx="42" cy="13" r="3" fill="${color}"/>
                <circle cx="40" cy="11" r="1" fill="white"/>`
        break
      case 'angry':
        eyes = `<circle cx="18" cy="14" r="3" fill="${color}"/>
                <path d="M14 10 L22 12" stroke="${color}" stroke-width="3"/>
                <circle cx="42" cy="14" r="3" fill="${color}"/>
                <path d="M38 12 L46 10" stroke="${color}" stroke-width="3"/>`
        break
      case 'surprised':
        eyes = `<circle cx="18" cy="13" r="4.5" fill="${color}"/>
                <circle cx="42" cy="13" r="4.5" fill="${color}"/>`
        break
      case 'sad':
        eyes = `<circle cx="18" cy="14" r="3" fill="${color}"/>
                <ellipse cx="16" cy="19" rx="1.5" ry="2.5" fill="#88ddff" opacity="0.7"/>
                <circle cx="42" cy="14" r="3" fill="${color}"/>`
        break
      case 'embarrassed':
        eyes = `<line x1="16" y1="13" x2="20" y2="13" stroke="${color}" stroke-width="3"/>
                <line x1="40" y1="13" x2="44" y2="13" stroke="${color}" stroke-width="3"/>
                <circle cx="10" cy="20" r="2.5" fill="#ffaaaa" opacity="0.7"/>
                <circle cx="50" cy="20" r="2.5" fill="#ffaaaa" opacity="0.7"/>`
        break
      default:
        eyes = `<circle cx="18" cy="13" r="3" fill="${color}"/>
                <circle cx="42" cy="13" r="3" fill="${color}"/>`
    }
  }
  
  switch (p.expression) {
    case 'happy':
      mouth = `<path d="M24 25 Q30 29 36 25" stroke="${color}" stroke-width="3" fill="none"/>`
      break
    case 'excited':
      mouth = `<ellipse cx="30" cy="28" rx="5" ry="5.5" fill="none" stroke="${color}" stroke-width="3"/>`
      break
    case 'surprised':
      mouth = `<circle cx="30" cy="28" r="4" fill="none" stroke="${color}" stroke-width="3"/>`
      break
    case 'sad':
      mouth = `<path d="M24 29 Q30 27 36 29" stroke="${color}" stroke-width="3" fill="none"/>`
      break
    default:
      mouth = `<line x1="26" y1="27" x2="34" y2="27" stroke="${color}" stroke-width="3"/>`
  }
  return { eyes, mouth }
}

// STYLE 27: PIXAR
function renderPixarFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = '', mouth = ''
  const pixarHighlights = (cx: number, cy: number) => `
    <ellipse cx="${cx - 1.5}" cy="${cy - 2}" rx="2.5" ry="3.5" fill="white" opacity="0.9"/>
    <circle cx="${cx + 1}" cy="${cy + 1.5}" r="1.2" fill="white" opacity="0.7"/>
    <circle cx="${cx - 2}" cy="${cy}" r="0.8" fill="white" opacity="0.5"/>`
  
  if (p.isBlinking) {
    eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="3" fill="none"/>
            <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="3" fill="none"/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<ellipse cx="18" cy="12" rx="6.5" ry="7.5" fill="${color}"/>
                <ellipse cx="18" cy="13" rx="6" ry="7" fill="${color}" opacity="0.6"/>
                ${pixarHighlights(18, 11)}
                <ellipse cx="42" cy="12" rx="6.5" ry="7.5" fill="${color}"/>
                <ellipse cx="42" cy="13" rx="6" ry="7" fill="${color}" opacity="0.6"/>
                ${pixarHighlights(42, 11)}`
        break
      case 'angry':
        eyes = `<ellipse cx="18" cy="14" rx="6" ry="6.5" fill="${color}"/>
                ${pixarHighlights(18, 13)}
                <path d="M11 8 L25 11" stroke="${color}" stroke-width="3.5"/>
                <ellipse cx="42" cy="14" rx="6" ry="6.5" fill="${color}"/>
                ${pixarHighlights(42, 13)}
                <path d="M35 11 L49 8" stroke="${color}" stroke-width="3.5"/>`
        break
      case 'surprised':
        eyes = `<ellipse cx="18" cy="13" rx="7" ry="8.5" fill="${color}"/>
                ${pixarHighlights(18, 11)}
                <ellipse cx="42" cy="13" rx="7" ry="8.5" fill="${color}"/>
                ${pixarHighlights(42, 11)}`
        break
      case 'sad':
        eyes = `<ellipse cx="18" cy="14" rx="5.5" ry="7" fill="${color}"/>
                ${pixarHighlights(18, 12)}
                <ellipse cx="42" cy="14" rx="5.5" ry="7" fill="${color}"/>
                ${pixarHighlights(42, 12)}`
        break
      case 'embarrassed':
        eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="3" fill="none"/>
                <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="3" fill="none"/>
                <ellipse cx="9" cy="20" rx="3.5" ry="3" fill="#ff9999" opacity="0.6"/>
                <ellipse cx="51" cy="20" rx="3.5" ry="3" fill="#ff9999" opacity="0.6"/>`
        break
      default:
        eyes = `<ellipse cx="18" cy="13" rx="6" ry="7" fill="${color}"/>
                ${pixarHighlights(18, 12)}
                <ellipse cx="42" cy="13" rx="6" ry="7" fill="${color}"/>
                ${pixarHighlights(42, 12)}`
    }
  }
  
  switch (p.expression) {
    case 'happy':
      mouth = p.mouthOpen
        ? `<path d="M22 24 Q30 32 38 24" stroke="${color}" stroke-width="3.5" fill="none"/>
           <path d="M24 26 Q30 31 36 26" fill="white" stroke="${color}" stroke-width="2"/>`
        : `<path d="M22 24 Q30 30 38 24" stroke="${color}" stroke-width="3.5" fill="none"/>`
      break
    case 'excited':
      mouth = `<ellipse cx="30" cy="28" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="3"/>`
      break
    case 'surprised':
      mouth = `<ellipse cx="30" cy="29" rx="5" ry="6" fill="none" stroke="${color}" stroke-width="3"/>`
      break
    case 'sad':
      mouth = `<path d="M22 30 Q30 27 38 30" stroke="${color}" stroke-width="3.5" fill="none"/>`
      break
    default:
      mouth = `<line x1="24" y1="27" x2="36" y2="27" stroke="${color}" stroke-width="3"/>`
  }
  return { eyes, mouth }
}

// STYLE 28: TIM BURTON
function renderTimBurtonFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = '', mouth = ''
  const stitch = (x1: number, y: number, x2: number) => {
    let stitches = ''
    for (let x = x1; x < x2; x += 4) {
      stitches += `<line x1="${x}" y1="${y - 1}" x2="${x}" y2="${y + 1}" stroke="${color}" stroke-width="1" opacity="0.5"/>`
    }
    return stitches
  }
  
  if (p.isBlinking) {
    eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="2.5" fill="none"/>
            <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="2.5" fill="none"/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<ellipse cx="18" cy="12" rx="6.5" ry="8.5" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="18" cy="13" r="3.5" fill="${color}"/>
                <ellipse cx="42" cy="12" rx="6.5" ry="8.5" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="42" cy="13" r="3.5" fill="${color}"/>`
        break
      case 'angry':
        eyes = `<ellipse cx="18" cy="14" rx="6" ry="7" fill="${color}"/>
                <circle cx="18" cy="13" r="2.5" fill="white"/>
                <path d="M11 7 L25 11" stroke="${color}" stroke-width="3.5"/>
                <ellipse cx="42" cy="14" rx="6" ry="7" fill="${color}"/>
                <circle cx="42" cy="13" r="2.5" fill="white"/>
                <path d="M35 11 L49 7" stroke="${color}" stroke-width="3.5"/>`
        break
      case 'surprised':
        eyes = `<ellipse cx="18" cy="13" rx="7.5" ry="10" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="18" cy="14" r="4" fill="${color}"/>
                <ellipse cx="42" cy="13" rx="7.5" ry="10" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="42" cy="14" r="4" fill="${color}"/>`
        break
      case 'sad':
        eyes = `<ellipse cx="18" cy="15" rx="5.5" ry="8" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="18" cy="16" r="3" fill="${color}"/>
                <path d="M18 21 Q19 25 18 27" stroke="#4d94ff" stroke-width="2" fill="none" opacity="0.7"/>
                <ellipse cx="42" cy="15" rx="5.5" ry="8" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="42" cy="16" r="3" fill="${color}"/>`
        break
      case 'embarrassed':
        eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="2.5" fill="none"/>
                <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="2.5" fill="none"/>
                <circle cx="9" cy="20" r="3" fill="#ff9999" opacity="0.5"/>
                <circle cx="51" cy="20" r="3" fill="#ff9999" opacity="0.5"/>`
        break
      default:
        eyes = `<ellipse cx="18" cy="13" rx="6.5" ry="8" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="18" cy="14" r="3.5" fill="${color}"/>
                <ellipse cx="42" cy="13" rx="6.5" ry="8" fill="white" stroke="${color}" stroke-width="2.5"/>
                <circle cx="42" cy="14" r="3.5" fill="${color}"/>`
    }
  }
  
  switch (p.expression) {
    case 'happy':
      mouth = p.mouthOpen
        ? `<path d="M22 24 Q30 32 38 24" stroke="${color}" stroke-width="3.5" fill="none"/>
           <path d="M24 26 Q30 30 36 26" fill="white" stroke="${color}" stroke-width="2"/>
           ${stitch(24, 25, 36)}`
        : `<path d="M22 24 Q30 30 38 24" stroke="${color}" stroke-width="3" fill="none"/>
           ${stitch(23, 27, 37)}`
      break
    case 'excited':
      mouth = `<ellipse cx="30" cy="29" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="3"/>
              ${stitch(26, 27, 34)}`
      break
    case 'surprised':
      mouth = `<ellipse cx="30" cy="29" rx="5.5" ry="6.5" fill="white" stroke="${color}" stroke-width="3"/>`
      break
    case 'sad':
      mouth = `<path d="M22 30 Q30 27 38 30" stroke="${color}" stroke-width="3.5" fill="none"/>
              ${stitch(23, 29, 37)}`
      break
    default:
      mouth = `<line x1="24" y1="27" x2="36" y2="27" stroke="${color}" stroke-width="3"/>
              ${stitch(25, 27, 35)}`
  }
  return { eyes, mouth }
}

// STYLE 29: POWERPUFF GIRLS
function renderPowerpuffFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = '', mouth = ''
  if (p.isBlinking) {
    eyes = `<path d="M11 13 Q18 16 25 13" stroke="${color}" stroke-width="3" fill="none"/>
            <path d="M35 13 Q42 16 49 13" stroke="${color}" stroke-width="3" fill="none"/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<ellipse cx="18" cy="11" rx="8" ry="10" fill="${color}"/>
                <ellipse cx="18" cy="8" rx="3.5" ry="4.5" fill="white"/>
                <circle cx="15" cy="6" r="1.5" fill="white"/>
                <ellipse cx="42" cy="11" rx="8" ry="10" fill="${color}"/>
                <ellipse cx="42" cy="8" rx="3.5" ry="4.5" fill="white"/>
                <circle cx="39" cy="6" r="1.5" fill="white"/>`
        break
      case 'angry':
        eyes = `<ellipse cx="18" cy="13" rx="7.5" ry="9" fill="${color}"/>
                <ellipse cx="18" cy="12" rx="3" ry="3.5" fill="white"/>
                <path d="M10 7 L26 10" stroke="${color}" stroke-width="4"/>
                <ellipse cx="42" cy="13" rx="7.5" ry="9" fill="${color}"/>
                <ellipse cx="42" cy="12" rx="3" ry="3.5" fill="white"/>
                <path d="M34 10 L50 7" stroke="${color}" stroke-width="4"/>`
        break
      case 'surprised':
        eyes = `<ellipse cx="18" cy="12" rx="8.5" ry="11" fill="${color}"/>
                <ellipse cx="18" cy="8" rx="4" ry="5.5" fill="white"/>
                <ellipse cx="42" cy="12" rx="8.5" ry="11" fill="${color}"/>
                <ellipse cx="42" cy="8" rx="4" ry="5.5" fill="white"/>`
        break
      case 'sad':
        eyes = `<ellipse cx="18" cy="13" rx="7.5" ry="9.5" fill="${color}"/>
                <ellipse cx="18" cy="11" rx="3" ry="3.5" fill="white"/>
                <path d="M18 20 Q19 25 18 28" stroke="#5ac8fa" stroke-width="2.5" fill="none" opacity="0.7"/>
                <ellipse cx="42" cy="13" rx="7.5" ry="9.5" fill="${color}"/>
                <ellipse cx="42" cy="11" rx="3" ry="3.5" fill="white"/>`
        break
      case 'embarrassed':
        eyes = `<path d="M11 13 Q18 16 25 13" stroke="${color}" stroke-width="3" fill="none"/>
                <path d="M35 13 Q42 16 49 13" stroke="${color}" stroke-width="3" fill="none"/>
                <ellipse cx="8" cy="20" rx="4" ry="3.5" fill="#ffb3d9" opacity="0.7"/>
                <ellipse cx="52" cy="20" rx="4" ry="3.5" fill="#ffb3d9" opacity="0.7"/>`
        break
      default:
        eyes = `<ellipse cx="18" cy="12" rx="8" ry="10" fill="${color}"/>
                <ellipse cx="18" cy="9" rx="3.5" ry="4.5" fill="white"/>
                <ellipse cx="42" cy="12" rx="8" ry="10" fill="${color}"/>
                <ellipse cx="42" cy="9" rx="3.5" ry="4.5" fill="white"/>`
    }
  }
  
  switch (p.expression) {
    case 'happy':
      mouth = p.mouthOpen
        ? `<path d="M26 26 Q30 30 34 26" stroke="${color}" stroke-width="2.5" fill="none"/>
           <ellipse cx="30" cy="28" rx="3" ry="2.5" fill="${color}" opacity="0.3"/>`
        : `<path d="M26 26 Q30 29 34 26" stroke="${color}" stroke-width="2.5" fill="none"/>`
      break
    case 'excited':
      mouth = `<ellipse cx="30" cy="28" rx="4" ry="4.5" fill="none" stroke="${color}" stroke-width="2.5"/>`
      break
    case 'surprised':
      mouth = `<circle cx="30" cy="28" r="3.5" fill="none" stroke="${color}" stroke-width="2.5"/>`
      break
    case 'sad':
      mouth = `<path d="M26 29 Q30 27 34 29" stroke="${color}" stroke-width="2.5" fill="none"/>`
      break
    default:
      mouth = `<line x1="28" y1="27" x2="32" y2="27" stroke="${color}" stroke-width="2.5"/>`
  }
  return { eyes, mouth }
}

// STYLE 30: SPONGEBOB
function renderSpongeBobFace(p: FaceRenderParams, color: string): FaceElements {
  let eyes = '', mouth = ''
  if (p.isBlinking) {
    eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="3" fill="none"/>
            <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="3" fill="none"/>`
  } else {
    switch (p.expression) {
      case 'happy':
      case 'excited':
        eyes = `<ellipse cx="18" cy="12" rx="7" ry="8" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="18" cy="13" r="3.5" fill="${color}"/>
                <circle cx="16" cy="11" r="1.3" fill="white"/>
                <ellipse cx="42" cy="12" rx="7" ry="8" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="42" cy="13" r="3.5" fill="${color}"/>
                <circle cx="40" cy="11" r="1.3" fill="white"/>`
        break
      case 'angry':
        eyes = `<ellipse cx="18" cy="14" rx="6.5" ry="7" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="18" cy="14" r="3.5" fill="${color}"/>
                <path d="M11 8 L25 11" stroke="${color}" stroke-width="4"/>
                <ellipse cx="42" cy="14" rx="6.5" ry="7" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="42" cy="14" r="3.5" fill="${color}"/>
                <path d="M35 11 L49 8" stroke="${color}" stroke-width="4"/>`
        break
      case 'surprised':
        eyes = `<ellipse cx="18" cy="12" rx="8" ry="9" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="18" cy="13" r="4.5" fill="${color}"/>
                <ellipse cx="42" cy="12" rx="8" ry="9" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="42" cy="13" r="4.5" fill="${color}"/>`
        break
      case 'sad':
        eyes = `<ellipse cx="18" cy="14" rx="6.5" ry="8" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="18" cy="15" r="3.5" fill="${color}"/>
                <path d="M18 21 Q19 26 18 29" stroke="#5ac8fa" stroke-width="3" fill="none" opacity="0.7"/>
                <ellipse cx="42" cy="14" rx="6.5" ry="8" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="42" cy="15" r="3.5" fill="${color}"/>`
        break
      case 'embarrassed':
        eyes = `<path d="M13 13 Q18 15 23 13" stroke="${color}" stroke-width="3" fill="none"/>
                <path d="M37 13 Q42 15 47 13" stroke="${color}" stroke-width="3" fill="none"/>
                <ellipse cx="9" cy="20" rx="4" ry="3" fill="#ffaaaa" opacity="0.7"/>
                <ellipse cx="51" cy="20" rx="4" ry="3" fill="#ffaaaa" opacity="0.7"/>`
        break
      default:
        eyes = `<ellipse cx="18" cy="13" rx="7" ry="8" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="18" cy="14" r="3.5" fill="${color}"/>
                <ellipse cx="42" cy="13" rx="7" ry="8" fill="white" stroke="${color}" stroke-width="3"/>
                <circle cx="42" cy="14" r="3.5" fill="${color}"/>`
    }
  }
  
  switch (p.expression) {
    case 'happy':
      mouth = p.mouthOpen
        ? `<path d="M20 24 Q30 33 40 24" stroke="${color}" stroke-width="3.5" fill="none"/>
           <path d="M22 26 Q30 31 38 26" fill="white" stroke="${color}" stroke-width="3"/>
           <rect x="28" y="27" width="4" height="5" fill="white" stroke="${color}" stroke-width="1.5"/>`
        : `<path d="M20 24 Q30 30 40 24" stroke="${color}" stroke-width="3.5" fill="none"/>
           <rect x="28" y="26" width="4" height="4" fill="white" stroke="${color}" stroke-width="1.5"/>`
      break
    case 'excited':
      mouth = `<ellipse cx="30" cy="29" rx="6.5" ry="7.5" fill="white" stroke="${color}" stroke-width="3.5"/>
              <rect x="28" y="28" width="4" height="5" fill="white" stroke="${color}" stroke-width="1.5"/>`
      break
    case 'surprised':
      mouth = `<ellipse cx="30" cy="30" rx="6" ry="7" fill="white" stroke="${color}" stroke-width="3.5"/>`
      break
    case 'sad':
      mouth = `<path d="M20 31 Q30 28 40 31" stroke="${color}" stroke-width="3.5" fill="none"/>`
      break
    default:
      mouth = `<line x1="24" y1="28" x2="36" y2="28" stroke="${color}" stroke-width="3"/>
              <rect x="28" y="26" width="4" height="3" fill="white" stroke="${color}" stroke-width="1.5"/>`
  }
  return { eyes, mouth }
}
