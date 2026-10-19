import { coat, grainy, ramp } from '../models/skins.js';

/**
 * The goblin: a sneaky little thing, hunched over on bent knees, with a big
 * head (a third of it), long drooping ears, a hooked nose, a snaggle-toothed
 * grin and yellow cat's eyes that glow. Skinny limbs, knobbly knees, big
 * clawed hands and feet; a ragged leather tunic, a belt with a pouch, and a
 * crude curved dagger. Faces +z, feet on y = 0, 0.6 tiles tall.
 */

const side = (s) => (s > 0 ? 'L' : 'R');
const unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const add = (a, b, t = 1) => a.map((v, i) => v + b[i] * t);

// Skin: olive, darker on the top of the head and back, yellower underneath.
const skinBase = coat({ over: '#4f6a26', under: '#a2ab55', vary: 0.16, freq: 10, grain: 0.05, gfreq: 90, edge: [-0.55, 0.6] });
const skin = (p, n) => {
  const c = skinBase(p, n);
  // A little darker toward the crown and the knuckles of the spine.
  const k = 1 - Math.max(0, Math.min(1, (p[1] - 0.47) / 0.12)) * 0.25;
  return c.map((v) => v * k);
};
const leather = coat({ over: '#5b3b22', under: '#3a2414', vary: 0.22, freq: 16, grain: 0.1, gfreq: 70 });
const darkLeather = coat({ over: '#3c2617', under: '#24160d', vary: 0.18, freq: 14, grain: 0.08 });
const pouchLeather = coat({ over: '#7d5735', under: '#4e3320', vary: 0.2, freq: 18, grain: 0.1 });
const wrap = coat({ over: '#8a7a5c', under: '#5b4d38', vary: 0.25, freq: 20, grain: 0.12, gfreq: 120 });
const claw = ramp(1, 0, 1, '#2c241c', '#2c241c');
const rust = grainy('#8a8e94', 0.25, 30);
const tooth = grainy('#dccf98', 0.08, 80);

export default {
  name: 'goblin',
  scale: 1,
  cell: 0.0074,
  cells: { eyes: 0.0022, irises: 0.0013, pupils: 0.001, teeth: 0.0018, ears: 0.0032, claws: 0.0022, hands: 0.0042, gear: 0.0035, blade: 0.0022, cloth: 0.0045 },
  bones: [
    ['root', null, [0, 0, 0]],
    ['hips', 'root', [0, 0.21, -0.01]],
    ['chest', 'hips', [0, 0.29, 0]],
    ['head', 'chest', [0, 0.41, 0.06]],
    ['jaw', 'head', [0, 0.45, 0.1]],
    ['earL', 'head', [0.075, 0.505, 0.07]],
    ['earR', 'head', [-0.075, 0.505, 0.07]],
    ['shL', 'chest', [0.08, 0.37, 0.035]],
    ['elL', 'shL', [0.118, 0.285, 0.02]],
    ['haL', 'elL', [0.13, 0.205, 0.065]],
    ['shR', 'chest', [-0.08, 0.37, 0.035]],
    ['elR', 'shR', [-0.118, 0.285, 0.02]],
    ['haR', 'elR', [-0.13, 0.205, 0.065]],
    ['thL', 'hips', [0.055, 0.2, -0.01]],
    ['knL', 'thL', [0.075, 0.12, 0.055]],
    ['ftL', 'knL', [0.07, 0.04, -0.005]],
    ['thR', 'hips', [-0.055, 0.2, -0.01]],
    ['knR', 'thR', [-0.075, 0.12, 0.055]],
    ['ftR', 'knR', [-0.07, 0.04, -0.005]],
  ],
  materials: {
    skin: { roughness: 0.52, clearcoat: 0.18, clearcoatRoughness: 0.5, sheen: 0.25, sheenColor: '#b8c890', sheenRoughness: 0.6 },
    leather: { roughness: 0.72, sheen: 0.3, sheenColor: '#8a6a4a', sheenRoughness: 0.5 },
    cloth: { roughness: 0.9, sheen: 0.5, sheenColor: '#b0a080', sheenRoughness: 0.7 },
    metal: { metalness: 0.75, roughness: 0.42 },
    claw: { roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 },
    tooth: { roughness: 0.32, clearcoat: 0.6 },
    mouth: { roughness: 0.4, clearcoat: 0.8 },
    eye: { roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, emissive: '#ffb000', emissiveIntensity: 0.12 },
    iris: { roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.03, emissive: '#ffc21a', emissiveIntensity: 1.1 },
    pupil: { roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 },
  },
  sculpt(s) {
    const S = { color: skin, mat: 'skin' };
    const L = { color: leather, mat: 'leather' };

    // ——— Body: a pot belly, a narrow chest pitched forward, a hunched back.
    s.ellipsoid([0, 0.215, -0.01], [0.068, 0.05, 0.058], { ...S, bone: 'hips', k: 0.03 });
    s.ellipsoid([0, 0.27, 0.02], [0.068, 0.068, 0.064], { ...L, bone: 'hips', k: 0.04 });
    s.ellipsoid([0, 0.335, 0.025], [0.078, 0.06, 0.06], { ...L, bone: 'chest', k: 0.04, rot: [0.45, 0, 0] });
    s.ellipsoid([0, 0.35, -0.02], [0.066, 0.06, 0.052], { ...L, bone: 'chest', k: 0.04, rot: [0.3, 0, 0] });
    // Neck, thrust forward.
    s.limb([0, 0.36, 0.035], [0, 0.425, 0.085], 0.034, 0.03, { ...S, bone: 'head', k: 0.03 });

    // ——— Head: a big bulb of a skull, wide at the temples.
    s.ellipsoid([0, 0.5, 0.085], [0.088, 0.078, 0.084], { ...S, bone: 'head', k: 0.03 });
    s.ellipsoid([0, 0.535, 0.06], [0.072, 0.05, 0.07], { ...S, bone: 'head', k: 0.04 });
    // Cheeks and a heavy brow.
    s.mirror((m) => s.ellipsoid([m * 0.052, 0.462, 0.13], [0.04, 0.034, 0.04], { ...S, bone: 'head', k: 0.035 }));
    s.mirror((m) => s.ellipsoid([m * 0.036, 0.528, 0.152], [0.04, 0.014, 0.024], { ...S, bone: 'head', k: 0.025, rot: [0.1, 0, m * -0.32] }));
    // Muzzle: the upper lip pushed forward.
    s.ellipsoid([0, 0.448, 0.15], [0.058, 0.03, 0.045], { ...S, bone: 'head', k: 0.03 });
    // The long hooked nose.
    s.chain([[0, 0.515, 0.162], [0, 0.5, 0.2], [0, 0.475, 0.232], [0, 0.448, 0.24]], [0.016, 0.018, 0.015, 0.009], { ...S, bone: 'head', k: 0.015 });
    s.mirror((m) => s.ellipsoid([m * 0.014, 0.468, 0.212], [0.013, 0.011, 0.014], { ...S, bone: 'head', k: 0.012 }));
    // The jaw, and a wide slit of a mouth.
    s.ellipsoid([0, 0.425, 0.12], [0.06, 0.028, 0.052], { ...S, bone: 'jaw', k: 0.03 });
    s.ellipsoid([0, 0.418, 0.155], [0.032, 0.022, 0.022], { ...S, bone: 'jaw', k: 0.02 });
    s.ellipsoid([0, 0.437, 0.165], [0.054, 0.0055, 0.03], { op: 'sub', k: 0.006, rot: [0.05, 0, 0] });
    s.paint((p) => Math.hypot(p[0] / 1.6, (p[1] - 0.437) * 1.5, Math.max(0, 0.15 - p[2])) - 0.03, '#2a0a08', 0.004);
    // Eye sockets.
    s.mirror((m) => s.sphere([m * 0.04, 0.503, 0.158], 0.02, { op: 'sub', k: 0.01 }));
    // Ear roots, melted into the skull: the flaps are their own part.
    s.mirror((m) => s.limb([m * 0.07, 0.505, 0.07], [m * 0.1, 0.505, 0.06], 0.022, 0.016, { ...S, bone: `ear${side(m)}`, k: 0.02 }));

    // ——— Arms: skinny, with knobbly elbows.
    s.mirror((m) => {
      const b = side(m);
      s.sphere([m * 0.075, 0.368, 0.03], 0.03, { ...S, bone: `sh${b}`, k: 0.03 });
      s.limb([m * 0.08, 0.365, 0.035], [m * 0.118, 0.285, 0.02], 0.022, 0.016, { ...S, bone: `sh${b}`, k: 0.02 });
      s.sphere([m * 0.119, 0.283, 0.015], 0.017, { ...S, bone: `el${b}`, k: 0.012 });
      s.limb([m * 0.118, 0.285, 0.02], [m * 0.13, 0.21, 0.062], 0.016, 0.014, { ...S, bone: `el${b}`, k: 0.015 });
    });

    // ——— Legs: bent, skinny, with big knobbly knees and long feet.
    s.mirror((m) => {
      const b = side(m);
      s.limb([m * 0.055, 0.205, -0.01], [m * 0.075, 0.12, 0.055], 0.03, 0.02, { ...S, bone: `th${b}`, k: 0.025 });
      s.sphere([m * 0.076, 0.122, 0.064], 0.022, { ...S, bone: `kn${b}`, k: 0.012 });
      s.limb([m * 0.075, 0.12, 0.055], [m * 0.07, 0.04, -0.005], 0.019, 0.013, { ...S, bone: `kn${b}`, k: 0.015 });
      // Foot: a long flat foot with a bony heel and three long toes.
      s.ellipsoid([m * 0.072, 0.02, 0.025], [0.026, 0.017, 0.05], { ...S, bone: `ft${b}`, k: 0.02, rot: [0.05, m * 0.12, 0] });
      s.sphere([m * 0.069, 0.022, -0.016], 0.016, { ...S, bone: `ft${b}`, k: 0.015 });
      for (const t of [-1, 0, 1]) {
        const x = m * 0.072 + t * 0.015 + m * 0.008;
        s.limb([x, 0.016, 0.06], [x + t * 0.008 + m * 0.006, 0.01, 0.092], 0.0095, 0.0075, { ...S, bone: `ft${b}`, k: 0.008 });
      }
    });

    // ——— Hands: big, bony, three long fingers and a thumb; leather wraps at the wrists hide the seam.
    s.part('hands', () => s.mirror((m) => {
      const b = `ha${side(m)}`;
      s.limb([m * 0.128, 0.225, 0.054], [m * 0.13, 0.205, 0.064], 0.016, 0.016, { ...S, bone: `el${side(m)}`, k: 0.01 });
      s.ellipsoid([m * 0.133, 0.183, 0.075], [0.02, 0.027, 0.024], { ...S, bone: b, k: 0.012, rot: [0.3, 0, m * 0.15] });
      for (const t of [-1, 0, 1]) {
        const a = [m * (0.133 + t * 0.002), 0.165, 0.078 + t * 0.012];
        const mid = [m * (0.14 + t * 0.002), 0.142, 0.083 + t * 0.016];
        const tip = [m * (0.137 + t * 0.001), 0.128, 0.094 + t * 0.017];
        s.chain([a, mid, tip], [0.0072, 0.006, 0.005], { ...S, bone: b, k: 0.006 });
      }
      s.chain([[m * 0.125, 0.185, 0.09], [m * 0.122, 0.17, 0.106], [m * 0.123, 0.158, 0.112]], [0.0075, 0.0062, 0.005], { ...S, bone: b, k: 0.006 });
    }));
    s.part('gear', () => s.mirror((m) => {
      s.torus([m * 0.129, 0.214, 0.06], 0.0155, 0.0055, { color: wrap, mat: 'cloth', bone: `ha${side(m)}`, k: 0.004, rot: [0.5, 0, m * -0.15] });
      s.torus([m * 0.128, 0.225, 0.055], 0.016, 0.005, { color: wrap, mat: 'cloth', bone: `el${side(m)}`, k: 0.004, rot: [0.5, 0, m * -0.15] });
    }));

    // ——— Eyes: yellow, glowing, with slit pupils.
    s.mirror((m) => {
      const c = [m * 0.04, 0.503, 0.157], d = unit([m * 0.42, 0.06, 0.9]);
      const at = (t) => add(c, d, t);
      const rot = [-Math.asin(d[1]), Math.atan2(d[0], d[2]), 0];
      s.part('eyes', () => s.sphere(c, 0.0185, { color: '#3a2a04', mat: 'eye', bone: 'head', k: 0 }));
      s.part('irises', () => s.ellipsoid(at(0.0155), [0.0125, 0.0125, 0.0045], { color: '#ffd23a', mat: 'iris', bone: 'head', k: 0, rot }));
      s.part('pupils', () => s.ellipsoid(at(0.0193), [0.0024, 0.0092, 0.0018], { color: '#050302', mat: 'pupil', bone: 'head', k: 0, rot }));
    });

    // ——— Ears: long, pointed and drooping, thin flaps with a hollow down the front.
    s.part('ears', () => s.mirror((m) => {
      const b = `ear${side(m)}`;
      const up = unit([m * -0.15, 0.35, 1]);
      const base = [m * 0.085, 0.505, 0.066], mid = [m * 0.16, 0.508, 0.045], tip = [m * 0.245, 0.475, 0.012];
      s.flake(base, mid, up, 0.036, 0.03, 0.26, { ...S, bone: b, k: 0.012 });
      s.flake(mid, tip, up, 0.03, 0.003, 0.26, { ...S, bone: b, k: 0.012 });
      const f = up.map((v) => v * 0.007);
      s.flake(add(base, f), add(mid, f), up, 0.026, 0.021, 0.18, { op: 'sub', k: 0.006 });
      s.flake(add(mid, f), add(tip, f, 0.6), up, 0.021, 0.002, 0.18, { op: 'sub', k: 0.006 });
    }));
    s.paint((p) => {
      if (Math.abs(p[0]) < 0.09) return 1;
      return Math.abs(p[1] - 0.5 + (Math.abs(p[0]) - 0.09) * 0.2) - 0.018;
    }, '#a86e56', 0.012);

    // ——— Teeth: crooked fangs, two up from the jaw, a couple down.
    s.part('teeth', () => {
      const fang = (base, tipOff, r, rz) => s.limb(base, add(base, tipOff), r, r * 0.25, { color: tooth, mat: 'tooth', bone: rz, k: 0.002 });
      fang([0.03, 0.432, 0.163], [0.003, 0.02, 0.003], 0.0055, 'jaw');
      fang([-0.022, 0.432, 0.166], [-0.002, 0.016, 0.004], 0.0048, 'jaw');
      fang([0.008, 0.44, 0.17], [0.001, -0.012, 0.002], 0.004, 'head');
      fang([-0.038, 0.44, 0.158], [-0.002, -0.011, 0.003], 0.0038, 'head');
    });

    // ——— Claws: dark, hooked.
    s.part('claws', () => s.mirror((m) => {
      const b = side(m);
      for (const t of [-1, 0, 1]) {
        const x = m * 0.072 + t * 0.015 + m * 0.008 + t * 0.008 + m * 0.006;
        s.limb([x, 0.011, 0.093], [x + t * 0.003, 0.004, 0.108], 0.0055, 0.0012, { color: claw, mat: 'claw', bone: `ft${b}`, k: 0.002 });
        const tip = [m * (0.137 + t * 0.001), 0.128, 0.094 + t * 0.017];
        s.limb(tip, add(tip, [0, -0.008, 0.012]), 0.0042, 0.001, { color: claw, mat: 'claw', bone: `ha${b}`, k: 0.002 });
      }
    }));

    // ——— Belt, pouch.
    s.part('gear', () => {
      s.ellipsoid([0, 0.235, 0.0], [0.08, 0.05, 0.07], { color: darkLeather, mat: 'leather', bone: 'hips', k: 0.004 });
      s.ellipsoid([0, 0.235, 0.0], [0.074, 0.06, 0.064], { op: 'sub', k: 0.004 });
      s.box([0, 0.236, 0], [0.12, 0.012, 0.12], 0.004, { op: 'inter', k: 0.004 });
      s.box([0, 0.236, 0.072], [0.014, 0.014, 0.004], 0.003, { color: rust, mat: 'metal', bone: 'hips', k: 0.002 });
      s.ellipsoid([0.07, 0.21, 0.035], [0.022, 0.026, 0.016], { color: pouchLeather, mat: 'leather', bone: 'hips', k: 0.006, rot: [0, 0.9, 0] });
      s.ellipsoid([0.072, 0.228, 0.036], [0.024, 0.008, 0.018], { color: pouchLeather, mat: 'leather', bone: 'hips', k: 0.004, rot: [0, 0.9, 0.1] });
    });

    // ——— Ragged hem of the tunic: strips hanging from the belt.
    s.part('cloth', () => {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + 0.2;
        const len = 0.045 + ((i * 37) % 11) * 0.004;
        const x = Math.sin(a), z = Math.cos(a);
        const top = [x * 0.072, 0.225, z * 0.062 - 0.005];
        const bot = [x * 0.082, 0.225 - len, z * 0.072 - 0.005];
        const bone = z > 0.4 ? (x > 0 ? 'thL' : 'thR') : 'hips';
        s.flake(top, bot, [x, 0, z], 0.017, 0.009, 0.25, { color: leather, mat: 'leather', bone, k: 0.008 });
      }
    });

    // ——— The dagger, in the right hand: a wrapped grip, a crossguard and a curved, notched blade.
    s.part('gear', () => {
      s.limb([-0.133, 0.183, 0.045], [-0.133, 0.183, 0.108], 0.0065, 0.0065, { color: darkLeather, mat: 'leather', bone: 'haR', k: 0.002 });
      s.sphere([-0.133, 0.183, 0.043], 0.009, { color: rust, mat: 'metal', bone: 'haR', k: 0.002 });
      s.box([-0.133, 0.183, 0.11], [0.006, 0.02, 0.005], 0.003, { color: rust, mat: 'metal', bone: 'haR', k: 0.002 });
    });
    s.part('blade', () => {
      const up = [1, 0, 0];
      const pts = [[-0.133, 0.183, 0.112], [-0.133, 0.188, 0.15], [-0.133, 0.2, 0.185], [-0.133, 0.222, 0.21]];
      s.flake(pts[0], pts[1], up, 0.0125, 0.0125, 0.16, { color: rust, mat: 'metal', bone: 'haR', k: 0.006 });
      s.flake(pts[1], pts[2], up, 0.0125, 0.0095, 0.16, { color: rust, mat: 'metal', bone: 'haR', k: 0.006 });
      s.flake(pts[2], pts[3], up, 0.0095, 0.0015, 0.16, { color: rust, mat: 'metal', bone: 'haR', k: 0.006 });
    });
  },

  /**
   * clip: 'idle' (shifty), 'walk' (a scamper; `speed` 0–1), 'attack' (a
   * stabbing lunge over 0.6 s), 'hit' (a flinch over 0.4 s), 'ko' (falls flat).
   */
  animate(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }) {
    const T = time + seed;
    const sway = (amp, f, ph = 0) => amp * Math.sin(T * f + ph);
    const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const span = (a, b) => ease((t - a) / (b - a));
    k.scale('chest', 1 + sway(0.015, 3.4), 1 + sway(0.02, 3.4), 1 + sway(0.015, 3.4));
    // The ears never keep still.
    const twitch = Math.max(0, Math.sin(T * 1.9) * Math.sin(T * 6.1) - 0.6) * 2.5;
    k.turn('earL', sway(0.06, 2.3), twitch * 0.4, sway(0.08, 1.7) - 0.05);
    k.turn('earR', sway(0.06, 2.1, 1), -twitch * 0.25, sway(0.08, 1.5, 2) + 0.05);
    // A crouch, always: knees bent, the dagger held low and ready.
    k.turn('thL', -0.25, 0, 0.05); k.turn('knL', 0.4, 0, 0); k.turn('ftL', -0.15, 0, 0);
    k.turn('thR', -0.25, 0, -0.05); k.turn('knR', 0.4, 0, 0); k.turn('ftR', -0.15, 0, 0);
    k.move('hips', 0, -0.012, 0);
    k.turn('chest', 0.12, 0, 0);
    k.turn('shR', -0.35, 0, -0.1); k.turn('elR', -0.6, 0, 0);
    k.turn('shL', -0.1, 0, 0.15); k.turn('elL', -0.4, 0, 0);

    if (clip === 'idle') {
      // Shifty: glancing left and right, a nervous bob, the dagger turned in the hand.
      const look = Math.sin(T * 0.8) > 0.3 ? 0.5 : Math.sin(T * 0.8) < -0.3 ? -0.5 : 0;
      k.turn('head', sway(0.06, 1.3), look + sway(0.06, 3), sway(0.05, 0.9));
      k.move('hips', 0, sway(0.006, 4), 0);
      k.turn('haR', sway(0.3, 2.2), 0, 0);
      k.turn('jaw', Math.max(0, sway(0.15, 0.7)), 0, 0);
    } else if (clip === 'walk') {
      // A quick, low scamper.
      const ph = T * 13 * Math.max(0.5, speed), g = Math.sin(ph);
      k.move('hips', 0, Math.abs(Math.cos(ph)) * 0.02 - 0.005, 0);
      k.turn('hips', 0, g * 0.15, g * 0.04);
      k.turn('chest', 0.15, -g * 0.2, 0);
      k.turn('thL', -g * 0.65, 0, 0); k.turn('knL', Math.max(0, g) * 0.8, 0, 0);
      k.turn('thR', g * 0.65, 0, 0); k.turn('knR', Math.max(0, -g) * 0.8, 0, 0);
      k.turn('shL', g * 0.6, 0, 0);
      k.turn('shR', -g * 0.3, 0, 0);
      k.turn('head', 0.1, g * 0.1, 0);
    } else if (clip === 'attack') {
      // Coils back, then lunges in and stabs low.
      const wind = span(0, 0.2), stab = span(0.22, 0.32), back = span(0.45, 0.75);
      const w = wind * (1 - stab), s2 = stab * (1 - back);
      k.move('root', 0, 0, -0.03 * w + 0.12 * s2);
      k.turn('chest', -0.1 * w + 0.35 * s2, 0.35 * w - 0.25 * s2, 0);
      k.turn('shR', 0.7 * w - 1.25 * s2, 0, -0.2 * w);
      k.turn('elR', -0.6 * w + 0.6 * s2, 0, 0);
      k.turn('haR', 0.3 * w - 0.4 * s2, 0, 0);
      k.turn('shL', -0.4 * s2, 0, 0.4 * w);
      k.turn('thL', -0.6 * s2, 0, 0); k.turn('knL', 0.3 * s2, 0, 0);
      k.turn('thR', 0.4 * s2, 0, 0); k.turn('knR', 0.2 * s2, 0, 0);
      k.turn('head', -0.15 * w + 0.1 * s2, 0, 0);
      k.turn('jaw', 0.35 * (w + s2), 0, 0);
      k.turn('earL', -0.4 * (w + s2), 0, 0); k.turn('earR', -0.4 * (w + s2), 0, 0);
    } else if (clip === 'hit') {
      const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
      k.move('root', 0, 0, -0.06 * h);
      k.turn('chest', -0.35 * h, 0, 0.12 * h);
      k.turn('head', -0.35 * h, 0.25 * h, 0);
      k.turn('shL', -0.8 * h, 0, 0.5 * h); k.turn('shR', -0.5 * h, 0, -0.5 * h);
      k.turn('jaw', 0.4 * h, 0, 0);
      k.turn('earL', -0.6 * h, 0, 0); k.turn('earR', -0.6 * h, 0, 0);
    } else if (clip === 'ko') {
      // Over backwards, arms out, legs up a little: flat out.
      const f = span(0, 0.5);
      k.turn('root', -f * Math.PI * 0.48, 0, 0);
      k.move('root', 0, 0.06 * f, -0.2 * f);
      k.turn('thL', 0.5 * f, 0, 0.2 * f); k.turn('thR', 0.3 * f, 0, -0.2 * f);
      k.turn('shL', -0.3 * f, 0, 1.0 * f); k.turn('shR', -0.3 * f, 0, -1.0 * f);
      k.turn('head', 0.3 * f, 0.5 * f, 0);
      k.turn('jaw', 0.3 * f, 0, 0);
    }
  },
};
