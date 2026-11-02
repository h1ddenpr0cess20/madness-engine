import { coat } from '../models/skins.js';
import { axisRot, bag, cloth, hold, onBody, person, plate, shell, strap } from './person.js';

/**
 * The Superfan: has been to every show of the tour, front row, and is
 * here for the last one, a giant in the tour T-shirt with all the dates
 * down the back, a bucket hat covered in badges, the band's scarf, a
 * backstage pass he did not get backstage with on every lanyard, the face
 * painted, a foam finger the size of a door, and on his arm a tattoo of
 * Rock's face (it is not Rock's face). Moves on the beat, like you taught
 * him. The last boss: about 2.8 tiles tall.
 */

/** The tour shirt: black, a big yellow star on the front, the dates in rows down the back. */
const SHIRT = (p, n) => {
  const c = cloth('#16161c', '#0a0a0e')(p, n);
  if (p[2] > 0.05 && Math.hypot(p[0], p[1] - 0.44) < 0.045 && Math.cos(Math.atan2(p[0], p[1] - 0.44) * 5) > -0.2) return [0.97, 0.78, 0.1];
  if (p[2] < -0.04 && Math.abs(p[0]) < 0.06 && p[1] > 0.36 && p[1] < 0.5 && Math.sin(p[1] * 180) > 0.4) return [0.9, 0.88, 0.85];
  return c;
};
const DENIM = coat({ over: '#3a5a8a', under: '#24406a', vary: 0.14, freq: 20 });
const SCARF = (p) => (Math.floor((p[0] + p[1] * 3) * 40) % 2 ? [0.94, 0.75, 0.12] : [0.09, 0.09, 0.11]);
const BADGES = ['#d8141e', '#f0c020', '#1a8ad8', '#2aa04a', '#f4f2ec', '#ff6ad8'];

export default person({
  name: 'superfan',
  scale: 2.9,
  b: 1.6,
  skin: '#f0c0a0',
  shape: { legs: 0.9, torso: 1.06, head: 1.08, girth: 1.4, hips: 1.25 },
  belly: 1.8,
  look: { torso: SHIRT, sleeve: SHIRT, cuff: '#f0c0a0', legs: DENIM, boot: '#f4f2ec', sole: '#d8141e' },
  mats: { cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#3a5a8a', brow: '#6a4a2a', jaw: 1.2, blush: 1.1 },
  hair: { color: cloth('#6a4a2a', '#4a3018'), locks: [[[0.09, 0.68, -0.04], [0.12, 0.56, -0.06], 0.035], [[-0.09, 0.68, -0.04], [-0.12, 0.56, -0.06], 0.035], [[0, 0.66, -0.1], [0, 0.5, -0.12], 0.045]] },
  style: {
    attack: 'smite', heavy: 1, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, beat = Math.abs(Math.sin(T * Math.PI * 2.2)) ** 2;
      // Head-banging on the beat, the foam finger up and pumping, the other fist with it.
      k.turn('head', 0.35 * beat - 0.1, 0, 0);
      k.turn('chest', 0.12 * beat, 0, 0);
      hold(k, 'armR', -2.6 + beat * 0.3, 0, -0.25);
      hold(k, 'foreR', -0.2, 0, 0);
      hold(k, 'handR', 0, 0, 0);
      hold(k, 'armL', -2.2 + beat * 0.4, 0, 0.35);
      hold(k, 'foreL', -0.6, 0, 0);
      if (clip === 'idle') k.move('root', 0, beat * 0.01, 0);
    },
  },
  extras(s, J, { pose }) {
    // The bucket hat: the crown over the hair, the soft brim round it sloping down, badges pinned round the crown.
    shell(s, (p) => 0.71 - p[1], { color: '#e8dcc0', mat: 'cloth', part: 'outer', thick: 0.008, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.004 });
    s.part('outer2', () => s.shape((p) => {
      const r = Math.hypot(p[0], p[2] + 0.004), y = 0.713 - Math.max(0, r - 0.1) * 0.4;
      return Math.max(Math.abs(p[1] - y) * 0.93 - 0.0035, r - 0.158, 0.098 - r);
    }, [[-0.17, 0.68, -0.17], [0.17, 0.73, 0.17]], { color: '#e8dcc0', mat: 'cloth', bone: 'head', k: 0.003 }));
    const pins = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; pins.push([Math.sin(a) * 0.12, 0.745, Math.cos(a) * 0.12]); }
    onBody(s, pins, ['outer']).forEach((h, i) => s.part('kit', () => s.cylinder(h.p.map((v, j) => v + h.n[j] * 0.002), 0.014, 0.0028, { color: BADGES[i % 6], mat: 'plastic', bone: 'head', k: 0.001, rot: axisRot(h.n) })));
    // Face paint: a stripe of the tour's yellow on each cheek.
    for (const m of [1, -1]) s.paint((p) => Math.max(Math.abs(p[1] - 0.632 - (p[0] * m - 0.055) * 0.35) - 0.0055, Math.abs(p[0] * m - 0.06) - 0.022, 0.04 - p[2]), '#f0c020', 0.0015);
    // The scarf, yellow and black, round the neck, its ends down the front.
    strap(s, [[0, 0.545, 0.075], [0.055, 0.548, 0.045], [0.07, 0.552, -0.01], [0.045, 0.555, -0.065], [0, 0.556, -0.075], [-0.045, 0.555, -0.065], [-0.07, 0.552, -0.01], [-0.055, 0.548, 0.045], [0, 0.545, 0.075]], { width: 0.03, thick: 0.014, color: SCARF, mat: 'cloth', over: ['top', 'head'], part: 'outer2', bone: 'chest', closed: true });
    for (const m of [1, -1]) shell(s, (p) => Math.max(Math.abs(p[0] - m * 0.04) - 0.017, p[1] - 0.535, 0.37 - p[1], 0.03 - p[2]), { color: SCARF, mat: 'cloth', part: 'outer', thick: 0.006, lift: 0.002, over: ['top'], bone: 'chest', k: 0.003 });
    // Lanyards, and a pass on each.
    [[-0.03, '#d8141e', 0.43], [0.0, '#1a8ad8', 0.41], [0.03, '#2aa04a', 0.39]].forEach(([dx, c, y]) => {
      strap(s, [[0, 0.552, -0.06], [0.05, 0.545, -0.03], [0.056, 0.53, 0.03], [dx + 0.01, y + 0.02, 0.1], [dx, y, 0.11]], { width: 0.005, thick: 0.002, color: c, mat: 'cloth', over: ['top', 'outer', 'head'], bone: 'chest' });
      bag(s, [dx, y - 0.02, 0.11], { size: [0.015, 0.02, 0.0018], color: '#f4f2ec', flap: false, over: ['top', 'outer'], bone: 'chest' });
    });
    // The foam finger: a huge yellow foam hand over his fist, the index finger up, NO 1 across the palm.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      const F = { color: '#f0c020', mat: 'plastic', k: 0.008 };
      plate(s, G.at(0, -0.035, 0), G.along, G.up, [0.05, 0.065, 0.026], 0.02, F);
      s.limb(G.at(0.025, -0.1), G.at(0.025, -0.25), 0.02, 0.018, F);
      for (const t of [0.0, -0.025]) s.limb(G.at(t - 0.005, -0.1, 0.008), G.at(t - 0.005, -0.08, 0.03), 0.014, 0.013, F);
      s.limb(G.at(0.05, -0.04), G.at(0.075, -0.075), 0.014, 0.012, F);
      s.limb(G.at(0, 0.03), G.at(0, 0.05), 0.04, 0.04, { ...F, color: '#16161c' });
    }));
  },
});
