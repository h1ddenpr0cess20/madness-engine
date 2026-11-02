import { bag, cloth, cord, hold, person, plate } from './person.js';

/**
 * The Medic: a white shirt with a green cross on it, a hi-vis vest, a
 * radio on the shoulder, a bag the size of a suitcase of everything that
 * has gone wrong today, and the weary face of somebody who has seen
 * four hundred people with the same problem since noon. The problem is
 * the water. Sprints, with great dignity, toward the sound of somebody
 * going over. About 1.0 tiles tall.
 */

const GREEN = cloth('#2e5a40', '#1c3a28');
/** The trunk's own shapes, not the limbs': what a strap lies on. */
const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);


export default person({
  name: 'medic',
  scale: 1.5,
  b: 1.04,
  shape: { legs: 1.02, girth: 1.0 },
  skin: '#b88a68',
  look: { torso: GREEN, sleeve: GREEN, cuff: GREEN, legs: GREEN, boot: '#16161a', sole: '#2a2a30', belt: '#16161a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#1a1008', mood: -1 },
  hair: { color: cloth('#1a1008', '#0e0804'), cap: [0.105, 0.086, 0.106], locks: [] },
  style: {
    attack: 'swing',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The kit bag in the right hand, hanging heavy; the left hand pressing the radio on the chest to talk, the head
      // turned down to it.
      hold(k, 'armR', 0.1, 0, -0.12); hold(k, 'foreR', -0.15, 0, 0);
      hold(k, 'armL', -0.4, 0, -0.2); hold(k, 'foreL', -1.6, 0, 0);
      reach?.(k, 'L', 'chest', [0.06, 0.475, 0.112]);
      k.turn('head', 0.12, 0.2, 0.1 + Math.sin(T * 0.8) * 0.03);
    },
  },
  extras(s, J, { pose }) {
    // The reflective bands: round the chest and round each upper arm, silver-grey on yellow.
    s.paint((p) => Math.max(Math.abs(p[1] - 0.42) - 0.016, Math.abs(p[0]) - 0.13), '#e8e028', 0.002);
    s.paint((p) => Math.max(Math.abs(p[1] - 0.42) - 0.006, Math.abs(p[0]) - 0.13), '#c8ccd4', 0.001);
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R', e = J[`elbow${S}`];
      s.paint((p) => Math.max(Math.abs(p[1] - e[1] - 0.035) - 0.012, (e[0] * m - 0.03) - p[0] * m), '#e8e028', 0.002);
    }
    // The green cross on the white patch on the chest's right, and the radio on the left on its clip.
    s.paint((p) => Math.max(Math.hypot(p[0] + 0.05, p[1] - 0.49) - 0.02, 0.04 - p[2]), '#f4f2ee', 0.001);
    s.paint((p) => Math.max(Math.min(Math.max(Math.abs(p[0] + 0.05) - 0.004, Math.abs(p[1] - 0.49) - 0.013), Math.max(Math.abs(p[0] + 0.05) - 0.013, Math.abs(p[1] - 0.49) - 0.004)), 0.04 - p[2]), '#1aa84a', 0.0008);
    const radio = bag(s, [0.055, 0.5, 0.08], { size: [0.012, 0.022, 0.008], color: '#16161a', flap: false, over: ['top'], keep: TRUNK, bone: 'chest' });
    s.part('kit', () => {
      const top = radio.c.map((v, i) => v + radio.up[i] * 0.022 + radio.across[i] * 0.006);
      s.limb(top, top.map((v, i) => v + radio.up[i] * 0.045), 0.0028, 0.0018, { color: '#16161a', mat: 'plastic', bone: 'chest', k: 0.001 });
      s.sphere(radio.c.map((v, i) => v + radio.n[i] * 0.008 - radio.up[i] * 0.006), 0.004, { color: '#d81c24', mat: 'plastic', bone: 'chest', k: 0 });
    });
    // The kit bag: a green holdall hanging from the right fist by its two handles, a white cross on each end.
    const G = pose.grip('R'), c = G.c.map((v, i) => v + [0, -0.085, 0][i]);
    const X = [0, 0, 1], Y = [0, 1, 0], Z = [1, 0, 0];
    const pt = (x, y, z) => c.map((v, i) => v + X[i] * x + Y[i] * y + Z[i] * z);
    pose.hold(s, 'handR', () => s.part('kit', () => {
      plate(s, c, X, Y, [0.07, 0.045, 0.034], 0.018, { color: '#2a6a3a', mat: 'cloth', k: 0.004 });
      plate(s, pt(0, 0.041, 0), X, Y, [0.071, 0.004, 0.035], 0.003, { color: '#1a1a1e', mat: 'cloth', k: 0.002 });
      for (const z of [-0.012, 0.012]) cord(s, [pt(-0.03, 0.042, z), pt(-0.015, 0.075, z * 0.5), G.c, pt(0.015, 0.075, z * 0.5), pt(0.03, 0.042, z)], 0.0035, { color: '#1a1a1e', mat: 'cloth' });
      for (const e of [-1, 1]) {
        plate(s, pt(e * 0.07, 0, 0), Z, Y, [0.006, 0.02, 0.0025], 0.001, { color: '#f4f2ee', mat: 'cloth', k: 0.0005 });
        plate(s, pt(e * 0.07, 0, 0), Z, Y, [0.02, 0.006, 0.0025], 0.001, { color: '#f4f2ee', mat: 'cloth', k: 0.0005 });
      }
    }));
  },
});
