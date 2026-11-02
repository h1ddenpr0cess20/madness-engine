import { cloth, hold, person, shell, strap, tube } from './person.js';

/**
 * The Bull Runner: in the whites of San Fermín, a red pañuelo knotted at
 * the throat and a red sash round the waist, a rolled-up newspaper in his
 * fist for the bull's nose, and the look over the shoulder of a man who
 * has just remembered why the others are running. White shirt, red scarf,
 * no plan. Running from the bull. Into you. About 0.95 tiles tall.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const WHITE = cloth('#f6f4f0', '#d8d4cc');

export default person({
  name: 'runner',
  scale: 1.44,
  b: 0.96,
  shape: { legs: 1.06, girth: 0.9 },
  skin: '#e0a880',
  look: { torso: WHITE, sleeve: WHITE, cuff: '#e0a880', legs: WHITE, boot: '#f4f2ec', sole: '#c8141e', tuck: true },
  mats: { cuff: 'skin', boot: 'cloth' },
  face: { eyeColor: '#2a1a0a', brow: '#1a120a', blush: 0.9, jaw: 1.0 },
  hair: { color: cloth('#1a120a', '#0a0604'), locks: [[[0.03, 0.78, 0.06], [0.07, 0.77, 0.1], 0.03], [[-0.04, 0.78, 0.05], [-0.08, 0.76, 0.09], 0.03]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, g = Math.sin(T * 9);
      // Running on the spot, the paper up, looking back over his shoulder.
      if (clip === 'idle') {
        hold(k, 'thighL', -Math.max(0, g) * 0.8, 0, 0); hold(k, 'shinL', Math.max(0, g) * 1.0, 0, 0);
        hold(k, 'thighR', -Math.max(0, -g) * 0.8, 0, 0); hold(k, 'shinR', Math.max(0, -g) * 1.0, 0, 0);
        k.move('root', 0, Math.abs(g) * 0.012, 0);
      }
      hold(k, 'armR', -1.2, 0, -0.2);
      hold(k, 'foreR', -1.0, 0, 0);
      hold(k, 'armL', g * 0.6, 0, 0.1);
      hold(k, 'foreL', -1.2, 0, 0);
      k.turn('head', 0, 1.1 + Math.sin(T * 1.3) * 0.2, 0);
    },
  },
  extras(s, J, { pose }) {
    // The pañuelo knotted round the throat, its point down the chest; the sash round the waist, its ends at the hip.
    strap(s, [[0, 0.53, 0.07], [0.05, 0.538, 0.04], [0.062, 0.548, -0.01], [0.04, 0.552, -0.06], [0, 0.553, -0.07], [-0.04, 0.552, -0.06], [-0.062, 0.548, -0.01], [-0.05, 0.538, 0.04], [0, 0.53, 0.07]], { width: 0.016, thick: 0.004, color: '#c8141e', mat: 'cloth', over: ['top', 'head'], bone: 'chest', closed: true });
    shell(s, (p) => Math.max(Math.abs(p[0]) - Math.max(0, (p[1] - 0.47) * 0.6), 0.47 - p[1], p[1] - 0.53, 0.03 - p[2]), { color: '#c8141e', mat: 'cloth', part: 'outer', thick: 0.003, lift: 0.0005, over: ['top'], bone: 'chest', k: 0.002 });
    s.part('outer2', () => s.sphere([0, 0.528, 0.075], 0.01, { color: '#c8141e', mat: 'cloth', bone: 'chest', k: 0.003 }));
    strap(s, [[0, 0.335, 0.1], [0.08, 0.34, 0.07], [0.11, 0.345, 0.0], [0.08, 0.35, -0.07], [0, 0.355, -0.09], [-0.08, 0.35, -0.07], [-0.11, 0.345, 0.0], [-0.08, 0.34, 0.07], [0, 0.335, 0.1]], { width: 0.022, thick: 0.005, color: '#c8141e', mat: 'cloth', over: ['top', 'bottoms'], keep: TRUNK, closed: true });
    s.part('outer2', () => {
      s.sphere([0.1, 0.34, 0.045], 0.012, { color: '#c8141e', mat: 'cloth', bone: 'hips', k: 0.004 });
      s.flake([0.104, 0.335, 0.05], [0.12, 0.25, 0.06], [1, 0, 0.3], 0.012, 0.015, 0.28, { color: '#c8141e', mat: 'cloth', bone: 'hips', k: 0.003 });
    });
    // The rolled newspaper in the right fist.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      tube(s, G.at(-0.06), G.at(0.17), 0.016, 0.016, { color: '#ece6d6', mat: 'paper', k: 0.002 });
      for (const t of [0.07, 0.1, 0.13]) tube(s, G.at(t), G.at(t + 0.012), 0.0163, 0.0163, { color: '#5a5a5e', mat: 'paper', k: 0 });
    }));
  },
});
