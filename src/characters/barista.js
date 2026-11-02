import { rgb } from '../models/sdf.js';
import { cloth, hold, person, shell, strap } from './person.js';
import { beanie } from './metalwear.js';
import { beard } from './wardrobe.js';

/**
 * The Barista: has opinions about your order and will make it anyway. A
 * mustard beanie, a trim beard, a black tee, a canvas apron over it with a
 * pocket and a pen in the pocket, its strap round the neck and its ties at
 * the back; a sleeve of ink down the right forearm; a tea towel over the
 * shoulder; and a takeaway cup in hand, lid on, sleeve round it, your name
 * spelled wrong on it. About 0.95 tiles tall.
 */

const BLACK = cloth('#1a1a1e', '#0e0e10');
const DENIM = cloth('#3a4a6a', '#2a3450');
const CANVAS = cloth('#a8784a', '#86603a', { freq: 30, grain: 0.06 });

export default person({
  name: 'barista',
  scale: 1.44,
  b: 0.98,
  budget: 110000,
  shape: { legs: 1.04, girth: 0.94 },
  skin: '#d8a888',
  look: { torso: BLACK, sleeve: BLACK, cuff: BLACK, legs: DENIM, boot: '#f0eee8', sole: '#2a2a2a', belt: '#2a1a10', buckle: '#a8a8a8' },
  face: { eyeColor: '#4a3a2a', brow: '#3a2414', mood: 1, jaw: 1.04 },
  hair: { color: cloth('#4a2c16', '#30180a'), cap: [0.104, 0.08, 0.104] },
  style: {
    attack: 'swing', twist: 0.2,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The cup held out to you in the right hand; the left on the hip; the head on one side.
      hold(k, 'armR', -0.6, 0, -0.08);
      hold(k, 'foreR', -0.9, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.45);
      hold(k, 'foreL', -1.4, 0.6, 0);
      k.turn('head', 0, Math.sin(T * 0.4) * 0.12, 0.12);
    },
  },
  extras(s, J, { pose }) {
    beanie(s, { color: '#d8a028', fold: '#c89018' });
    beard(s, { color: '#4a2c16', thick: 0.005 });
    // The apron: canvas over the front from the chest to the knee, its neck strap and its ties; a pocket with a pen in it.
    const front = (sh) => !/^(arm|fore|hand|head|neck)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    shell(s, (p) => Math.max(0.2 - p[1], p[1] - 0.5, -p[2] + 0.02, Math.abs(p[0]) - 0.1 - Math.max(0, 0.38 - p[1]) * 0.25), {
      color: CANVAS, mat: 'cloth', thick: 0.005, lift: 0.004, over: ['body', 'top', 'bottoms', 'belt'], keep: front,
      bones: { chest: (p) => 0.42 - p[1], spine: (p) => Math.abs(p[1] - 0.36) - 0.06, hips: (p) => p[1] - 0.3 },
    });
    strap(s, [[0.07, 0.5, 0.075], [0.06, 0.56, 0.02], [0, 0.585, -0.06], [-0.06, 0.56, 0.02], [-0.07, 0.5, 0.075]], { width: 0.012, thick: 0.004, color: CANVAS, mat: 'cloth' });
    strap(s, [[0.1, 0.33, 0.06], [0.11, 0.335, -0.04], [0, 0.33, -0.1], [-0.11, 0.335, -0.04], [-0.1, 0.33, 0.06]], { width: 0.01, thick: 0.004, color: CANVAS, mat: 'cloth' });
    s.paint((p) => Math.max(Math.abs(p[0] + 0.035) - 0.03, Math.abs(p[1] - 0.44) - 0.022, 0.05 - p[2]), '#8a5a32', 0.0012);
    s.part('kit', () => {
      s.limb([-0.045, 0.445, 0.098], [-0.045, 0.485, 0.096], 0.0038, 0.0034, { color: '#1a1a1e', mat: 'plastic', bone: 'chest', k: 0.001 });
      // The tea towel over the left shoulder, hanging down front and back.
      s.flake([0.075, 0.57, 0.0], [0.09, 0.47, 0.085], [1, 0.3, 0], 0.024, 0.026, 0.25, { color: (p) => (((p[1] * 60) % 1 + 1) % 1 < 0.2 ? rgb('#3a6ad8') : rgb('#f2f0ea')), mat: 'cloth', bone: 'chest', k: 0.004 });
      s.flake([0.075, 0.57, 0.0], [0.09, 0.48, -0.085], [1, 0.3, 0], 0.024, 0.026, 0.25, { color: (p) => (((p[1] * 60) % 1 + 1) % 1 < 0.2 ? rgb('#3a6ad8') : rgb('#f2f0ea')), mat: 'cloth', bone: 'chest', k: 0.004 });
    });
    // The ink down the right forearm: swirls and a few stars, dark on the skin.
    const e = J.elbowR, w = J.wristR;
    s.paint((p) => {
      const ab = [w[0] - e[0], w[1] - e[1], w[2] - e[2]], L = Math.hypot(...ab);
      const t = ((p[0] - e[0]) * ab[0] + (p[1] - e[1]) * ab[1] + (p[2] - e[2]) * ab[2]) / (L * L);
      if (t < 0.1 || t > 0.85) return 0.01;
      const q = [e[0] + ab[0] * t, e[1] + ab[1] * t, e[2] + ab[2] * t];
      if (Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > 0.05) return 0.01;
      const a = Math.atan2(p[2] - q[2], p[0] - q[0]);
      return Math.abs(Math.sin(a * 2 + t * 18) * 0.5 + Math.sin(t * 40) * 0.3) - 0.18;
    }, '#2a3040', 0.002);

    // The cup: tapered paper, a cardboard sleeve, a white lid with its sip hole, a name scrawled on it.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      // Upright through the fist, thumb over the top: its axis the way through the hand.
      const up = G.along, side = G.out;
      const base = G.at(-0.065, 0, -0.004);
      const at = (h) => base.map((v, i) => v + up[i] * h);
      const along = side;
      // A frustum along the cup's axis: r0 at the foot to r1 at h.
      const frustum = (h0, h1, r0, r1, round, o) => s.shape((p) => {
        const v = [p[0] - base[0], p[1] - base[1], p[2] - base[2]];
        const y = v[0] * up[0] + v[1] * up[1] + v[2] * up[2];
        const rr = Math.hypot(v[0] - up[0] * y, v[1] - up[1] * y, v[2] - up[2] * y);
        const t = Math.min(1, Math.max(0, (y - h0) / (h1 - h0))), R = r0 + (r1 - r0) * t;
        const dr = rr - R + round, dy = Math.max(h0 - y, y - h1) + round;
        return Math.min(Math.max(dr, dy), 0) + Math.hypot(Math.max(dr, 0), Math.max(dy, 0)) - round;
      }, [base.map((v) => v - 0.2), base.map((v) => v + 0.2)], { ...o, k: 0.001 });
      frustum(0, 0.13, 0.025, 0.033, 0.002, { color: '#f4f2ec', mat: 'paper' });
      frustum(0.04, 0.09, 0.0295, 0.0325, 0.001, { color: '#a8784a', mat: 'paper' });
      frustum(0.128, 0.142, 0.035, 0.032, 0.003, { color: '#f8f8f6', mat: 'plastic' });
      s.sphere(at(0.142).map((v, i) => v + along[i] * 0.018), 0.006, { op: 'sub', k: 0.001 });
    }));
  },
});
