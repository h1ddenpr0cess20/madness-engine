import { bands } from '../../../models/skins.js';
import { cloth, person } from './person.js';

/**
 * The Headliner: a giant of a rock god, broad as a door at the shoulders
 * and narrow at the hips, bare arms like hams, a studded leather vest open
 * over a bare chest, a mane of teased blond hair, star-shaped shades, a
 * red-and-black striped spandex leg, platform boots, and a flying-V guitar
 * slung low with a lightning bolt down it. When he has had enough he stamps,
 * and the floor goes out from round him. The last boss: about 3 tiles tall.
 */

const leather = cloth('#1c1a20', '#08080a');
const spandex = bands(1, 0.05, '#d81c34', '#140a10', 0.5, 0.2);
const HAIR = { color: cloth('#f6dc78', '#c09a38'), mat: 'hair', bone: 'head' };
const V = { color: '#e8e4ec', mat: 'plastic', bone: 'chest' };

export default person({
  name: 'headliner',
  scale: 3.0,
  b: 1.75,
  skin: '#e4aa86',
  shape: { legs: 1.12, torso: 1.12, head: 0.9, girth: 1.18, hips: 0.95 },
  look: { torso: '#e4aa86', sleeve: '#e4aa86', cuff: '#e4aa86', legs: spandex, boot: '#101014', belt: '#101014', buckle: '#f0c040', sole: '#c81c34' },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', legs: 'leather', boot: 'leather' },
  face: { eyeColor: '#3a5a8a', brow: '#b08a38', mood: 1, jaw: 1.2 },
  style: {
    attack: 'smite', heavy: 1, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = (time + seed) * 3;
      // A rock stance: wide, one boot forward, the strumming arm sawing, the head banging.
      k.turn('thighL', -0.4, 0, 0.18);
      k.turn('shinL', 0.25, 0, 0);
      k.turn('thighR', 0.15, 0, -0.22);
      k.turn('armR', -0.55 + Math.sin(T * 3) * 0.14, 0, -0.15);
      k.turn('foreR', -1.0, 0, 0);
      k.turn('armL', -0.9, 0.3, 0.45);
      k.turn('foreL', -0.5, 0, 0);
      k.turn('head', 0.15 + Math.max(0, Math.sin(T * 1.5)) * 0.35, 0, 0);
      k.turn('chest', 0, Math.sin(T * 0.7) * 0.1, 0);
    },
  },
  extras(s, J) {
    s.part('hair', () => {
      // The mane: a crown teased up, and great hanks down over the shoulders and back.
      s.ellipsoid([0, 0.73, -0.02], [0.13, 0.11, 0.13], { ...HAIR, k: 0.03 });
      s.ellipsoid([0, 0.8, -0.03], [0.12, 0.07, 0.11], { ...HAIR, k: 0.04 });
      for (const m of [1, -1]) {
        s.flake([m * 0.1, 0.7, -0.01], [m * 0.15, 0.46, -0.04], [m, 0, 0.3], 0.05, 0.06, 0.35, { ...HAIR, k: 0.02 });
        s.flake([m * 0.06, 0.74, -0.08], [m * 0.1, 0.44, -0.14], [m * 0.3, 0, -1], 0.05, 0.06, 0.35, { ...HAIR, k: 0.02 });
      }
      s.flake([0, 0.76, -0.1], [0, 0.42, -0.16], [0, 0, -1], 0.09, 0.08, 0.35, { ...HAIR, k: 0.02 });
      // Off the face.
      s.box([0, 0.63, 0.16], [0.11, 0.08, 0.06], 0.03, { op: 'sub', k: 0.02 });
    });
    s.part('kit', () => {
      // An open leather vest, studs along its edges, and a studded belt.
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.075, 0.468, 0.006], [0.04, 0.075, 0.072], { color: leather, mat: 'leather', bone: 'chest', k: 0.012 });
        for (let i = 0; i < 4; i++) s.sphere([m * (0.045 + i * 0.003), 0.52 - i * 0.03, 0.07], 0.006, { color: '#e8e8f0', mat: 'metal', bone: 'chest', k: 0.001 });
      }
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        s.sphere([Math.sin(a) * 0.087 * 1.75 * 0.85, 0.338, Math.cos(a) * 0.08], 0.006, { color: '#e8e8f0', mat: 'metal', bone: 'hips', k: 0.001 });
      }
      // Star shades.
      for (const m of [1, -1]) {
        const c = [m * 0.042, 0.666, 0.104];
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          s.limb(c, [c[0] + Math.sin(a) * 0.03, c[1] + Math.cos(a) * 0.03, c[2]], 0.009, 0.002, { color: '#ff2d95', mat: 'glass', bone: 'head', k: 0.004 });
        }
      }
      // Wristbands.
      for (const S of ['L', 'R']) {
        const w = J[`wrist${S}`];
        s.cylinder(w, 0.026, 0.016, { color: '#101014', mat: 'leather', bone: `fore${S}`, k: 0.003, round: 0.004 });
      }
      // The flying V, slung low across him: the body at his right hip, the neck up to his left hand, the two
      // wings swept back from the neck in a white finish with a red bolt, and a pointed headstock.
      const j = [-0.04, 0.34, 0.135], head = [0.3, 0.5, 0.15];
      const d = [head[0] - j[0], head[1] - j[1]], L = Math.hypot(d[0], d[1]), back = Math.atan2(-d[1], -d[0]);
      for (const m of [1, -1]) {
        const a = back + m * 0.42;
        const tip = [j[0] + Math.cos(a) * 0.24, j[1] + Math.sin(a) * 0.24, j[2]];
        s.flake(j, tip, [0, 0, 1], 0.045, 0.028, 0.32, { ...V, k: 0.006 });
        s.limb([tip[0] - Math.cos(back) * 0.0, tip[1], j[2] + 0.012], [j[0] + Math.cos(a) * 0.06, j[1] + Math.sin(a) * 0.06, j[2] + 0.012], 0.006, 0.006, { color: '#e01c34', mat: 'plastic', bone: 'chest', k: 0.002 });
      }
      s.limb(j, head, 0.016, 0.013, { color: '#3a2412', mat: 'leather', bone: 'chest', k: 0.004 });
      s.flake(head, [head[0] + (d[0] / L) * 0.08, head[1] + (d[1] / L) * 0.08 + 0.01, head[2]], [0, 0, 1], 0.024, 0.012, 0.35, { color: '#101014', mat: 'plastic', bone: 'chest', k: 0.004 });
      // The strap across the chest.
      s.limb([0.12, 0.54, -0.02], [-0.1, 0.32, 0.11], 0.01, 0.01, { color: '#c81c34', mat: 'leather', bone: 'chest', k: 0.004 });
    });
  },
});
