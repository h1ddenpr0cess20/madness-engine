import { rotation } from '../models/sdf.js';
import { bands } from '../models/skins.js';
import { cloth, person } from './person.js';
import { moustache } from './wardrobe.js';

/**
 * The Souvenir Seller: a sky-blue galabeya to the ankles with wide sleeves,
 * a white turban, pointed yellow slippers, a moustache and a smile, and a
 * tray on a strap round his neck heaped with gold pyramids, blue scarabs
 * and rolls of papyrus. One pyramid he holds up at you, with a keyring on
 * it. Very good price. For you, special price. About 0.9 tiles tall, and
 * wiry.
 */

const stripe = bands(0, 0.024, '#5e9ad2', '#3c72aa', 0.28, 0.3);
const robe = (p, n) => {
  const k = 0.8 + Math.max(0, n[1]) * 0.25;
  return stripe(p).map((v) => v * k);
};
const GOLD = { color: '#e8b440', mat: 'metal' };
const SAND = { color: '#d8b070', mat: 'plastic' };

/** A little square pyramid, its base `half` across either way and `h` tall, sat on `at` and turned by `rot`. */
function pyramid(s, at, half, h, o) {
  const R = o.rot ? rotation(o.rot) : null, l = Math.hypot(h, half), m = Math.max(half, h) * 1.5;
  s.shape((p) => {
    let q = [p[0] - at[0], p[1] - at[1], p[2] - at[2]];
    if (R) q = [0, 1, 2].map((i) => R[0][i] * q[0] + R[1][i] * q[1] + R[2][i] * q[2]);
    const x = Math.abs(q[0]), y = q[1], z = Math.abs(q[2]);
    return Math.max(-y, (Math.max(x, z) * h + y * half - half * h) / l);
  }, [at.map((v) => v - m), at.map((v) => v + m)], o);
}

export default person({
  name: 'hawker',
  scale: 1.4,
  b: 1.0,
  shape: { legs: 1.02, girth: 0.92, hips: 0.95, head: 1.02 },
  skin: '#a8704a',
  look: { torso: robe, sleeve: robe, cuff: robe, legs: robe, boot: robe },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'cloth' },
  face: { eyeColor: '#3a2412', brow: '#141010', jaw: 0.96, blush: 0.1 },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The pyramid held up at you and given a little shake; the other hand steadying the tray; nodding, beaming.
      const shake = Math.sin(T * 9) * Math.max(0, Math.sin(T * 1.3));
      k.turn('armR', -0.85, 0.15, 0.05);
      k.turn('foreR', -0.25 + shake * 0.1, 0, 0);
      k.turn('handR', 0, shake * 0.3, 0);
      k.turn('armL', -0.3, 0, 0.12);
      k.turn('foreL', -0.95, 0.2, 0);
      k.turn('chest', 0.06, Math.sin(T * 0.7) * 0.1, 0);
      k.turn('head', 0.05 + Math.sin(T * 2.6) * 0.05, Math.sin(T * 0.5) * 0.2, Math.sin(T * 1.3) * 0.08);
    },
  },
  extras(s, J) {
    moustache(s, { color: '#141010', wide: 1.05 });
    s.part('kit', () => {
      // The turban: a crown of white cloth and the wraps round it.
      const W = { color: cloth('#f6f2e8', '#c8c0b0'), mat: 'cloth', bone: 'head' };
      s.ellipsoid([0, 0.758, -0.006], [0.104, 0.05, 0.104], { ...W, k: 0.01 });
      s.torus([0, 0.738, -0.004], 0.096, 0.024, { ...W, k: 0.008, rot: [0.1, 0, 0.06] });
      s.torus([0, 0.762, -0.008], 0.088, 0.02, { ...W, k: 0.008, rot: [-0.12, 0, -0.1] });
      // The galabeya: from the waist to the ankles, a little flared; the neck slit; wide sleeves.
      s.limb([0, 0.34, 0.0], [0, 0.2, 0.004], 0.088, 0.1, { color: robe, mat: 'cloth', bone: 'hips', k: 0.02 });
      s.cylinder([0, 0.14, 0.006], 0.104, 0.07, { color: robe, mat: 'cloth', bone: 'hips', k: 0.02, round: 0.012 });
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        s.limb(J[`elbow${S}`], [J[`wrist${S}`][0], J[`wrist${S}`][1] + 0.01, J[`wrist${S}`][2]], 0.03, 0.042, { color: robe, mat: 'cloth', bone: `fore${S}`, k: 0.01 });
        // Pointed yellow slippers.
        const a = J[`ankle${S}`], F = { color: '#e0b030', mat: 'leather', bone: `foot${S}` };
        s.ellipsoid([a[0], 0.03, a[2] + 0.03], [0.034, 0.032, 0.056], { ...F, k: 0.012 });
        s.limb([a[0], 0.02, a[2] + 0.06], [a[0], 0.034, a[2] + 0.11], 0.024, 0.006, { ...F, k: 0.012 });
      }
      // The tray, on a strap round the neck, and its rim.
      const TR = { color: cloth('#9a6232', '#6a4020'), mat: 'leather', bone: 'chest' };
      s.box([0, 0.37, 0.16], [0.12, 0.006, 0.08], 0.004, { ...TR, k: 0.002 });
      for (const m of [1, -1]) {
        s.box([m * 0.118, 0.38, 0.16], [0.005, 0.012, 0.08], 0.003, { ...TR, k: 0.002 });
        s.limb([m * 0.1, 0.38, 0.09], [m * 0.045, 0.525, 0.02], 0.006, 0.006, { color: '#4a2a14', mat: 'leather', bone: 'chest', k: 0.004 });
      }
      s.box([0, 0.38, 0.238], [0.12, 0.012, 0.005], 0.003, { ...TR, k: 0.002 });
      s.torus([0, 0.53, -0.005], 0.05, 0.006, { color: '#4a2a14', mat: 'leather', bone: 'chest', k: 0.004, rot: [0.25, 0, 0] });
      // On the tray: pyramids, gold and sandstone; scarabs; papyrus rolled up.
      pyramid(s, [-0.07, 0.376, 0.13], 0.03, 0.05, { ...GOLD, bone: 'chest', k: 0.002 });
      pyramid(s, [-0.02, 0.376, 0.2], 0.022, 0.036, { ...SAND, bone: 'chest', k: 0.002 });
      pyramid(s, [0.08, 0.376, 0.205], 0.018, 0.03, { ...GOLD, bone: 'chest', k: 0.002 });
      pyramid(s, [-0.085, 0.376, 0.205], 0.016, 0.026, { ...SAND, bone: 'chest', k: 0.002 });
      for (const [x, z, a] of [[0.04, 0.13, 0.4], [0.085, 0.14, -0.3], [0.025, 0.205, 0.9]]) {
        s.ellipsoid([x, 0.382, z], [0.014, 0.009, 0.019], { color: '#1aa8a8', mat: 'plastic', bone: 'chest', k: 0.002, rot: [0, a, 0] });
      }
      for (const [z, c] of [[0.11, '#e8dcb0'], [0.125, '#efe4bc']]) s.limb([-0.04, 0.388, z], [0.07, 0.388, z - 0.01], 0.008, 0.008, { color: c, mat: 'paper', bone: 'chest', k: 0.002 });
      // The one he holds up: sculpted tipped, so that up in his fist it stands upright.
      const r = J.handR, up = rotation([2.25, 0, 0]);
      const off = (v) => [0, 1, 2].map((i) => r[i] + up[i][0] * v[0] + up[i][1] * v[1] + up[i][2] * v[2]);
      pyramid(s, off([0, 0.012, 0.004]), 0.035, 0.065, { ...GOLD, bone: 'handR', k: 0.002, rot: [2.25, 0, 0] });
      s.torus(off([0, 0.088, 0.004]), 0.014, 0.003, { color: '#d8dce4', mat: 'metal', bone: 'handR', k: 0.001, rot: [2.25, 0, Math.PI / 2] });
    });
    s.part('fine', () => {
      // The scarabs' wing cases, and the papyrus' painted edges.
      for (const [x, z, a] of [[0.04, 0.13, 0.4], [0.085, 0.14, -0.3], [0.025, 0.205, 0.9]]) {
        s.box([x, 0.391, z], [0.0015, 0.0015, 0.016], 0.001, { color: '#0a4a50', mat: 'plastic', bone: 'chest', k: 0, rot: [0, a, 0] });
      }
      for (const z of [0.11, 0.125]) s.limb([0.071, 0.388, z - 0.01], [0.073, 0.388, z - 0.01], 0.0085, 0.0085, { color: '#c8402a', mat: 'paper', bone: 'chest', k: 0 });
    });
  },
});
