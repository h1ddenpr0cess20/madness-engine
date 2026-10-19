import { grainy } from '../../../models/skins.js';
import { bones, joints, moveHumanoid, side } from './humanoid.js';

/**
 * The Robot Waiter: from the robot restaurant in Shinjuku, which is a man
 * in a costume made out of a boiler. A box of a body with dials and a
 * grille, a tin-can head with two glowing eyes and an aerial, arms and
 * legs of dryer hose, pincers for hands, boots like toasters, and a tray
 * held out on one pincer with a pot of tea on it. Walks as if the joints
 * were rusted, because they are. Beep. Boop. Your table is ready. You are
 * not. About 1 tile tall.
 */

const B = 1.12;
const TIN = grainy('#b8bcc4', 0.08, 50);
const HOSE = grainy('#9aa0aa', 0.05, 30);

export default {
  name: 'robot',
  scale: 1.55,
  cell: 0.0085,
  cells: { kit: 0.0045, fine: 0.003 },
  budget: 12000,
  bones: bones(B),
  materials: {
    tin: { roughness: 0.32, metalness: 0.9 },
    hose: { roughness: 0.45, metalness: 0.7 },
    dark: { roughness: 0.6 },
    glow: { roughness: 0.4, emissive: '#ffb030', emissiveIntensity: 2.2 },
    red: { roughness: 0.4, emissive: '#ff3030', emissiveIntensity: 1.8 },
    glass: { roughness: 0.05, clearcoat: 1, metalness: 0.2 },
  },
  sculpt(s) {
    const J = joints(B);
    // The body: a box, its front a panel of dials, a grille, a row of rivets.
    s.box([0, 0.45, 0.004], [0.11 * B, 0.09, 0.075], 0.02, { color: TIN, mat: 'tin', bone: 'chest', k: 0.01 });
    s.box([0, 0.33, 0], [0.085 * B, 0.04, 0.06], 0.015, { color: TIN, mat: 'tin', bone: 'hips', k: 0.01 });
    // The waist: a bellows.
    for (let i = 0; i < 3; i++) s.torus([0, 0.36 + i * 0.012, 0], 0.062, 0.008, { color: HOSE, mat: 'hose', bone: 'spine', k: 0.004 });
    // The shoulders: bolts, big ones.
    for (const m of [1, -1]) {
      const S = side(m);
      s.sphere(J[`shoulder${S}`], 0.04, { color: TIN, mat: 'tin', bone: `arm${S}`, k: 0.01 });
      // Arms and legs of dryer hose: a tube ribbed with rings.
      const hose = (a, b, r, bone, n) => {
        s.limb(a, b, r, r, { color: HOSE, mat: 'hose', bone, k: 0.004 });
        for (let j = 1; j < n; j++) {
          const t = j / n;
          const c = a.map((v, i) => v + (b[i] - v) * t);
          const d = b.map((v, i) => v - a[i]);
          s.torus(c, r, 0.006, { color: HOSE, mat: 'hose', bone, k: 0.003, rot: [Math.atan2(Math.hypot(d[0], d[1]), d[2]) - Math.PI / 2, 0, -Math.atan2(d[0], d[1])] });
        }
      };
      hose(J[`shoulder${S}`], J[`elbow${S}`], 0.026, `arm${S}`, 4);
      s.sphere(J[`elbow${S}`], 0.03, { color: TIN, mat: 'tin', bone: `fore${S}`, k: 0.006 });
      hose(J[`elbow${S}`], J[`wrist${S}`], 0.023, `fore${S}`, 4);
      // A pincer.
      const h = J[`hand${S}`];
      s.cylinder(J[`wrist${S}`], 0.026, 0.012, { color: TIN, mat: 'tin', bone: `hand${S}`, k: 0.004 });
      for (const z of [1, -1]) s.flake([h[0], h[1] + 0.01, h[2] + z * 0.01], [h[0], h[1] - 0.045, h[2] + z * 0.024], [0, 0, z], 0.012, 0.007, 0.4, { color: TIN, mat: 'tin', bone: `hand${S}`, k: 0.004 });
      hose([J[`hip${S}`][0], 0.3, 0], J[`knee${S}`], 0.032, `thigh${S}`, 4);
      s.sphere(J[`knee${S}`], 0.036, { color: TIN, mat: 'tin', bone: `shin${S}`, k: 0.006 });
      hose(J[`knee${S}`], J[`ankle${S}`].map((v, i) => (i === 1 ? v + 0.03 : v)), 0.03, `shin${S}`, 4);
      // A boot like a toaster.
      const a = J[`ankle${S}`];
      s.box([a[0], 0.035, a[2] + 0.025], [0.04, 0.035, 0.065], 0.012, { color: TIN, mat: 'tin', bone: `foot${S}`, k: 0.006 });
    }
    // The neck, a short hose, and the head: a tin can.
    s.limb([0, 0.53, 0], [0, 0.6, 0], 0.03, 0.03, { color: HOSE, mat: 'hose', bone: 'neck', k: 0.004 });
    s.cylinder([0, 0.67, 0.005], 0.085, 0.07, { color: TIN, mat: 'tin', bone: 'head', k: 0.006, round: 0.012 });
    s.torus([0, 0.735, 0.005], 0.08, 0.008, { color: TIN, mat: 'tin', bone: 'head', k: 0.003 });
    for (const m of [1, -1]) s.cylinder([m * 0.09, 0.67, 0.005], 0.02, 0.012, { color: TIN, mat: 'tin', bone: 'head', k: 0.003, rot: [0, 0, Math.PI / 2] });
    s.part('kit', () => {
      // Dials and a grille on the front, rivets round the edge.
      for (const x of [-0.05, 0.0, 0.05]) s.cylinder([x, 0.48, 0.082], 0.016, 0.005, { color: '#e8e4d8', mat: 'glass', bone: 'chest', k: 0.002, rot: [Math.PI / 2, 0, 0] });
      for (let i = 0; i < 4; i++) s.box([0, 0.41 + i * 0.012, 0.08], [0.05, 0.003, 0.004], 0.002, { color: '#2a2c30', mat: 'dark', bone: 'chest', k: 0.001 });
      for (const x of [-0.105, 0.105]) for (const y of [0.38, 0.45, 0.52]) s.sphere([x * B, y, 0.078], 0.006, { color: TIN, mat: 'tin', bone: 'chest', k: 0.001 });
      // The face: a grille for a mouth, an aerial with a ball on it.
      for (let i = 0; i < 4; i++) s.box([0, 0.625 + i * 0.01, 0.09], [0.03, 0.003, 0.004], 0.001, { color: '#2a2c30', mat: 'dark', bone: 'head', k: 0.001 });
      s.limb([0.03, 0.74, 0], [0.04, 0.84, 0], 0.004, 0.003, { color: TIN, mat: 'tin', bone: 'head', k: 0.002 });
      // The tray on the left pincer, and the teapot on it. The forearm is held out level, so what is up for
      // the tray is forward as sculpted.
      const h = J.handL, up = (d, x = 0, y = 0) => [h[0] + x, h[1] - 0.03 + y, h[2] + 0.03 + d];
      s.cylinder(up(0), 0.07, 0.004, { color: '#2a2c30', mat: 'dark', bone: 'handL', k: 0.002, round: 0.003, rot: [Math.PI / 2, 0, 0] });
      s.sphere(up(0.035), 0.032, { color: '#c8402a', mat: 'glass', bone: 'handL', k: 0.006 });
      s.limb(up(0.03, 0, -0.03), up(0.05, 0, -0.06), 0.007, 0.005, { color: '#c8402a', mat: 'glass', bone: 'handL', k: 0.003 });
      s.sphere(up(0.07), 0.008, { color: '#c8402a', mat: 'glass', bone: 'handL', k: 0.002 });
      s.cylinder(up(0.015, 0.04, 0.03), 0.012, 0.012, { color: '#f4f2ec', mat: 'glass', bone: 'handL', k: 0.002, round: 0.003, rot: [Math.PI / 2, 0, 0] });
    });
    s.part('fine', () => {
      for (const m of [1, -1]) {
        s.cylinder([m * 0.035, 0.685, 0.088], 0.019, 0.004, { color: '#2a2c30', mat: 'dark', bone: 'head', k: 0.001, rot: [Math.PI / 2, 0, 0] });
        s.sphere([m * 0.035, 0.685, 0.09], 0.014, { color: '#ffb030', mat: 'glow', bone: 'head', k: 0.001 });
      }
      s.sphere([0.04, 0.85, 0], 0.012, { color: '#ff3030', mat: 'red', bone: 'head', k: 0.001 });
      // The needles in the dials.
      for (const x of [-0.05, 0.0, 0.05]) s.box([x + 0.004, 0.484, 0.088], [0.008, 0.0015, 0.001], 0.0005, { color: '#d02020', mat: 'dark', bone: 'chest', k: 0, rot: [0, 0, 0.6 + x * 10] });
    });
  },
  animate(k, state) {
    moveHumanoid(k, { ...state, speed: (state.speed ?? 1) * 0.7 }, {
      attack: 'smite', heavy: 0.8, twist: 0,
      after(kk, { clip, time, seed }) {
        if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
        const T = time + seed;
        // Stiff: the arms bent at right angles, the head turning in jerks.
        kk.turn('armR', -0.2, 0, -0.25);
        kk.turn('armL', -0.2, 0, 0.25);
        kk.turn('foreR', -1.5, 0, 0);
        kk.turn('foreL', -1.5, 0, 0);
        kk.turn('head', 0, Math.round(Math.sin(T * 0.6) * 3) * 0.2, 0);
      },
    });
  },
};
