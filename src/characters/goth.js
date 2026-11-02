import { cloth, hold, onBody, person, strap } from './person.js';
import { bigHair } from './metalwear.js';

/**
 * The Goth: hair backcombed to the ceiling and dyed the black of a cupboard,
 * a face the white of one that has never seen the sun, eyes ringed in black,
 * lips the dark red of a very old wine, a lace-sleeved frock coat, a skirt of
 * black tulle, fishnets, boots on platforms, an ankh and six more necklaces,
 * and a rose he is carrying for a reason. Brooding, allegedly. About 1.0
 * tiles tall with the hair.
 */

const LACE = (p, n) => {
  const base = cloth('#14101a', '#0a080e')(p, n);
  return Math.sin(p[0] * 220) * Math.sin(p[1] * 220) > 0.5 ? [0.2, 0.14, 0.24] : base;
};

/** Fishnet tights: a dark net over the skin. */
const FISHNET = (p) => {
  const f = (x) => Math.abs(x - Math.round(x));
  return f((p[1] + p[0] * 0.8 + p[2] * 0.8) * 70) < 0.14 || f((p[1] - p[0] * 0.8 - p[2] * 0.8) * 70) < 0.14 ? [0.02, 0.016, 0.024] : [0.82, 0.74, 0.74];
};

export default person({
  name: 'goth',
  budget: 62700,
  scale: 1.5,
  b: 0.98,
  shape: { legs: 1.1, girth: 0.88, head: 1.0 },
  skin: '#f0eaf0',
  look: { torso: cloth('#14101a', '#0a080e'), sleeve: LACE, cuff: LACE, legs: cloth('#14101a'), shin: FISHNET, skirt: { top: 0.37, hem: 0.235, flare: 1.32 }, boot: '#0a080e', sole: '#2a2630', boots: 0.14 },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#6a2a8a', brow: '#0a080e', mood: 1, blush: 0 },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Brooding: the head tilted, one hand to the brow, the other holding out a rose; a very slow sway.
      k.turn('hips', 0, Math.sin(T * 0.5) * 0.06, Math.sin(T * 0.5) * 0.03);
      hold(k, 'armL', -1.6, 0.3, 0.3); hold(k, 'foreL', -1.9, 0, 0);
      hold(k, 'armR', -0.6, 0, -0.3); hold(k, 'foreR', -0.6, 0, 0);
      k.turn('head', 0.18, Math.sin(T * 0.4) * 0.3, 0.22);
    },
  },
  extras(s, J, { pose }) {
    bigHair(s, '#0c0a12', { size: 1.32, drop: 0.14 });
    // Heavy dark rings round the eyes, and the dark lips: painted on.
    for (const m of [1, -1]) s.paint((p) => Math.max(Math.abs(Math.hypot((p[0] - m * 0.041) / 1.1, p[1] - 0.669) - 0.03) - 0.006, 0.07 - p[2]), '#0a080e', 0.003);
    s.paint((p) => Math.max(Math.hypot(p[0] / 1.5, (p[1] - 0.609) * 1.4) - 0.013, 0.08 - p[2]), '#4a0820', 0.002);
    // Silver necklaces, three of them, and an ankh on the longest.
    for (const d of [0, 0.022, 0.044]) {
      strap(s, [[0, 0.556, -0.04], [0.036, 0.553, -0.03], [0.05 + d * 0.3, 0.52 - d, 0.035], [0, 0.5 - d * 1.6, 0.08], [-0.05 - d * 0.3, 0.52 - d, 0.035], [-0.036, 0.553, -0.03]],
        { closed: true, round: true, thick: 0.0028, color: '#c8ccd4', mat: 'metal', over: ['top', 'head'] });
    }
    const at = onBody(s, [0, 0.428, 0.09], ['top']);
    s.part('kit', () => {
      const c = at.p.map((v, i) => v + at.n[i] * 0.003);
      s.torus(c.map((v, i) => v + [0, 0.017, 0][i]), 0.0085, 0.0025, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.0008, rot: [Math.PI / 2, 0, 0] });
      s.box(c.map((v, i) => v + [0, -0.004, 0][i]), [0.0025, 0.013, 0.0025], 0.001, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.0005 });
      s.box(c.map((v, i) => v + [0, 0.006, 0][i]), [0.011, 0.0025, 0.0025], 0.001, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.0005 });
    });
    // The rose, held out in the right hand: a green stem through the fist, a red bloom past the thumb.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.03), G.at(0.09), 0.0028, 0.0028, { color: '#2a6a3a', mat: 'cloth', k: 0.001 });
      s.ellipsoid(G.at(0.1), [0.013, 0.013, 0.013], { color: '#a0102a', mat: 'cloth', k: 0.004, bump: [0.002, 160] });
      s.flake(G.at(0.04), G.at(0.04, 0, 0.022), G.up, 0.004, 0.006, 0.3, { color: '#2a6a3a', mat: 'cloth', k: 0.001 });
    }));
  },
});
