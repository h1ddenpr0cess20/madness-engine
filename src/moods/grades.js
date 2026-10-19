/**
 * Every grade the games shoot a picture on, by name, with the film its game
 * gives it: `filter`, the grade itself (a CSS filter for the canvas and
 * nothing else); `grain`, how much grain dances over the picture;
 * `vignette`, the shadow round its edges; `ui`, a filter for the interface
 * too, where the game shoots it on the same stock (the noir's). Hand one to
 * `stage.film.set` (film.js). A set's mood (`moods/*`) has its own film, its
 * weather's included (a sandstorm's haze).
 */
export const GRADES = {
  // rocknroller-ii
  noir: {
    grade: 'noir',
    filter: 'grayscale(1) contrast(1.32) brightness(1.06)',
    grain: 0.16,
    vignette: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.72) 100%)',
    ui: 'grayscale(1) contrast(1.15)',
  },
  sepia: {
    grade: 'sepia',
    filter: 'sepia(0.42) saturate(1.15) contrast(1.06)',
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  technicolor: {
    grade: 'technicolor',
    filter: 'saturate(1.35) contrast(1.08)',
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  horror: {
    grade: 'horror',
    filter: 'saturate(0.6) hue-rotate(-12deg) contrast(1.12) brightness(0.95)',
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  scifi: {
    grade: 'scifi',
    filter: 'saturate(1.15) hue-rotate(8deg) contrast(1.05)',
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  // rocknroller-iii
  fog: {
    grade: 'fog',
    filter: 'saturate(0.72) contrast(0.9) brightness(1.06)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  dusk: {
    grade: 'dusk',
    filter: 'sepia(0.16) saturate(1.2) contrast(1.04)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  alpine: {
    grade: 'alpine',
    filter: 'saturate(1.15) brightness(0.96) contrast(1.14) hue-rotate(-4deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  warm: {
    grade: 'warm',
    filter: 'sepia(0.24) saturate(1.25) contrast(1.05) brightness(1.03)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  'neon.rocknroller-iii': {
    grade: 'neon',
    filter: 'saturate(1.4) contrast(1.1)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  tropical: {
    grade: 'tropical',
    filter: 'saturate(1.3) contrast(1.04) brightness(1.03)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  // metroll
  steel: {
    grade: 'steel',
    filter: 'saturate(0.82) contrast(1.1) brightness(1.02)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  neon: {
    grade: 'neon',
    filter: 'saturate(1.45) contrast(1.1) hue-rotate(-6deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  denim: {
    grade: 'denim',
    filter: 'saturate(0.9) contrast(1.06) hue-rotate(4deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  mist: {
    grade: 'mist',
    filter: 'saturate(0.82) contrast(0.94) brightness(1.04) hue-rotate(10deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  basement: {
    grade: 'basement',
    filter: 'sepia(0.18) saturate(1.1) contrast(1.12) brightness(1.04)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  swamp: {
    grade: 'swamp',
    filter: 'saturate(1.2) contrast(1.08) hue-rotate(-10deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  frost: {
    grade: 'frost',
    filter: 'saturate(0.74) contrast(1.06) brightness(1.08) hue-rotate(6deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  bayou: {
    grade: 'bayou',
    filter: 'sepia(0.22) saturate(1.2) contrast(1.05)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  industrial: {
    grade: 'industrial',
    filter: 'saturate(0.7) contrast(1.16) brightness(1.02)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  dust: {
    grade: 'dust',
    filter: 'sepia(0.3) saturate(1.2) contrast(1.04) brightness(1.04)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  scene: {
    grade: 'scene',
    filter: 'saturate(1.3) contrast(1.08)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  storm: {
    grade: 'storm',
    filter: 'saturate(0.78) contrast(1.1) brightness(0.98)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
};
