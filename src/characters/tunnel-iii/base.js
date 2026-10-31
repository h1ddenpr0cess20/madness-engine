/**
 * Independent, upright Tunnel-III character base.
 *
 * Build order is deliberate:
 *   1. sculpt the full anatomical body in skin;
 *   2. lay separate garment volumes over that skin;
 *   3. add hair, footwear, and hand-held accessories.
 *
 * This module does not import a character, old person factory, wardrobe,
 * or materials palette. It shares only Madness Engine's generic humanoid
 * clip animator, so the new standing rig gets the same clip vocabulary.
 */
import { moveHumanoid } from '../humanoid.js';

const MATERIALS = {
  skin: { roughness: 0.78, sheen: 0.10, sheenColor: '#d5b5a0', sheenRoughness: 0.82 },
  cotton: { roughness: 0.91, sheen: 0.06 },
  wool: { roughness: 0.94, sheen: 0.04 },
  denim: { roughness: 0.96, sheen: 0.03 },
  leather: { roughness: 0.52, clearcoat: 0.16, clearcoatRoughness: 0.68 },
  hair: { roughness: 0.78, sheen: 0.16, sheenColor: '#93816f' },
  eye: { roughness: 0.12, clearcoat: 0.72 },
  metal: { roughness: 0.34, metalness: 0.84 },
  plastic: { roughness: 0.42, clearcoat: 0.28 },
  rubber: { roughness: 0.88 },
  shoe: { roughness: 0.66, clearcoat: 0.08 },
  wood: { roughness: 0.74 },
  glass: { roughness: 0.08, clearcoat: 0.8 },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function hold(k, name, x = 0, y = 0, z = 0) {
  const r = k.bone(name).rot;
  r[0] = x; r[1] = y; r[2] = z;
}

/** Standing skeleton with the engine's familiar humanoid bone names. */
function makeRig(b = 1) {
  const bones = [
    ['root', null, [0, 0, 0]],
    ['hips', 'root', [0, 0.32, 0]],
    ['spine', 'hips', [0, 0.37, 0]],
    ['chest', 'spine', [0, 0.45, 0]],
    ['neck', 'chest', [0, 0.53, 0]],
    ['head', 'neck', [0, 0.58, 0.005]],
  ];
  const J = {};
  for (const side of [1, -1]) {
    const S = side > 0 ? 'L' : 'R';
    const shoulder = [side * 0.105 * b, 0.5, 0];
    const elbow = [side * 0.135 * b, 0.395, 0];
    const wrist = [side * 0.15 * b, 0.292, 0.018];
    const hand = [side * 0.153 * b, 0.262, 0.024];
    const hip = [side * 0.055 * b, 0.31, 0];
    const knee = [side * 0.06 * b, 0.172, 0.006];
    const ankle = [side * 0.06 * b, 0.05, 0];
    J['shoulder' + S] = shoulder;
    J['elbow' + S] = elbow;
    J['wrist' + S] = wrist;
    J['hand' + S] = hand;
    J['hip' + S] = hip;
    J['knee' + S] = knee;
    J['ankle' + S] = ankle;
    bones.push(
      ['arm' + S, 'chest', shoulder],
      ['fore' + S, 'arm' + S, elbow],
      ['hand' + S, 'fore' + S, wrist],
      ['thigh' + S, 'hips', hip],
      ['shin' + S, 'thigh' + S, knee],
      ['foot' + S, 'shin' + S, ankle],
    );
  }
  return { bones, J };
}

function sectionField(p, sections, y0, y1) {
  const y = clamp(p[1], y0, y1);
  let i = 0;
  while (i < sections.length - 2 && y > sections[i + 1][0]) i++;
  const a = sections[i], b = sections[i + 1];
  const t = smooth(a[0], b[0], y);
  const rx = a[1] + (b[1] - a[1]) * t;
  const rz = a[2] + (b[2] - a[2]) * t;
  const zc = a[3] + (b[3] - a[3]) * t;
  const radial = (Math.hypot(p[0] / rx, (p[2] - zc) / rz) - 1) * Math.min(rx, rz);
  const vertical = Math.max(y0 - p[1], p[1] - y1, 0);
  return Math.hypot(Math.max(radial, 0), vertical) + Math.min(Math.max(radial, vertical), 0);
}

function loft(s, part, y0, y1, sections, options) {
  const rx = Math.max(...sections.map((q) => q[1]));
  const rz = Math.max(...sections.map((q) => q[2]));
  s.part(part, () => s.shape(
    (p) => sectionField(p, sections, y0, y1),
    [[-rx, y0, Math.min(...sections.map((q) => q[3])) - rz],
      [rx, y1, Math.max(...sections.map((q) => q[3])) + rz]],
    options,
  ));
}

/** The complete anatomical skin body; garment meshes never substitute for it. */
function buildSkin(s, { skin, eyeColor = '#536b82', brow = '#30251f', mood = 0, girth = 1, shoulders = 1 }, J) {
  const SO = (bone, extra = {}) => ({ color: skin, mat: 'skin', bone, k: 0.014, ...extra });

  // Rib cage, abdomen, and pelvis form one connected anatomical silhouette.
  loft(s, 'skin', 0.268, 0.405, [
    [0.268, 0.052 * girth, 0.042 * girth, -0.003],
    [0.30, 0.075 * girth, 0.056 * girth, -0.004],
    [0.345, 0.078 * girth, 0.058 * girth, -0.006],
    [0.385, 0.075 * girth, 0.056 * girth, 0.002],
    [0.405, 0.079 * girth, 0.058 * girth, 0.004],
  ], SO('hips', { k: 0.022 }));
  loft(s, 'skin', 0.365, 0.49, [
    [0.365, 0.075 * girth, 0.056 * girth, 0.002],
    [0.395, 0.078 * girth, 0.058 * girth, 0.003],
    [0.445, 0.091 * girth, 0.065 * girth, 0.004],
    [0.49, 0.101 * shoulders, 0.071 * girth, 0.002],
  ], SO('spine', { k: 0.018 }));
  loft(s, 'skin', 0.445, 0.56, [
    [0.445, 0.091 * shoulders, 0.065 * girth, 0.004],
    [0.49, 0.108 * shoulders, 0.076 * girth, 0.002],
    [0.525, 0.099 * shoulders, 0.068 * girth, 0],
    [0.56, 0.05, 0.036, 0],
  ], SO('chest', { k: 0.02 }));

  // Neck grows continuously into the jaw and the collar line.
  s.part('skin', () => s.limb([0, 0.515, 0], [0, 0.594, 0.006], 0.029, 0.026, SO('neck', { k: 0.016 })));

  for (const side of [1, -1]) {
    const S = side > 0 ? 'L' : 'R';
    const sh = J['shoulder' + S], el = J['elbow' + S], wr = J['wrist' + S];
    const hip = J['hip' + S], kn = J['knee' + S], an = J['ankle' + S];
    s.part('skin', () => {
      // Deltoid, upper arm, forearm and a formed palm.
      s.ellipsoid(sh, [0.038 * shoulders, 0.043, 0.039], SO('arm' + S, { k: 0.018 }));
      s.limb(sh, el, 0.033 * shoulders, 0.024, SO('arm' + S, { k: 0.014 }));
      s.limb(el, wr, 0.024, 0.017, SO('fore' + S, { k: 0.01 }));
      s.ellipsoid([wr[0], wr[1] - 0.015, wr[2] + 0.01], [0.019, 0.023, 0.021], SO('hand' + S, { k: 0.01 }));
      s.limb([wr[0], wr[1] - 0.012, wr[2] + 0.014],
        [wr[0], wr[1] - 0.048, wr[2] + 0.043], 0.014, 0.010, SO('hand' + S, { k: 0.008 }));

      // Thighs and calves articulate at the actual knee and ankle pivots.
      s.limb(hip, kn, 0.046 * girth, 0.032 * girth, SO('thigh' + S, { k: 0.014 }));
      s.limb(kn, [an[0], an[1] + 0.07, an[2] - 0.004], 0.031, 0.028, SO('shin' + S, { k: 0.01 }));
      s.limb([an[0], an[1] + 0.07, an[2] - 0.004], an, 0.028, 0.021, SO('shin' + S, { k: 0.01 }));
      // Instep, heel, ball and toe are skin too; shoes are fitted over them later.
      s.ellipsoid([an[0], 0.026, an[2] - 0.005], [0.022, 0.022, 0.027], SO('foot' + S, { k: 0.012 }));
      s.ellipsoid([an[0], 0.022, an[2] + 0.025], [0.024, 0.018, 0.037], SO('foot' + S, { k: 0.012 }));
      for (let toe = 0; toe < 5; toe++) {
        const x = an[0] + side * (-0.014 + toe * 0.009);
        const z = an[2] + 0.053 - Math.abs(toe - 2) * 0.004;
        s.ellipsoid([x, 0.012, z], [0.0058, 0.007, 0.014], SO('foot' + S, { k: 0.004 }));
      }
    });
  }

  // Skull, jaw, ears, cheek planes, nose, eyes, brows and mouth are all part
  // of the skin pass, before hair or any headwear is fitted.
  s.part('skin', () => {
    s.ellipsoid([0, 0.674, 0.004], [0.087, 0.101, 0.083], SO('head', { k: 0.024 }));
    s.ellipsoid([0, 0.629, 0.03], [0.071, 0.058, 0.068], SO('head', { k: 0.02 }));
    for (const side of [1, -1]) {
      s.ellipsoid([side * 0.087, 0.661, -0.003], [0.014, 0.027, 0.021], SO('head', { k: 0.012 }));
      s.ellipsoid([side * 0.048, 0.644, 0.064], [0.027, 0.018, 0.02], SO('head', { k: 0.012 }));
    }
    s.limb([0, 0.681, 0.078], [0, 0.65, 0.105], 0.0075, 0.009, SO('head', { k: 0.01 }));
    s.sphere([0, 0.646, 0.104], 0.010, SO('head', { k: 0.008 }));
    s.ellipsoid([0, 0.61, 0.091], [0.016, 0.004, 0.004], SO('head', { k: 0.003 }));
    for (const side of [1, -1]) {
      const eye = [side * 0.035, 0.682, 0.077];
      s.ellipsoid(eye, [0.019, 0.021, 0.012], { color: '#f0ece4', mat: 'eye', bone: 'head', k: 0.004 });
      s.ellipsoid([eye[0], eye[1], 0.087], [0.009, 0.012, 0.005], { color: eyeColor, mat: 'eye', bone: 'head', k: 0.002 });
      s.ellipsoid([eye[0], eye[1], 0.091], [0.0043, 0.007, 0.0025], { color: '#101014', mat: 'eye', bone: 'head', k: 0.001 });
      s.sphere([eye[0] - 0.003, eye[1] + 0.005, 0.094], 0.002, { color: '#ffffff', mat: 'eye', bone: 'head', k: 0 });
      const by = mood ? 0.709 : 0.713;
      s.limb([side * 0.017, by, 0.076], [side * 0.055, by + (mood ? -0.005 : 0.002), 0.068],
        0.005, 0.004, { color: brow, mat: 'hair', bone: 'head', k: 0.002 });
    }
    s.limb([-0.018, 0.615, 0.092], [0.018, 0.615, 0.092], 0.0016, 0.0016, { op: 'sub', k: 0.001 });
    s.ellipsoid([0, 0.608, 0.09], [0.014, 0.004, 0.004], SO('head', { k: 0.003 }));
  });
}

/** Outer garment forms. All of these are separate meshes over the skin. */
export function jacket(s, J, { torso, sleeve = torso, material = 'cotton', girth = 1, collar = null }) {
  loft(s, 'clothes', 0.35, 0.56, [
    [0.35, 0.082 * girth, 0.065 * girth, 0.003],
    [0.39, 0.084 * girth, 0.065 * girth, 0.004],
    [0.445, 0.098 * girth, 0.073 * girth, 0.004],
    [0.49, 0.116 * girth, 0.084 * girth, 0.002],
    [0.53, 0.105 * girth, 0.076 * girth, 0],
    [0.56, 0.058, 0.045, 0],
  ], { color: torso, mat: material, bone: 'chest', k: 0.012 });
  loft(s, 'clothes', 0.345, 0.445, [
    [0.345, 0.083 * girth, 0.066 * girth, 0.003],
    [0.39, 0.084 * girth, 0.066 * girth, 0.004],
    [0.445, 0.098 * girth, 0.073 * girth, 0.004],
  ], { color: torso, mat: material, bone: 'spine', k: 0.012 });
  for (const side of [1, -1]) {
    const S = side > 0 ? 'L' : 'R';
    const sh = J['shoulder' + S], el = J['elbow' + S], wr = J['wrist' + S];
    s.part('clothes', () => {
      s.limb([sh[0] * 0.9, sh[1] + 0.004, sh[2]], el, 0.039, 0.028, { color: sleeve, mat: material, bone: 'arm' + S, k: 0.012 });
      s.limb(el, wr, 0.029, 0.021, { color: sleeve, mat: material, bone: 'fore' + S, k: 0.01 });
    });
  }
  if (collar) s.part('clothes', () => {
    s.limb([-0.038, 0.535, 0.047], [0, 0.493, 0.085], 0.012, 0.009, { color: collar, mat: 'cotton', bone: 'chest', k: 0.003 });
    s.limb([0.038, 0.535, 0.047], [0, 0.493, 0.085], 0.012, 0.009, { color: collar, mat: 'cotton', bone: 'chest', k: 0.003 });
  }
}

export function trousers(s, J, { color, material = 'denim', short = false, shoeColor = null, boots = false }) {
  for (const side of [1, -1]) {
    const S = side > 0 ? 'L' : 'R';
    const hip = J['hip' + S], knee = J['knee' + S], ankle = J['ankle' + S];
    s.part('clothes', () => {
      if (short) {
        s.limb(hip, [knee[0], knee[1] + 0.025, knee[2]], 0.054, 0.043, { color, mat: material, bone: 'thigh' + S, k: 0.012 });
      } else {
        s.limb(hip, knee, 0.052, 0.039, { color, mat: material, bone: 'thigh' + S, k: 0.012 });
        s.limb(knee, ankle, 0.038, 0.026, { color, mat: material, bone: 'shin' + S, k: 0.01 });
      }
      if (shoeColor) {
        s.ellipsoid([ankle[0], 0.031, 0.052], [boots ? 0.038 : 0.032, 0.024, boots ? 0.075 : 0.065], { color: shoeColor, mat: 'shoe', bone: 'foot' + S, k: 0.01 });
        s.ellipsoid([ankle[0], 0.009, 0.052], [boots ? 0.039 : 0.033, 0.007, boots ? 0.077 : 0.067], { color: '#19191d', mat: 'rubber', bone: 'foot' + S, k: 0.004 });
      }
    });
  }
}

export function addHair(s, { color = '#392b23', cap = [0.09, 0.052, 0.092], locks = [] } = {}) {
  s.part('hair', () => {
    if (cap) s.ellipsoid([0, 0.748, -0.006], cap, { color, mat: 'hair', bone: 'head', k: 0.014 });
    for (const [a, b, radius] of locks) {
      s.limb(a, b, radius, radius * 0.7, { color, mat: 'hair', bone: 'head', k: 0.006 });
    }
  });
}

export function glasses(s, { rim = '#574638', dark = false, size = 0.021 } = {}) {
  s.part('accessories', () => {
    for (const side of [1, -1]) {
      const c = [side * 0.039, 0.681, 0.093];
      if (dark) s.ellipsoid(c, [size * 1.2, size, 0.006], { color: '#090a0c', mat: 'glass', bone: 'head', k: 0.002 });
      s.torus(c, size, 0.003, { color: rim, mat: 'metal', bone: 'head', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      s.limb([side * 0.06, 0.683, 0.087], [side * 0.10, 0.674, 0.006], 0.0025, 0.0025, { color: rim, mat: 'metal', bone: 'head', k: 0.001 });
    }
    s.limb([-0.018, 0.683, 0.096], [0.018, 0.683, 0.096], 0.0025, 0.0025, { color: rim, mat: 'metal', bone: 'head', k: 0.001 });
  });
}

/**
 * Defines one fresh standing character. Garments and accessories are sculpted
 * only after the complete skin anatomy is finished.
 */
export function standingCharacter({
  name, scale = 1.4, skin = '#c88f70', eyeColor = '#536b82', brow = '#30251f',
  mood = 0, girth = 1, shoulders = 1, cell = 0.0085, budget = 42000,
  hair = null, clothes = null, accessories = null, style = {},
}) {
  const rig = makeRig(1);
  return {
    name, scale, cell, budget, bones: rig.bones, materials: MATERIALS,
    cells: { face: 0.004, eyes: 0.0025, accessories: 0.003, hair: 0.004, clothes: 0.004, fine: 0.003 },
    ambient: 0.24,
    sculpt(s) {
      buildSkin(s, { skin, eyeColor, brow, mood, girth, shoulders }, rig.J);
      // Distinct overlays, added after the bare body is complete.
      hair?.(s, rig.J);
      clothes?.(s, rig.J);
      accessories?.(s, rig.J);
    },
    animate(k, state) {
      moveHumanoid(k, state, style);
    },
  };
}

export { MATERIALS };
