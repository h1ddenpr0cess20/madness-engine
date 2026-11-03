/**
 * Curated resin palettes for the asset viewer's bowling-ball randomizer.
 * Each palette deliberately keeps a dark base and hole finish, with a clear
 * swirl colour and a smaller high-contrast accent vein.
 */
export const BOWLING_BALL_PALETTES = Object.freeze([
  { base: '#102b45', swirl: '#18b6b0', accent: '#f3d16b', holes: '#050d18' }, // Lagoon
  { base: '#35162f', swirl: '#ed5a47', accent: '#ffd17b', holes: '#11070f' }, // Ember
  { base: '#211742', swirl: '#9d70e8', accent: '#f4a8d4', holes: '#0b0717' }, // Amethyst
  { base: '#10352d', swirl: '#38b984', accent: '#d9e978', holes: '#04120d' }, // Jade
  { base: '#173750', swirl: '#6fcde5', accent: '#f4f0e9', holes: '#07111a' }, // Arctic
  { base: '#491c50', swirl: '#ef65a6', accent: '#ffce68', holes: '#17091a' }, // Candy
  { base: '#101b45', swirl: '#635cf0', accent: '#43e0c0', holes: '#060b1c' }, // Nebula
  { base: '#492b19', swirl: '#d98b3c', accent: '#f5dca2', holes: '#140d08' }, // Tiger
].map((palette) => Object.freeze(palette)));

const KEYS = ['base', 'swirl', 'accent', 'holes'];

/**
 * Pick a coordinated palette, avoiding the current one where alternatives
 * exist. The injectable random source keeps the picker deterministic in tests.
 */
export function randomBowlingBallPalette(random = Math.random, current = {}) {
  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new RangeError('randomBowlingBallPalette: random source must return a number in [0, 1)');
  }

  const alternatives = BOWLING_BALL_PALETTES.filter((palette) =>
    !KEYS.every((key) => String(current[key] ?? '').toLowerCase() === palette[key]),
  );
  const choices = alternatives.length ? alternatives : BOWLING_BALL_PALETTES;
  return { ...choices[Math.floor(sample * choices.length)] };
}
