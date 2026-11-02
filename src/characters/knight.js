import { cloth, hold, person, shell } from './person.js';

/**
 * The Knight: head to foot in plate, a helm with a slit in it and a plume
 * that has had a rough night, a surcoat in red and white, a longsword
 * held point-up in a gauntlet, and a clank at every step. Came from
 * a re-enactment society in the next field. Cannot see out of the helm.
 * Cannot hear. Cannot be reasoned with, and has not been asked. About
 * 1.05 tiles tall.
 */

const STEEL = cloth('#a8aeb8', '#7a808a');

export default person({
  name: 'knight',
  scale: 1.56,
  b: 1.08,
  shape: { legs: 1.0, torso: 1.12, girth: 1.14 },
  skin: '#b8bcc4',
  look: { torso: cloth('#e8e4e0', '#c0bcb8'), sleeve: STEEL, cuff: '#8a909a', hand: '#8a909a', legs: STEEL, boot: '#8a909a', sole: '#2a2a30', boots: true },
  mats: { torso: 'cloth', sleeve: 'metal', cuff: 'metal', hand: 'metal', legs: 'metal', boot: 'metal' },
  face: { eyeColor: '#2a2a30', brow: '#2a2a30', mood: 0 },
  style: {
    attack: 'slash',
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The sword held up before him, point to the sky; the left fist on the hip; a stiff turn of the helm.
      hold(k, 'armR', -0.55, 0, -0.3); hold(k, 'foreR', -1.35, 0, 0);
      aim?.(k, 'R', 'chest', [-0.17, 1.5, 0.3]);
      hold(k, 'armL', 0.2, 0, 0.7); hold(k, 'foreL', -1.4, 0, 0);
      k.turn('head', 0, Math.round(Math.sin(T * 0.5) * 2) * 0.2, 0);
    },
  },
  extras(s, J, { pose }) {
    const M = { color: '#b4bac4', mat: 'metal' };
    // The great helm: a steel barrel round the whole head, its crown domed, a keel down the face; the sight slits
    // either side of the keel, breaths pierced low on the right, a brass cross on the front.
    s.part('outer', () => {
      s.shape((p) => {
        const x = p[0] / 0.122, z = (p[2] - 0.006) / 0.132, top = 0.738;
        if (p[1] > top) return (Math.hypot(x, (p[1] - top) / 0.08, z) - 1) * 0.11;
        return Math.max((Math.hypot(x, z) - 1) * 0.12, 0.576 - p[1]);
      }, [[-0.14, 0.56, -0.14], [0.14, 0.83, 0.15]], { ...M, bone: 'head', k: 0.004 });
      s.limb([0, 0.792, 0.104], [0, 0.585, 0.138], 0.006, 0.0065, { ...M, bone: 'head', k: 0.006 });
      // A rim round the foot of it.
      s.torus([0, 0.582, 0.006], 0.124, 0.005, { ...M, color: '#9aa0aa', bone: 'head', k: 0.003 });
    });
    s.paint((p) => Math.max(Math.abs(p[1] - 0.678) - 0.0055, Math.abs(Math.abs(p[0]) - 0.052) - 0.04, 0.07 - p[2]), '#060608', 0.001);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const c = [-0.03 - i * 0.017, 0.635 - j * 0.017];
      s.paint((p) => Math.max(Math.hypot(p[0] - c[0], p[1] - c[1]) - 0.0042, 0.07 - p[2]), '#060608', 0.0008);
    }
    s.paint((p) => Math.max(Math.min(Math.max(Math.abs(p[0]) - 0.008, Math.abs(p[1] - 0.69) - 0.1), Math.max(Math.abs(p[1] - 0.708) - 0.008, Math.abs(p[0]) - 0.1)), 0.055 - p[2], p[1] > 0.67 && p[1] < 0.686 ? 1 : -1), '#c8a040', 0.001);
    // The plume: a fan of red and white feathers out of a brass socket on the crown, arching back.
    s.part('kit', () => {
      s.cylinder([0, 0.812, -0.012], 0.011, 0.012, { color: '#c8a040', mat: 'metal', bone: 'head', k: 0.002 });
      for (let i = 0; i < 9; i++) {
        const a = (i - 4) * 0.11, sx = Math.sin(a), c = i % 3 === 1 ? '#f2eee6' : '#c8141e', d = 1 - Math.abs(i - 4) * 0.025;
        const pts = [[0, 0.822, -0.008], [sx * 0.03, 0.872 * d, -0.04], [sx * 0.05, 0.885 * d, -0.09], [sx * 0.065, 0.855 * d, -0.14], [sx * 0.07, 0.805 * d, -0.168], [sx * 0.066, 0.75 * d, -0.176]];
        const r = [0.008, 0.016, 0.02, 0.017, 0.012, 0.005];
        for (let j = 0; j < 5; j++) s.limb(pts[j], pts[j + 1], r[j], r[j + 1], { color: c, mat: 'cloth', bone: 'head', k: 0.01, bump: [0.0025, 160] });
      }
    });
    // The white tabard and its red cross.
    s.paint((p) => Math.max(Math.min(Math.max(Math.abs(p[0]) - 0.013, Math.abs(p[1] - 0.43) - 0.075), Math.max(Math.abs(p[1] - 0.46) - 0.013, Math.abs(p[0]) - 0.05)), 0.03 - p[2], p[1] - 0.52), '#c8141e', 0.0015);
    // Pauldrons: steel over the points of the shoulders, in two lames.
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R', sh = J[`shoulder${S}`];
      shell(s, (p) => Math.max(Math.hypot(p[0] - sh[0], p[1] - sh[1] - 0.015, p[2] * 0.9) - 0.06, sh[1] - 0.045 - p[1], (sh[0] - 0.02 - p[0]) * m),
        { ...M, part: 'outer', thick: 0.009, lift: 0.002, over: ['top', 'sleeves'], bone: `arm${S}`, k: 0.003 });
      s.paint((p) => Math.max(Math.abs(Math.hypot(p[0] - sh[0], p[1] - sh[1] - 0.015, p[2] * 0.9) - 0.035) - 0.002, sh[1] - 0.04 - p[1], (sh[0] - 0.02 - p[0]) * m), '#7a808a', 0.001);
    }
    // The sword in the right fist: the grip in it, the pommel below, the cross-guard across the line of the edges,
    // and the long straight blade tapering to its point.
    const G = pose.grip('R'), up = G.up, out = G.out, al = G.along;
    const blade = (p) => {
      const v = p.map((x, i) => x - G.c[i]), t = v[0] * al[0] + v[1] * al[1] + v[2] * al[2];
      const u = v[0] * up[0] + v[1] * up[1] + v[2] * up[2], o = v[0] * out[0] + v[1] * out[1] + v[2] * out[2];
      const w = 0.017 * Math.min(1, Math.max(0, (0.6 - t) / 0.09));
      return Math.max(Math.abs(u) - w, Math.abs(o) + Math.abs(u) * 0.12 - 0.0042 * Math.sqrt(w / 0.017 + 0.05), 0.066 - t, t - 0.6);
    };
    const ends = [G.at(0.06, 0.03, 0.01), G.at(0.06, -0.03, -0.01), G.at(0.61, 0.03, 0.01), G.at(0.61, -0.03, -0.01)];
    const box = [[0, 1, 2].map((i) => Math.min(...ends.map((e) => e[i])) - 0.02), [0, 1, 2].map((i) => Math.max(...ends.map((e) => e[i])) + 0.02)];
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.05), G.at(0.05), 0.0095, 0.0095, { color: '#3a2414', mat: 'leather', k: 0.002 });
      s.sphere(G.at(-0.065), 0.015, { color: '#c8a040', mat: 'metal', k: 0.003 });
      s.limb(G.at(0.058, -0.07), G.at(0.058, 0.07), 0.0065, 0.0065, { color: '#c8a040', mat: 'metal', k: 0.003 });
      for (const e of [-0.072, 0.072]) s.sphere(G.at(0.058, e), 0.009, { color: '#c8a040', mat: 'metal', k: 0.003 });
    }));
    pose.hold(s, 'handR', () => s.part('fine', () => s.shape(blade, box, { color: '#dce0e8', mat: 'metal', k: 0.003 })));
  },
});
