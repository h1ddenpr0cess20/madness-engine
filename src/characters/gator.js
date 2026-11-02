import { coat, mix, smooth } from '../models/skins.js';
import { rgb } from '../models/sdf.js';
import { quadruped } from './quadruped.js';
import { crocodilian, scaly, scutes } from './croc.js';

/**
 * The Gator: up out of the swamp and onto the boardwalk, long and low and
 * armoured, near black above with faint yellow bands and pale underneath,
 * rows of scutes down the back and a crest down the tail, and the broad
 * round-ended snout of an alligator, the top teeth down outside the bottom
 * jaw and the bottom ones hidden. Has been around since the dinosaurs, and
 * has outlasted the music. About 0.25 tiles tall and 1.2 long.
 */

const HIDE = scaly((() => {
  const base = coat({ over: '#262a1c', under: '#cfc6a0', vary: 0.12, freq: 16, edge: [-0.5, 0.1] });
  return (p, n) => {
    const c = base(p, n);
    const band = smooth(0.72, 0.8, Math.sin(p[2] * 46) * 0.5 + 0.5) * smooth(0, 0.5, n[1]) * smooth(-0.02, -0.2, p[2]);
    return mix(c, rgb('#5a5a2a'), band * 0.5);
  };
})(), 0.014);

export default quadruped({
  name: 'gator',
  scale: 1.6,
  cell: 0.0055,
  budget: 30000,
  hip: 0.07,
  len: 0.2,
  girth: [0.09, 0.052],
  stance: 0.078,
  leg: [0.026, 0.019, 0.017],
  neck: { len: 0.05, rise: 0, r: 0.058 },
  head: { r: 0.052, snout: 0.14, sr: 0.03, drop: 0.03 },
  tail: { len: 0.4, rise: -0.1, r: 0.052, tip: 0.008, curl: 0.04 },
  feet: 'claw',
  sculptHead: false,
  cells: { teeth: 0.0014, eyes: 0.0012 },
  paint: { body: HIDE, feet: HIDE },
  mats: { body: 'scale', legs: 'scale', tail: 'scale', feet: 'scale' },
  style: { gait: 'sprawl', rate: 6, wag: 0.5, after(k, { clip, t }) {
    if (clip === 'attack') k.turn('jaw', 0.5 * Math.max(0, Math.sin(Math.min(1, t / 0.7) * Math.PI * 2)), 0, 0);
    else if (clip === 'idle') k.turn('jaw', 0.03, 0, 0);
  } },
  extras(s, P) {
    const H = { color: HIDE, mat: 'scale' };
    crocodilian(s, P, { H, snout: [0.047, 0.03], teeth: 'over', eye: '#a8b020', flat: 0.38 });
    s.ellipsoid([0, 0.09, 0], [0.074, 0.032, 0.2], { ...H, bone: 'trunk', k: 0.04, bump: [0.003, 70] });
    scutes(s, P, H, { rows: 4 });
  },
});
