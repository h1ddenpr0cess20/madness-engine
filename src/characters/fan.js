import { bag, cloth, person, plate, strap } from './person.js';

/**
 * The Autograph Hunter: a fan in a T-shirt with Rock's face on it (it is
 * not his face: it is a rock), a ponytail, a backpack, and an autograph
 * book and a pen held out at arm's length. Small, quick, determined. About
 * 0.8 tiles tall.
 */

const tee = cloth('#f4f2ee', '#c8c4bc');

export default person({
  name: 'fan',
  scale: 1.3,
  b: 0.94,
  shape: { legs: 1.04, girth: 0.88, head: 1.04 },
  skin: '#c88a68',
  look: { torso: tee, sleeve: tee, cuff: '#c88a68', legs: cloth('#2a3a5a'), boot: '#d8302a', sole: '#f4f2ee' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#2a1a10', brow: '#1a120a', blush: 0.5 },
  hair: { color: cloth('#1a120a', '#0a0604'), locks: [[[0, 0.78, -0.06], [0, 0.72, -0.16], 0.035], [[0, 0.7, -0.15], [0, 0.6, -0.18], 0.025], [[0.05, 0.77, 0.03], [0.09, 0.73, 0.05], 0.03], [[-0.05, 0.77, 0.03], [-0.09, 0.73, 0.05], 0.03]] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The book and the pen held out, shaking with excitement.
      k.turn('armR', -1.4 + Math.sin(T * 12) * 0.04, 0, -0.1);
      k.turn('foreR', -0.3, 0, 0);
      k.turn('armL', -1.3 + Math.sin(T * 12 + 1) * 0.04, 0, 0.1);
      k.turn('foreL', -0.4, 0, 0);
      k.move('root', 0, Math.abs(Math.sin(T * 6)) * 0.01, 0);
    },
  },
  extras(s, J, { pose }) {
    const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    // A rock printed on the shirt: a grey lump with a crack in it.
    s.paint((p) => Math.max(Math.hypot((p[0]) / 1.3, p[1] - 0.45) - 0.028, 0.05 - p[2]), '#7a7470', 0.002);
    // The backpack, on the back, its two straps over the shoulders and under the arms to its bottom corners.
    const pack = bag(s, [0, 0.44, -0.09], { size: [0.055, 0.065, 0.028], color: '#d8302a', flap: '#b82020', over: ['top'], keep: trunk, bone: 'chest' });
    for (const m of [1, -1]) {
      strap(s, [pack.c.map((v, i) => v + [m * 0.035, 0.06, 0][i]), [m * 0.05, 0.54, -0.035], [m * 0.058, 0.548, 0.02], [m * 0.06, 0.5, 0.075], [m * 0.085, 0.44, 0.05], [m * 0.09, 0.4, -0.03], pack.c.map((v, i) => v + [m * 0.045, -0.055, 0][i])],
        { width: 0.014, thick: 0.004, color: '#16161a', mat: 'cloth', over: ['top', 'kit'], keep: trunk });
    }
    // The autograph book open in the left hand, the pen ready in the right.
    const L = pose.grip('L'), R = pose.grip('R');
    const across = L.along, length = L.out.map((v) => -v);
    const face = [across[1] * length[2] - across[2] * length[1], across[2] * length[0] - across[0] * length[2], across[0] * length[1] - across[1] * length[0]];
    const book = L.at(0, 0, -0.01).map((v, i) => v + length[i] * 0.028 + face[i] * 0.004);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      plate(s, book, across, length, [0.034, 0.044, 0.0028], 0.002, { color: '#3a6ad8', mat: 'paper', k: 0.001 });
      plate(s, book.map((v, i) => v + face[i] * 0.003), across, length, [0.031, 0.041, 0.0012], 0.001, { color: '#f4f2ee', mat: 'paper', k: 0.0005 });
    }));
    pose.hold(s, 'handR', () => s.part('kit', () => s.limb(R.at(-0.04), R.at(0.045), 0.0042, 0.0038, { color: '#16161a', mat: 'plastic', k: 0.001 })));
  },
});
