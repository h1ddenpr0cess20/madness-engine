import { cloth, hold, onBody, person, skirt, strap, trunk } from './person.js';

/**
 * The Flamenco Dancer: out of a tablao in Seville, in the traje de
 * flamenca: red with white spots, tight to the hips and then flaring in
 * three tiers of ruffles to the floor, a fringed black shawl round the
 * shoulders, the hair back in a bun with a big red rose in it and a comb
 * standing up behind, castanets in both hands, the arms curving up over
 * the head. Stamps. Clicks. Stares. Stamps. About 1.0 tiles tall.
 */

/** Red, with white spots. */
const SPOTS = (p, n) => {
  const u = p[0] * 22, v = p[1] * 22, w = p[2] * 22;
  const d = Math.hypot(u - Math.round(u), v - Math.round(v), w - Math.round(w));
  return d < 0.3 ? [0.95, 0.93, 0.9] : cloth('#c8141e', '#8a0a14')(p, n);
};

export default person({
  name: 'flamenco',
  scale: 1.46,
  b: 0.92,
  shape: { legs: 1.06, girth: 0.86, hips: 1.0 },
  skin: '#e0a880',
  look: { torso: SPOTS, sleeve: SPOTS, cuff: '#e0a880', legs: SPOTS, shin: '#e0a880', skirt: { top: 0.38, hem: 0.03, flare: 1.42 }, boot: '#14100a', sole: '#0a0806' },
  mats: { cuff: 'skin', boot: 'leather' },
  face: { eyeColor: '#2a1a0a', brow: '#14100a', mood: 1, jaw: 0.9 },
  hair: { color: cloth('#14100a', '#0a0806'), cap: [0.104, 0.092, 0.104], front: 0.06 },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The arms up and curving over the head, the wrists turning; the heels stamping.
      hold(k, 'armL', -0.3, 0, 2.5 + Math.sin(T * 2) * 0.1);
      hold(k, 'foreL', 0, 0, 0.9);
      hold(k, 'handL', 0, Math.sin(T * 4) * 0.8, 0);
      hold(k, 'armR', -0.3, 0, -2.5 + Math.sin(T * 2) * 0.1);
      hold(k, 'foreR', 0, 0, -0.9);
      hold(k, 'handR', 0, -Math.sin(T * 4) * 0.8, 0);
      if (clip === 'idle') {
        const stamp = Math.max(0, Math.sin(T * 8));
        k.turn(Math.sin(T * 2) > 0 ? 'thighL' : 'thighR', -0.3 * stamp, 0, 0);
        k.turn('head', -0.1, Math.sin(T * 0.5) * 0.3, 0);
      }
    },
  },
  extras(s, J, { pose }) {
    const at = trunk(0.92, 0);
    // The skirt's ruffles: two tiers of them over its lower half, each wider than the one above, flouncing.
    skirt(s, at, { top: 0.2, hem: 0.1, flare: 1.42, color: SPOTS, part: 'outer', b: 0.92, bump: [0.004, 42] });
    skirt(s, at, { top: 0.11, hem: 0.022, flare: 1.62, color: SPOTS, part: 'outer2', b: 0.92, bump: [0.005, 36] });
    // The shawl: black, round the shoulders and knotted at the breast, its fringe hanging from its edge.
    const shawl = strap(s, [[0, 0.552, -0.07], [0.07, 0.555, -0.045], [0.105, 0.52, 0.0], [0.07, 0.49, 0.06], [0, 0.465, 0.08], [-0.07, 0.49, 0.06], [-0.105, 0.52, 0.0], [-0.07, 0.555, -0.045]],
      { closed: true, width: 0.042, thick: 0.005, color: '#14100a', mat: 'cloth', over: ['top', 'sleeves', 'head'] });
    s.part('kit', () => {
      for (let i = 0; i < shawl.length; i += 2) {
        const { p, n } = shawl[i];
        if (p[1] > 0.51) continue;
        s.limb(p.map((v, j) => v - [0, 0.018, 0][j] + n[j] * 0.003), p.map((v, j) => v - [0, 0.055, 0][j] + n[j] * 0.006), 0.0022, 0.0015, { color: '#14100a', mat: 'cloth', bone: 'chest', k: 0.0008 });
      }
    });
    // The hair slicked back into a bun, the comb standing up behind it, a red rose at the side.
    s.part('hair', () => s.sphere([0, 0.69, -0.105], 0.038, { color: cloth('#14100a', '#0a0806'), mat: 'hair', bone: 'head', k: 0.02 }));
    s.part('kit', () => s.flake([0, 0.705, -0.135], [0, 0.82, -0.125], [0, 0, 1], 0.048, 0.03, 0.14, { color: '#3a2010', mat: 'plastic', bone: 'head', k: 0.004 }));
    const rose = onBody(s, [0.085, 0.73, -0.02], ['hair', 'head']);
    s.part('kit', () => s.sphere(rose.p.map((v, i) => v + rose.n[i] * 0.016), 0.022, { color: '#e8141e', mat: 'cloth', bone: 'head', k: 0.006, bump: [0.004, 90] }));
    // Castanets: a pair of shells in each hand, clacking.
    for (const S of ['L', 'R']) {
      const G = pose.grip(S);
      pose.hold(s, `hand${S}`, () => s.part('kit', () => {
        for (const o of [-0.004, 0.004]) s.ellipsoid(G.at(0.008, 0, -0.016 + o), [0.016, 0.016, 0.0055], { color: '#3a1a0a', mat: 'plastic', k: 0.001 });
      }));
    }
  },
});
