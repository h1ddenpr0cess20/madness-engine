import { cloth, hold, person, plate, shell } from './person.js';
import { cap, moustache } from './wardrobe.js';

/**
 * The Foreman: a flat cap, a brown warehouse coat down to the knee, a
 * moustache, a pencil behind the ear and a clipboard, on which is written,
 * every time, exactly how long you have been on your break. About 0.95 tiles
 * tall.
 */

const coat = cloth('#7a6648', '#4e4230');

export default person({
  name: 'foreman',
  scale: 1.5,
  b: 1.1,
  shape: { legs: 0.98, girth: 1.06, head: 1.02 },
  belly: 0.7,
  skin: '#d4a07c',
  look: { torso: coat, sleeve: coat, cuff: coat, legs: cloth('#2a2a2e'), boot: '#2a1c12', sole: '#16161a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#4a4a4a', mood: 1 },
  hair: { color: cloth('#6a6a6a', '#3a3a3a'), locks: [[[0.09, 0.7, -0.02], [0.11, 0.64, -0.06], 0.026], [[-0.09, 0.7, -0.02], [-0.11, 0.64, -0.06], 0.026]], cap: [0.104, 0.075, 0.104] },
  style: {
    attack: 'smite', heavy: 0.4,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The clipboard held up in front of him, the pencil going: how long have you been on your break.
      hold(k, 'armL', -0.55, -0.6, 0); hold(k, 'foreL', -0.8, 0, 0);
      hold(k, 'armR', -1, 0.8, -0.05); hold(k, 'foreR', -0.35 + Math.sin(T * 5) * 0.06, 0, 0);
      k.turn('head', 0.1, Math.sin(T * 0.5) * 0.25, 0);
    },
  },
  extras(s, J, { pose }) {
    moustache(s, { color: '#5a5a5a', wide: 1.2, droop: 0.4 });
    // The flat cap.
    cap(s, { color: '#4a4034', peak: '#3a3228', flat: true });
    // Big patch pockets on the coat, each with its flap.
    for (const m of [1, -1]) {
      shell(s, (p) => Math.max(Math.abs(p[0] - m * 0.06) - 0.026, Math.abs(p[1] - 0.35) - 0.03, 0.02 - p[2]), { color: coat, mat: 'cloth', part: 'outer', thick: 0.004, lift: 0.0005, over: ['top'], bone: 'spine' });
      shell(s, (p) => Math.max(Math.abs(p[0] - m * 0.06) - 0.028, Math.abs(p[1] - 0.373) - 0.009, 0.02 - p[2]), { color: '#5a4a32', mat: 'cloth', part: 'outer2', thick: 0.003, lift: 0.0, over: ['outer'], bone: 'spine' });
    }
    // The clipboard held up in front of him in the left hand, tipped back to write on; the pencil in the right.
    const L = pose.grip('L'), R = pose.grip('R');
    const across = L.along, length = L.up.map((v) => -v);
    const face = [across[1] * length[2] - across[2] * length[1], across[2] * length[0] - across[0] * length[2], across[0] * length[1] - across[1] * length[0]];
    const board = L.at(0, 0, 0).map((v, i) => v + length[i] * 0.058 - L.out[i] * 0.004);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      plate(s, board, across, length, [0.042, 0.058, 0.0028], 0.002, { color: '#8a6a3a', mat: 'leather', k: 0.001 });
      plate(s, board.map((v, i) => v + face[i] * 0.0032), across, length, [0.036, 0.05, 0.0009], 0.0006, { color: '#f4f0e6', mat: 'paper', k: 0.0005 });
      plate(s, board.map((v, i) => v + face[i] * 0.004 - length[i] * 0.052), across, length, [0.015, 0.006, 0.0025], 0.0015, { color: '#c8ccd4', mat: 'metal', k: 0.0005 });
    }));
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(R.at(-0.045), R.at(0.05), 0.0038, 0.0038, { color: '#e8c030', mat: 'plastic', k: 0.001 });
      s.limb(R.at(-0.045), R.at(-0.056), 0.0038, 0.0008, { color: '#3a2a1a', mat: 'leather', k: 0.0008 });
    }));
  },
});
