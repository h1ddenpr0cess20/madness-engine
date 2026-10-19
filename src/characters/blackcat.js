import { coat } from '../models/skins.js';
import { quadruped } from './quadruped.js';

/**
 * The Black Cat: the cat of every bad omen, glossy, thin, the tail up in a
 * question mark, the eyes the green of a bottle held to the light. Crosses
 * your path on purpose. About 0.25 tiles tall, and quick.
 */

const FUR = coat({ over: '#16141a', under: '#0c0a10', vary: 0.1, freq: 18 });

export default quadruped({
  name: 'blackcat',
  scale: 1.5,
  hip: 0.1,
  len: 0.1,
  girth: [0.045, 0.045],
  stance: 0.038,
  leg: [0.02, 0.016, 0.014],
  neck: { len: 0.04, rise: 0.9, r: 0.032 },
  head: { r: 0.042, snout: 0.016, sr: 0.019, drop: 0.12 },
  tail: { len: 0.16, rise: 1.1, r: 0.013, tip: 0.01, curl: 0.9 },
  ears: { kind: 'prick', size: 1.15 },
  paint: { body: FUR, head: FUR, snout: FUR, legs: FUR, feet: '#0c0a10', tail: FUR, ears: '#16141a', nose: '#3a2a30', eye: '#9aff3a' },
  style: { rate: 17, wag: 0.3, lift: 1.0 },
});
