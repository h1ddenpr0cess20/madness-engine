import { mix, smooth } from '../models/skins.js';
import { rgb } from '../models/sdf.js';
import { bird, plumed } from './bird.js';

/**
 * The Animatronic Parrot: the parrot for the pirate picture, an Amazon,
 * feathers glued over a fibreglass shell. Green all over with every
 * feather edged in black, a blue forehead and a yellow face, a bold white
 * ring round each orange glass eye, a grey hooked beak that opens and
 * shuts on a servo, red at the bend of the wing and a red flash in it,
 * blue-black wing tips, and a square tail tipped yellow. The screws show
 * at the shoulders and a seam runs round its neck, and it flies on a rod
 * out of its back. It squawks its lines, better than the leads. About 0.7
 * tiles across; a flyer, so its origin is its middle.
 */

const GREEN = rgb('#3a9a32'), DEEP = rgb('#2a7a2a'), LIME = rgb('#86c040'), YELLOW = rgb('#f2d424'), BLUE = rgb('#3aa6d6');
const RED = rgb('#e2321e'), INK = rgb('#1c2a62');
const H = [0, 0.06, 0.087], HR = 0.029;

const COAT = (() => {
  const green = plumed((p, n) => mix(mix(GREEN, DEEP, smooth(0.3, 0.9, n[1]) * 0.5), LIME, smooth(-0.2, -0.75, n[1]) * 0.6), { size: 0.011, edge: 0.5, vary: 0.06 });
  return (p, n) => {
    const q = [p[0] - H[0], p[1] - H[1], p[2] - H[2]];
    // The blue forehead, the yellow crown and cheeks, behind them the green.
    const onHead = smooth(-1.1 * HR, -0.3 * HR, q[2] + q[1] * 0.5 + Math.abs(q[0]) * 0.3) * smooth(-0.9 * HR, -0.45 * HR, q[1]);
    const front = smooth(0.35 * HR, 0.6 * HR, q[2]) * smooth(0.05 * HR, 0.3 * HR, q[1]);
    let c = green(p, n);
    c = mix(c, YELLOW, onHead * 0.95);
    c = mix(c, BLUE, front);
    // The seam of the shell round the neck.
    const seam = smooth(0.0016, 0.0006, Math.abs(p[2] - 0.052 + p[1] * 0.35));
    return mix(c, rgb('#2a2622'), seam * smooth(0.03, 0.05, p[1] + 0.02));
  };
})();

const LEAD = (p, n) => mix(COAT(p, n), RED, smooth(0.07, 0.09, Math.abs(p[0])) * smooth(0.135, 0.115, Math.abs(p[0])));
const SEC = (p, n, t) => (n[1] < -0.2 ? DEEP : mix(RED, INK, smooth(0.42, 0.55, t)));
const PRIM = (p, n, t) => (n[1] < -0.2 ? DEEP : mix(GREEN, INK, smooth(0.25, 0.5, t)));
const TAIL = (p, n, t, f) => {
  const c = Math.abs(f) > 0.55 && t < 0.35 ? RED : GREEN;
  return mix(c, mix(LIME, YELLOW, 0.4), smooth(0.66, 0.74, t));
};

export default bird({
  name: 'parrot',
  scale: 1.5,
  budget: 53000,
  body: { r: [0.046, 0.048, 0.074] },
  head: { r: HR, at: H, crown: 0.9 },
  beak: { len: 0.032, depth: 0.026, width: 0.019, tilt: 0.3, curve: 1.45, power: 2.2, y: 0.02, bulk: 0.9, upper: '#7a726c', lower: '#5e5854', low: { len: 0.72, depth: 0.95, curve: -0.7 }, cere: { color: '#5a5450', size: 0.85 }, nostrils: false },
  eye: { r: 0.0058, iris: '#f27a16', pupil: 0.36, ring: '#f2eee6', ringW: 0.38, look: [0.84, 0.12, 0.52] },
  wing: { arm: 0.15, chord: 0.07, primary: 0.112, nP: 9, nS: 9, fingers: 0.25, round: 0.55, colors: { leading: LEAD, lesser: LEAD, median: COAT, greater: COAT, tertials: COAT, secondaries: SEC, coverts: COAT, primaries: PRIM, alula: PRIM } },
  tail: { len: 0.07, width: 0.0115, count: 12, spread: 0.36, shape: (f) => 1 - 0.08 * f * f, color: TAIL },
  feet: { color: '#6a6a72', claw: '#2a2a2e', zygo: true },
  plumage: COAT,
  materials: { metal: { roughness: 0.3, metalness: 1 }, eye: { roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0 } },
  style: { rate: 9, amp: 0.8, after(k, { clip }, T) {
    // The servo: the beak snapping open and shut on its lines, the head in jerks.
    if (clip === 'idle' || clip === 'walk') k.turn('jaw', Math.sin(T * 7) > 0.3 ? 0.3 : 0, 0, 0);
  } },
  extras(s, F, { pl }) {
    s.part('kit', () => {
      for (const m of [1, -1]) {
        // The screws at the shoulders: it is a machine.
        const at = [F.wings[m].S[0] + m * 0.012, F.wings[m].S[1] + 0.0115, F.wings[m].S[2] - 0.002];
        s.cylinder(at, 0.0045, 0.0018, { color: '#c8ccd4', mat: 'metal', bone: `arm${m > 0 ? 'L' : 'R'}`, k: 0.0004, round: 0.0008 });
        s.box(add3(at, [0, 0.0018, 0]), [0.0034, 0.0006, 0.0007], 0.0003, { op: 'sub', k: 0.0002, rot: [0, 0.6, 0] });
      }
      // The rod it flies on, out of its back, and the eye at the top for the rig.
      s.limb([0, F.B.r[1] * 0.6, -0.008], [0, 0.11, -0.012], 0.0028, 0.0024, { color: '#8a8c94', mat: 'metal', bone: 'body', k: 0.003 });
      s.cylinder([0, F.B.r[1] * 0.92, -0.008], 0.008, 0.0025, { color: '#6a6c74', mat: 'metal', bone: 'body', k: 0.001, round: 0.001 });
      s.torus([0, 0.12, -0.012], 0.007, 0.0018, { color: '#8a8c94', mat: 'metal', bone: 'body', k: 0.001, rot: [0, 0, Math.PI / 2] });
    });
    void pl;
  },
});

function add3(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
