import { bands } from '../models/skins.js';
import { cloth, person, shell } from './person.js';
import { fedora, moustache, suitFront } from './wardrobe.js';

/**
 * The Hood: a pinstripe suit with shoulders out to here, a black shirt and
 * a white tie, a fedora pulled down, spats, a pencil moustache, and a
 * violin case under his arm. He does not play. About 0.95 tiles tall.
 */

const chalk = bands(0, 0.026, '#24242c', '#8a8a96', 0.14, 0.3);
const stripe = (p, n) => {
  const k = 0.82 + Math.max(0, n[1]) * 0.2;
  return chalk(p).map((v) => v * k);
};

/** Two-tone shoes: white, the toe cap and the heel black. */
const SPECTATOR = (p) => (p[2] > 0.065 || p[2] < -0.012 ? [0.012, 0.012, 0.014] : [0.86, 0.84, 0.78]);

export default person({
  name: 'gangster',
  scale: 1.45,
  b: 1.12,
  shape: { legs: 1.02, girth: 1.06, hips: 0.95 },
  skin: '#d8a888',
  look: { torso: stripe, sleeve: stripe, cuff: stripe, legs: stripe, boot: SPECTATOR, sole: '#101014' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a2a2a', brow: '#1a1208', mood: 1, jaw: 1.12 },
  hair: { color: cloth('#14100c', '#060404'), locks: [[[0.08, 0.72, -0.01], [0.1, 0.66, -0.06], 0.025], [[-0.08, 0.72, -0.01], [-0.1, 0.66, -0.06], 0.025]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The violin case in the left hand; the right hand in a pocket; a look over the shoulder.
      // The violin case hanging from the left hand.
      k.turn('armL', 0.05, 0, 0.18);
      k.turn('foreL', -0.15, 0, 0);
      k.turn('armR', 0.15, 0, -0.12);
      k.turn('foreR', -0.3, 0, 0);
      k.turn('head', 0.06, Math.sin(T * 0.6) * 0.45, 0);
    },
  },
  extras(s, J, { pose }) {
    fedora(s, { color: '#3a3a44', band: '#101014', tilt: 0.14 });
    moustache(s, { color: '#14100c', pencil: true });
    suitFront(s, { shirt: '#16161c', tie: '#f0ece0', lapel: cloth('#22222a', '#141418'), b: 1.12, low: 0.4 });
    // A white pocket square in the breast pocket.
    shell(s, (p) => Math.max(Math.abs(p[0] - 0.066) - 0.014, Math.abs(p[1] - 0.488) - 0.006, 0.02 - p[2]), { color: '#f0ece0', mat: 'cloth', part: 'outer2', thick: 0.004, lift: 0.0005, over: ['top'], bone: 'chest' });
    // The violin case, carried by its handle: black, shaped like what is in it (a body with its waist and a long
    // neck), its catches silver.
    const G = pose.grip('L'), down = G.up.map((v) => -v), along = G.along;
    const face = [along[1] * down[2] - along[2] * down[1], along[2] * down[0] - along[0] * down[2], along[0] * down[1] - along[1] * down[0]];
    const c = G.at(0, 0, 0).map((v, i) => v + down[i] * 0.05);
    const local = (q) => { const v = q.map((x, i) => x - c[i]); return [v[0] * along[0] + v[1] * along[1] + v[2] * along[2], v[0] * down[0] + v[1] * down[1] + v[2] * down[2], v[0] * face[0] + v[1] * face[1] + v[2] * face[2]]; };
    const outline = (u, v) => {
      const body = Math.min(Math.hypot(u + 0.06, v - 0.01) - 0.05, Math.hypot(u - 0.02, v - 0.005) - 0.04);
      const neck = Math.max(Math.abs(v - 0.008) - 0.02, Math.abs(u - 0.09) - 0.07);
      return Math.min(body, neck);
    };
    pose.hold(s, 'handL', () => s.part('kit', () => {
      s.shape((q) => { const [u, v, w] = local(q), r = 0.006, a = outline(u, v) + r, b = Math.abs(w) - 0.018 + r; return Math.hypot(Math.max(a, 0), Math.max(b, 0)) + Math.min(Math.max(a, b), 0) - r; }, [c.map((x) => x - 0.2), c.map((x) => x + 0.2)], { color: '#16161a', mat: 'leather', k: 0.002 });
      // The handle, from the case's top edge up through the fist.
      s.limb(G.at(-0.02, 0, 0).map((v, i) => v + down[i] * 0.012), G.at(-0.02), 0.004, 0.004, { color: '#16161a', mat: 'leather', k: 0.002 });
      s.limb(G.at(0.02, 0, 0).map((v, i) => v + down[i] * 0.012), G.at(0.02), 0.004, 0.004, { color: '#16161a', mat: 'leather', k: 0.002 });
      s.limb(G.at(-0.022), G.at(0.022), 0.0045, 0.0045, { color: '#16161a', mat: 'leather', k: 0.002 });
      for (const u of [-0.07, 0.03]) s.box(c.map((v, i) => v + along[i] * u + face[i] * 0.019 - down[i] * 0.04), [0.006, 0.006, 0.003], 0.002, { color: '#c8c8d0', mat: 'metal', k: 0.001 });
    }));
  },
});
