import { cloth, hold, onBody, person, strap } from './person.js';

/**
 * The Capoeirista: from the roda on the beach at Ipanema, bare to the
 * waist, in the white abadá trousers and the coloured cord of his grade
 * knotted at the hip, the ginga swaying side to side, low, the arms
 * guarding the face, and then out of nowhere a cartwheel or a kick round
 * over his own head. Is it a dance? Is it a fight? It is a kick. At you.
 * About 0.95 tiles tall.
 */

const SKIN = '#8a5a3a';

export default person({
  name: 'capoeira',
  scale: 1.45,
  b: 1.02,
  shape: { legs: 1.08, girth: 0.94 },
  skin: SKIN,
  look: { torso: SKIN, sleeve: SKIN, cuff: SKIN, legs: cloth('#f6f4f0', '#d8d4cc'), boot: SKIN },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', boot: 'skin' },
  face: { eyeColor: '#2a1a0a', brow: '#0a0806', jaw: 1.04, mood: 1 },
  hair: { color: cloth('#0a0806', '#050403'), cap: [0.104, 0.075, 0.104] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, t, time, seed }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      if (clip === 'attack') {
        // Meia lua: the leg round in a half moon at head height.
        const a = Math.min(1, t / 0.8), p = Math.sin(a * Math.PI);
        hold(k, 'thighR', -0.3 * p, 0, -1.6 * p);
        hold(k, 'shinR', 0, 0, 0);
        k.turn('hips', 0, (a - 0.5) * 2.5, 0.3 * p);
        k.turn('spine', 0, 0, 0.4 * p);
        return;
      }
      // The ginga: stepping back side to side, low, the opposite arm across the face.
      const g = Math.sin(T * 3);
      k.move('hips', 0, -0.04, 0);
      hold(k, 'thighL', -0.4 + Math.max(0, g) * 0.6, 0, 0.15); hold(k, 'shinL', 0.6, 0, 0);
      hold(k, 'thighR', -0.4 + Math.max(0, -g) * 0.6, 0, -0.15); hold(k, 'shinR', 0.6, 0, 0);
      k.turn('spine', 0.2, g * 0.3, 0);
      hold(k, 'armL', -1.0 - Math.max(0, -g) * 0.6, 0, 0.3);
      hold(k, 'foreL', -1.2, 0, 0);
      hold(k, 'armR', -1.0 - Math.max(0, g) * 0.6, 0, -0.3);
      hold(k, 'foreR', -1.2, 0, 0);
    },
  },
  extras(s) {
    // Muscle: the pecs, melted into the bare chest.
    s.part('body', () => { for (const m of [1, -1]) s.ellipsoid([m * 0.04, 0.47, 0.052], [0.04, 0.028, 0.022], { color: SKIN, mat: 'skin', bone: 'chest', k: 0.03 }); });
    // The cord of his grade, round the waistband of the abadá, knotted at the left hip, its two ends hanging.
    strap(s, [[0, 0.352, 0.085], [0.07, 0.352, 0.06], [0.09, 0.352, 0], [0.05, 0.352, -0.07], [-0.05, 0.352, -0.07], [-0.09, 0.352, 0], [-0.07, 0.352, 0.06]], { round: true, closed: true, thick: 0.0075, lift: 0.0005, color: '#2a8a3a', mat: 'cloth', over: ['bottoms'] });
    const knot = onBody(s, [0.078, 0.35, 0.05], ['bottoms']);
    s.part('kit', () => {
      const c = knot.p.map((v, i) => v + knot.n[i] * 0.01);
      s.sphere(c, 0.011, { color: '#f0c020', mat: 'cloth', bone: 'hips', k: 0.002 });
      for (const [dx, col] of [[-0.006, '#2a8a3a'], [0.008, '#f0c020']]) s.limb(c, [c[0] + dx + 0.008, c[1] - 0.09, c[2] + 0.008], 0.0055, 0.0045, { color: col, mat: 'cloth', bone: 'hips', k: 0.002 });
    });
  },
});
