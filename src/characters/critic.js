import { cloth, hold, person, plate } from './person.js';
import { beard, glasses, satchel } from './wardrobe.js';

/**
 * The Music Critic: a cardigan, a tote bag, round glasses, a very small
 * beard and a notebook with a pen that is already writing something unkind.
 * Has not heard it. Does not need to. Two stars. About 0.95 tiles tall.
 */

const knit = cloth('#6a7a4a', '#44502e');

export default person({
  name: 'critic',
  scale: 1.45,
  b: 1.0,
  shape: { legs: 1.12, girth: 0.82, head: 1.1, torso: 1.06 },
  skin: '#e0b090',
  look: { torso: knit, sleeve: knit, cuff: knit, legs: cloth('#1c1c24'), boot: '#e8e4d8', sole: '#d8d4c8' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'cloth' },
  face: { eyeColor: '#3a4a5a', brow: '#4a4a4a', mood: 1 },
  hair: { color: cloth('#3a2a1e', '#22160e'), locks: [[[0.06, 0.74, -0.02], [0.1, 0.7, -0.05], 0.03], [[-0.06, 0.74, -0.02], [-0.1, 0.7, -0.05], 0.03], [[0.0, 0.78, 0.06], [0.06, 0.72, 0.1], 0.04]] },
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Writing it down.
      hold(k, 'armL', -0.25, -0.8, 0.35); hold(k, 'foreL', -1.6, 0, 0);
      hold(k, 'armR', -0.5, 0.8, -0.15); hold(k, 'foreR', -1.4 + Math.sin(T * 6) * 0.06, 0, 0);
      k.turn('head', 0.18, Math.sin(T * 0.5) * 0.2, 0);
    },
  },
  extras(s, J, { pose }) {
    glasses(s, { rim: '#16161a', round: true, size: 0.024 });
    // The beard: very small, on the chin only.
    beard(s, { color: '#3a2a1e', full: 0, thick: 0.006 });
    // The tote bag on the left shoulder, its strap across to the right hip, a red stripe on it.
    const tote = satchel(s, { side: 1, color: '#e8e4d8', strap: '#d8d4c8', size: [0.05, 0.055, 0.012], width: 0.016, flap: false });
    s.paint((p) => { const v = p.map((x, i) => x - tote.c[i]); const y = v[0] * tote.up[0] + v[1] * tote.up[1] + v[2] * tote.up[2], z = v[0] * tote.n[0] + v[1] * tote.n[1] + v[2] * tote.n[2], x = v[0] * tote.across[0] + v[1] * tote.across[1] + v[2] * tote.across[2]; return Math.max(Math.abs(y) - 0.012, Math.abs(x) - 0.055, -z); }, '#d81c2a', 0.002);
    // The notebook open on the left hand, and the pen in the right, writing.
    const L = pose.grip('L'), R = pose.grip('R');
    const across = L.along, length = L.out.map((v) => -v);
    const face = [across[1] * length[2] - across[2] * length[1], across[2] * length[0] - across[0] * length[2], across[0] * length[1] - across[1] * length[0]];
    const book = L.at(0, 0, -0.01).map((v, i) => v + length[i] * 0.03 + face[i] * 0.004);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      plate(s, book, across, length, [0.034, 0.045, 0.0028], 0.002, { color: '#2a2a30', mat: 'leather', k: 0.001 });
      plate(s, book.map((v, i) => v + face[i] * 0.003), across, length, [0.031, 0.042, 0.0012], 0.001, { color: '#f2f0ec', mat: 'paper', k: 0.0005 });
    }));
    pose.hold(s, 'handR', () => s.part('kit', () => s.limb(R.at(-0.045), R.at(0.035), 0.0032, 0.0042, { color: '#c8a030', mat: 'metal', k: 0.001 })));
  },
});
