import { bands } from '../models/skins.js';
import { buttons, cloth, cuffBand, person, shell } from './person.js';
import { guitar } from './metalwear.js';

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
  extras(s, J, { pose }) {
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
    // An open leather vest, studs along its edges; studs round the belt.
    shell(s, (p) => Math.max(0.33 - p[1], p[1] - 0.548, Math.min(0.034 + (p[1] - 0.33) * 0.2 - Math.abs(p[0]), p[2] - 0.02), -Math.hypot(Math.abs(p[0]) - 0.112, (p[1] - 0.49) * 0.8) + 0.044), {
      color: leather, mat: 'leather', part: 'top', thick: 0.006, lift: 0.0015, over: ['body', 'belt'], keep: (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]), bones: { spine: (p) => p[1] - 0.445, chest: (p) => 0.425 - p[1] },
    });
    const edge = [];
    for (let i = 0; i < 5; i++) for (const m of [1, -1]) edge.push([m * (0.05 + i * 0.006), 0.53 - i * 0.035, 0.08]);
    buttons(s, edge, { r: 0.0055, color: '#e8e8f0', over: ['top'] });
    const studs = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; if (Math.cos(a) > 0.93) continue; studs.push([Math.sin(a) * 0.1, 0.352, Math.cos(a) * 0.09]); }
    buttons(s, studs, { r: 0.0048, color: '#e8e8f0', over: ['belt'] });
    // Star shades: a pink star round each eye, in front of it.
    for (const e of s.eyes ?? []) {
      const c = [e[0], e[1] + 0.002, e[2] + 0.03];
      s.part('kit', () => {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          s.limb(c, [c[0] + Math.sin(a) * 0.03, c[1] + Math.cos(a) * 0.03, c[2] - 0.004], 0.009, 0.002, { color: '#ff2d95', mat: 'glass', bone: 'head', k: 0.004 });
        }
      });
    }
    // Wristbands round both wrists.
    for (const S of ['L', 'R']) cuffBand(s, J[`elbow${S}`], J[`wrist${S}`], 0.82, { width: 0.03, thick: 0.006, color: '#101014', bone: `fore${S}` });
    // The flying V, white with a red finish, its neck up to his left hand.
    guitar(s, { body: '#e8e4ec', style: 'v', neck: '#3a2412', pose });
  },
});
