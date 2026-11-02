import { cloth, hold, person, plate } from './person.js';
import { satchel } from './wardrobe.js';

/**
 * The Shopper: out for the week's groceries, list in hand, ticking it off.
 * A teal puffer jacket quilted in bands, jeans, white trainers, the hair up
 * in a ponytail with a scrunchie; a canvas tote over the shoulder, and on
 * the other arm a wire basket full — a baguette, a carton of milk, apples
 * and a bunch of bananas. About 0.92 tiles tall.
 */

const PUFFER = (p, n) => {
  // Quilted: a seam every few centimetres up the body and the sleeves, each band puffed between.
  const f = (((p[1] - 0.29) / 0.042) % 1 + 1) % 1, k = 0.82 + 0.25 * Math.sin(f * Math.PI);
  const c = cloth('#2a8a8a', '#1e6a6a')(p, n);
  return f < 0.08 ? c.map((v) => v * 0.55) : c.map((v) => Math.min(1, v * k));
};
const DENIM = cloth('#3a5a8a', '#2a4268');
const HAIR = cloth('#6a3a1e', '#4a2410');

export default person({
  name: 'shopper',
  scale: 1.38,
  b: 0.94,
  budget: 90000,
  shape: { legs: 1.02, girth: 0.92, hips: 1.05 },
  skin: '#f0c4a4',
  look: { torso: PUFFER, sleeve: PUFFER, cuff: PUFFER, legs: DENIM, boot: '#f2f2ee', sole: '#d0d0cc', belt: '#3a5a8a', buckle: '#3a5a8a' },
  face: { eyeColor: '#3a6a4a', brow: '#4a2a14', mood: 1, jaw: 0.94, blush: 0.4 },
  hair: { color: HAIR, cap: [0.108, 0.096, 0.11], front: 0.075 },
  style: {
    attack: 'swing', twist: 0.3,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The basket on the left arm, hanging; the list up in the right hand, read with the head down to it.
      hold(k, 'armL', 0.05, 0, 0.08);
      hold(k, 'foreL', -0.25, 0, 0);
      hold(k, 'armR', -0.45, 0, -0.12);
      hold(k, 'foreR', -1.35, 0.3, 0);
      k.turn('head', 0.28 + Math.sin(T * 0.7) * 0.05, -0.15, 0);
    },
  },
  extras(s, J, { pose }) {
    // The ponytail out of the back of the head and down, the scrunchie round its root.
    s.part('hair', () => s.chain([[0, 0.735, -0.1], [0, 0.71, -0.135], [0, 0.65, -0.15], [0, 0.6, -0.14]], [0.02, 0.022, 0.018, 0.01], { color: HAIR, mat: 'hair', bone: 'head', k: 0.006 }));
    s.part('kit', () => s.torus([0, 0.728, -0.108], 0.019, 0.008, { color: '#d84a7a', mat: 'cloth', bone: 'head', k: 0.002, rot: [1.1, 0, 0] }));
    // The tote over the right shoulder, canvas, at the left hip.
    satchel(s, { side: -1, color: '#e8dcc0', strap: '#d8ccb0', size: [0.05, 0.052, 0.012], width: 0.016, flap: '#e8dcc0' });

    // The wire basket on the left: its handle through the fist, the basket below, and what's in it.
    const L = pose.grip('L');
    pose.hold(s, 'handL', () => s.part('kit', () => {
      const W = { color: '#c8ccd4', mat: 'metal', k: 0.0008 };
      const down = L.up.map((v) => -v), across = L.along, depth = L.out;
      const at = (a, d, z) => L.c.map((v, i) => v + across[i] * a + down[i] * d + depth[i] * z);
      const [hw, hd, top, bottom] = [0.07, 0.05, 0.09, 0.19];
      // The handle, an arch from one side of the rim up through the hand and down to the other.
      const arch = [at(-hw, top, 0), at(-hw * 0.7, 0.02, 0), at(0, 0, 0), at(hw * 0.7, 0.02, 0), at(hw, top, 0)];
      for (let i = 0; i < arch.length - 1; i++) s.limb(arch[i], arch[i + 1], 0.0035, 0.0035, { color: '#2a2a2e', mat: 'plastic', k: 0.001 });
      // The rim and the foot, and the wires down between them.
      for (const d of [top, bottom]) {
        const c = [at(-hw, d, -hd), at(hw, d, -hd), at(hw, d, hd), at(-hw, d, hd)];
        for (let i = 0; i < 4; i++) s.limb(c[i], c[(i + 1) % 4], 0.0026, 0.0026, W);
      }
      for (let i = 0; i <= 6; i++) for (const z of [-hd, hd]) { const a = -hw + (2 * hw * i) / 6; s.limb(at(a, top, z), at(a, bottom, z), 0.0016, 0.0016, W); }
      for (let i = 0; i <= 4; i++) for (const a of [-hw, hw]) { const z = -hd + (2 * hd * i) / 4; s.limb(at(a, top, z), at(a, bottom, z), 0.0016, 0.0016, W); }
      plate(s, at(0, bottom, 0), across, depth, [hw, hd, 0.002], 0.001, { ...W, color: '#9aa0a8' });
      // In it: a carton of milk, apples, bananas, and a baguette standing up out of it.
      plate(s, at(-0.035, bottom - 0.05, 0.0), across, down.map((v) => -v), [0.022, 0.05, 0.022], 0.002, { color: '#f4f4f0', mat: 'plastic', k: 0.001 });
      plate(s, at(-0.035, bottom - 0.105, 0.0), across, down.map((v) => -v), [0.02, 0.008, 0.02], 0.002, { color: '#2a6ad8', mat: 'plastic', k: 0.001 });
      for (const [a, z] of [[0.02, -0.025], [0.045, 0.02], [0.03, 0.0]]) s.sphere(at(a, top - 0.005, z), 0.018, { color: '#c81c24', mat: 'skin', k: 0.002 });
      for (let i = 0; i < 3; i++) {
        const z = -0.02 + i * 0.016;
        s.limb(at(0.0, top - 0.02, z), at(0.03, top - 0.035, z), 0.007, 0.008, { color: '#f0d040', mat: 'skin', k: 0.003 });
        s.limb(at(0.03, top - 0.035, z), at(0.06, top - 0.02, z), 0.008, 0.006, { color: '#f0d040', mat: 'skin', k: 0.003 });
      }
      s.limb(at(-0.05, bottom - 0.005, 0.03), at(-0.07, top - 0.16, 0.035), 0.012, 0.011, { color: '#d8a050', mat: 'skin', k: 0.003, bump: [0.0012, 160] });
    }));
    // The list in the right hand, pinched at its foot between the thumb and the side of the fist and standing up out
    // of it, ruled and ticked: none of it through the fingers.
    const R = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      const [h, w] = [0.026, 0.019];
      const c = R.at(0.01 + h, 0, 0.002);
      plate(s, c, R.along, R.up, [h, w, 0.0012], 0.0008, {
        color: (p) => {
          const v = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
          const y = v[0] * R.along[0] + v[1] * R.along[1] + v[2] * R.along[2];
          const line = (((y * 150) % 1) + 1) % 1 < 0.14 && y < h - 0.008 && y > -h + 0.004;
          return line ? [0.3, 0.36, 0.7] : [0.97, 0.96, 0.92];
        }, mat: 'paper', k: 0.0004,
      });
    }));
  },
});
