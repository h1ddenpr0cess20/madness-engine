import { bag, cloth, person, plate } from './person.js';

/**
 * The Make-up Artist: black from head to foot, a tool belt of brushes, a
 * powder puff in one hand and a brush in the other, a bun skewered with a
 * pencil. You are shiny. Hold still. About 0.85 tiles tall.
 */

const black = cloth('#1a1a20', '#0a0a0e');

export default person({
  name: 'makeup',
  scale: 1.36,
  b: 0.94,
  shape: { legs: 1.08, girth: 0.86, head: 1.02 },
  skin: '#e8b898',
  look: { torso: black, sleeve: black, cuff: black, legs: black, boot: '#0a0a0c', belt: '#3a2a1a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a5a2a', brow: '#3a1a0a', blush: 0.6 },
  hair: { color: cloth('#8a2a1a', '#5a1a0e'), cap: [0.106, 0.098, 0.106], locks: [] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The brush up and flicking, ready for the next face; the palette open in the other hand, held to the light.
      k.turn('armR', -0.75 + Math.sin(T * 5) * 0.08, 0, -0.15);
      k.turn('foreR', -1.25, 0, 0);
      aim?.(k, 'R', 'chest', [-0.12 + Math.sin(T * 5) * 0.03, 1.2, 0.5]);
      k.turn('armL', -0.45, 0, 0.25);
      k.turn('foreL', -1.35, 0, 0);
      k.turn('head', 0.1, Math.sin(T * 0.8) * 0.2, 0.1);
    },
  },
  extras(s, J, { pose }) {
    s.part('hair', () => {
      // The bun, and two pencils through it.
      s.sphere([0, 0.79, -0.06], 0.045, { color: cloth('#8a2a1a', '#5a1a0e'), mat: 'hair', bone: 'head', k: 0.012 });
    });
    s.part('kit', () => {
      s.limb([-0.055, 0.81, -0.075], [0.065, 0.795, -0.045], 0.0035, 0.0028, { color: '#f0c020', mat: 'paper', bone: 'head', k: 0.001 });
      s.limb([-0.05, 0.775, -0.04], [0.06, 0.82, -0.08], 0.0035, 0.0028, { color: '#16161a', mat: 'paper', bone: 'head', k: 0.001 });
    });
    // The brush roll on the belt: a pouch on the right hip, three handles up out of it.
    const pouch = bag(s, [-0.1, 0.32, 0.04], { size: [0.028, 0.03, 0.011], color: '#2a2a30', flap: false, over: ['bottoms', 'top', 'belt'], bone: 'hips' });
    s.part('kit', () => {
      [['#c8a050', -1], ['#16161a', 0], ['#e85a8a', 1]].forEach(([c, i]) => {
        const a = pouch.c.map((v, j) => v + pouch.up[j] * 0.02 + pouch.across[j] * i * 0.014), b = a.map((v, j) => v + pouch.up[j] * 0.045 + pouch.across[j] * i * 0.006);
        s.limb(a, b, 0.0035, 0.0035, { color: c, mat: 'plastic', bone: 'hips', k: 0.001 });
        s.limb(b, b.map((v, j) => v + pouch.up[j] * 0.014), 0.0045, 0.006, { color: '#3a2a1e', mat: 'hair', bone: 'hips', k: 0.002 });
      });
    });
    // The powder brush in the right fist: the black handle, the silver ferrule, the soft domed head.
    const R = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(R.at(-0.05), R.at(0.07), 0.0055, 0.0068, { color: '#16161a', mat: 'plastic', k: 0.002 });
      s.limb(R.at(0.07), R.at(0.1), 0.0072, 0.0095, { color: '#d8dce4', mat: 'metal', k: 0.001 });
      s.limb(R.at(0.1), R.at(0.135), 0.0105, 0.016, { color: '#c8906a', mat: 'hair', k: 0.004 });
      s.sphere(R.at(0.138), 0.0165, { color: '#e8b498', mat: 'hair', k: 0.006 });
    }));
    // The palette in the left: a black case open flat, held by its edge, its pans of colour in rows.
    const L = pose.grip('L'), c = L.at(0, 0, -0.05);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      plate(s, c, L.along, L.out, [0.05, 0.045, 0.004], 0.003, { color: '#141418', mat: 'plastic', k: 0.002 });
      const n = [L.along[1] * L.out[2] - L.along[2] * L.out[1], L.along[2] * L.out[0] - L.along[0] * L.out[2], L.along[0] * L.out[1] - L.along[1] * L.out[0]];
      const pans = ['#e85a8a', '#c8906a', '#8a4a7a', '#f0c8a8', '#5a3a2a', '#d8a040'];
      pans.forEach((col, i) => {
        const q = c.map((v, j) => v + L.along[j] * (-0.028 + (i % 3) * 0.028) + L.out[j] * (-0.016 + Math.floor(i / 3) * 0.03));
        for (const sgn of [1, -1]) plate(s, q.map((v, j) => v + n[j] * sgn * 0.004), L.along, L.out, [0.011, 0.011, 0.0012], 0.0012, { color: col, mat: 'plastic', k: 0.0005 });
      });
    }));
  },
});
