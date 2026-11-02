import { cloth, cuffBand, hold, onBody, person, shell, strap } from './person.js';

/**
 * The Samba Dancer: off a float in the Sambódromo and not stopping for
 * anybody, in gold sequins and not a lot else, a headdress of feathers
 * twice her height, a back-piece of feathers fanned out behind like a
 * peacock's, gold at the wrists and ankles, the hips going on every beat
 * and the arms up. Feathers, sequins and a samba that does not stop for
 * anybody. About 1.6 tiles tall to the top of the feathers.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const SKIN = '#b87850';
const SEQUINS = (p) => {
  const g = 0.75 + 0.25 * Math.sin(p[0] * 300 + p[1] * 260 + p[2] * 280);
  return [0.95 * g, 0.72 * g, 0.2 * g];
};
const PLUMES = ['#ff3a8a', '#f0c020', '#3ac8e8', '#ff8a2a', '#8a3ad8'];

export default person({
  name: 'sambista',
  scale: 1.44,
  b: 0.92,
  shape: { legs: 1.1, girth: 0.86, hips: 1.04 },
  skin: SKIN,
  look: { torso: SKIN, sleeve: SKIN, cuff: SKIN, legs: SKIN, boot: '#e8b040', sole: '#c89020' },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', legs: 'skin', boot: 'metal' },
  face: { eyeColor: '#2a1a0a', brow: '#14100a', jaw: 0.9, blush: 0.6 },
  hair: { color: cloth('#14100a', '#0a0806'), locks: [[[0.08, 0.68, -0.04], [0.11, 0.5, -0.07], 0.035], [[-0.08, 0.68, -0.04], [-0.11, 0.5, -0.07], 0.035], [[0, 0.66, -0.1], [0, 0.53, -0.115], 0.045]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, beat = Math.sin(T * 10);
      // Samba: the hips going on every beat, the feet quick under them, the arms up and out.
      k.turn('hips', 0, beat * 0.2, beat * 0.08);
      k.turn('chest', 0, -beat * 0.1, 0);
      hold(k, 'armL', -0.3, 0, 2.2 + Math.sin(T * 2) * 0.2);
      hold(k, 'foreL', 0, 0, 0.4);
      hold(k, 'armR', -0.3, 0, -2.2 + Math.sin(T * 2) * 0.2);
      hold(k, 'foreR', 0, 0, -0.4);
      if (clip === 'idle') {
        hold(k, 'thighL', -Math.max(0, beat) * 0.3, 0, 0); hold(k, 'shinL', Math.max(0, beat) * 0.5, 0, 0);
        hold(k, 'thighR', -Math.max(0, -beat) * 0.3, 0, 0); hold(k, 'shinR', Math.max(0, -beat) * 0.5, 0, 0);
      }
    },
  },
  extras(s, J) {
    const G = { color: SEQUINS, mat: 'metal' };
    // Sequins: the bikini, cups and briefs fitted to her; thin gold straps over the shoulders and round the back.
    for (const m of [1, -1]) shell(s, (p) => Math.max(Math.hypot((p[0] - m * 0.042) / 0.043, (p[1] - 0.462) / 0.036) - 1, 0.02 - p[2]), { ...G, part: 'outer', thick: 0.006, lift: 0.001, bone: 'chest', k: 0.003 });
    strap(s, [[0.042, 0.495, 0.07], [0.055, 0.53, 0.04], [0.06, 0.553, 0.0], [0.05, 0.52, -0.06], [0.0, 0.47, -0.075], [-0.05, 0.52, -0.06], [-0.06, 0.553, 0.0], [-0.055, 0.53, 0.04], [-0.042, 0.495, 0.07]], { width: 0.005, thick: 0.002, color: '#e8b040', mat: 'metal', over: ['body', 'top', 'outer'], keep: TRUNK, part: 'straps' });
    strap(s, [[0.082, 0.45, 0.04], [0.09, 0.45, -0.02], [0.05, 0.455, -0.07], [0, 0.455, -0.078], [-0.05, 0.455, -0.07], [-0.09, 0.45, -0.02], [-0.082, 0.45, 0.04]], { width: 0.006, thick: 0.002, color: '#e8b040', mat: 'metal', over: ['body', 'top'], keep: TRUNK, part: 'straps' });
    shell(s, (p) => Math.max(p[1] - 0.342, 0.268 + Math.abs(p[0]) * 0.7 * (p[2] > 0 ? 1 : 0.55) - p[1]), { ...G, part: 'outer', thick: 0.006, lift: 0.001, bone: 'hips', k: 0.003 });
    // The jewelled belt over the hips, and the bead fringe swinging off it.
    strap(s, [[0, 0.33, 0.1], [0.085, 0.335, 0.065], [0.11, 0.34, 0.0], [0.085, 0.345, -0.065], [0, 0.35, -0.085], [-0.085, 0.345, -0.065], [-0.11, 0.34, 0.0], [-0.085, 0.335, 0.065], [0, 0.33, 0.1]], { ...G, width: 0.016, thick: 0.005, over: ['body', 'bottoms', 'outer'], keep: TRUNK, part: 'outer2', closed: true });
    const fringe = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; fringe.push([Math.sin(a) * 0.11, 0.33, Math.cos(a) * 0.1]); }
    const roots = onBody(s, fringe, ['outer2', 'outer', 'body', 'bottoms']);
    s.part('kit', () => {
      for (const h of roots) {
        const a = h.p.map((v, i) => v + h.n[i] * 0.006);
        s.limb(a, a.map((v, i) => v + [h.n[0] * 0.012, -0.07, h.n[2] * 0.012][i]), 0.0035, 0.005, { ...G, bone: 'hips', k: 0.001 });
      }
    });
    // The headdress: a jewelled band round the head, a stone at the brow, the plumes fanned up and out of it.
    strap(s, [[0, 0.73, 0.1], [0.08, 0.735, 0.07], [0.11, 0.74, 0.0], [0.08, 0.745, -0.075], [0, 0.75, -0.105], [-0.08, 0.745, -0.075], [-0.11, 0.74, 0.0], [-0.08, 0.735, 0.07], [0, 0.73, 0.1]], { ...G, width: 0.024, thick: 0.006, over: ['head', 'hair'], bone: 'head', part: 'outer', closed: true });
    s.part('kit', () => {
      s.sphere([0, 0.735, 0.112], 0.016, { color: '#3ac8e8', mat: 'glass', bone: 'head', k: 0.002 });
      for (let i = 0; i < 9; i++) {
        const a = -1.1 + (i / 8) * 2.2;
        s.flake([Math.sin(a) * 0.07, 0.78, 0.0], [Math.sin(a) * 0.3, 0.8 + Math.cos(a) * 0.42, -0.05], [0, 0, 1], 0.018, 0.05, 0.2, { color: PLUMES[i % 5], mat: 'cloth', bone: 'head', k: 0.004 });
      }
      // The back-piece: a gold plate between the shoulder blades and a fan of feathers up out of it, clear of the hair.
      s.ellipsoid([0, 0.44, -0.11], [0.045, 0.06, 0.012], { ...G, bone: 'chest', k: 0.004 });
      for (let i = 0; i < 11; i++) {
        const a = -1.35 + (i / 10) * 2.7;
        s.flake([Math.sin(a) * 0.04, 0.44, -0.125], [Math.sin(a) * 0.42, 0.44 + Math.cos(a) * 0.48, -0.22], [0, 0.15, 1], 0.02, 0.06, 0.2, { color: PLUMES[(i + 2) % 5], mat: 'cloth', bone: 'chest', k: 0.004 });
      }
    });
    // Gold cuffs and anklets.
    for (const S of ['L', 'R']) {
      cuffBand(s, J[`elbow${S}`], J[`wrist${S}`], 0.85, { width: 0.02, thick: 0.004, color: '#e8b040', mat: 'metal', bone: `fore${S}` });
      cuffBand(s, J[`knee${S}`], J[`ankle${S}`], 0.8, { width: 0.016, thick: 0.004, color: '#e8b040', mat: 'metal', bone: `shin${S}` });
    }
  },
});
