import { coat, mix } from '../models/skins.js';
import { rgb } from '../models/sdf.js';
import { body, bones, build, fit, grip, head, hair, joints, moveHumanoid, skinTone, thin } from './humanoid.metroll.js';

/**
 * The people of the gig, as one body in different clothes: the humanoid rig
 * (humanoid.js), dressed. A person is described by their `look` (what each
 * part of the body is painted as), a face (`face`), their hair, whatever
 * extra they are wearing or carrying (`extras`, a function that adds shapes
 * to the sculpt, given the joints), and how they move (`style`, passed to
 * `moveHumanoid`, with an `after` hook for anything particular to them).
 *
 * `person({ ... })` gives a model definition, as every other creature is.
 */

export const MATERIALS = {
  skin: { roughness: 0.62, sheen: 0.25, sheenColor: '#ffd8c0', sheenRoughness: 0.7 },
  cloth: { roughness: 0.84, sheen: 0.28, sheenColor: '#9a9aa4', sheenRoughness: 0.5 },
  denim: { roughness: 0.9, sheen: 0.22, sheenColor: '#8c98ac', sheenRoughness: 0.55 },
  leather: { roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.5 },
  hair: { roughness: 0.5, sheen: 0.8, sheenColor: '#6a5a4a' },
  eye: { roughness: 0.1, clearcoat: 1 },
  metal: { roughness: 0.28, metalness: 1 },
  plastic: { roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.2 },
  rubber: { roughness: 0.8 },
  glow: { roughness: 0.4, emissive: '#ff9a4a', emissiveIntensity: 1.4 },
  screen: { roughness: 0.4, emissive: '#ffffff', emissiveIntensity: 1.4 },
  glass: { roughness: 0.04, clearcoat: 1, metalness: 0.2 },
  paper: { roughness: 0.9 },
  bone: { roughness: 0.55 },
  fur: { roughness: 0.85, sheen: 0.4, sheenColor: '#aaa' },
};

/** Cloth: a colour that is lighter on top and darker beneath, with a little mottling. */
export const cloth = (over, under, o = {}) => coat({ over, under: under ?? shade(over, 0.8), vary: 0.04, freq: 14, grain: 0.03, ...o });

/** `hex` darkened (or lightened, above 1) by `k`. */
export function shade(hex, k) {
  const c = rgb(hex).map((v) => Math.min(1, v * k));
  return c;
}

export { mix, joints, skinTone };

/** Sets bone `name`'s turn outright, over whatever the clip gave it: for a pose they hold whatever they are doing. */
export function hold(k, name, x = 0, y = 0, z = 0) {
  const r = k.bone(name).rot;
  r[0] = x; r[1] = y; r[2] = z;
}

/**
 * `look` has `skin`, `torso`, `sleeve`, `cuff`, `hand`, `legs`, `boot` (each a
 * colour or a colour function), and `boots` or `shin` for the calf (see
 * humanoid.js `body`); `mats` the material of each (default cloth,
 * skin for skin and hands); `face` is for `head()` (skin, brow, eyeColor,
 * ears, jaw, mood, blush) and `hair` for `hair()`; `b` the breadth. `shape`
 * is their build (humanoid.js `build`: legs, torso, head, girth, hips), so
 * not everyone is the same height and shape, and `belly` a belly.
 */
export function person({
  name, scale = 1.1, b = 1, skin = '#e9b48f', look, mats = {}, face = {}, hair: hairOpts = null,
  extras = null, style = {}, cells = {}, budget = 39600, cell = 0.0085, k = 0.03, shape = {}, belly = 0,
}) {
  const tone = typeof skin === 'string' ? skinTone(skin) : skin;
  const full = { skin: tone, hand: tone, ...look };
  // 'skin' for a bare calf, under shorts or a skirt.
  if (look.shin === 'skin') full.shin = tone;
  const warp = build(shape);
  return {
    name,
    scale,
    cell,
    cells: { head: 0.005, hands: 0.0024, shoes: 0.0042, soles: 0.0032, eyes: 0.0026, irises: 0.0017, pupils: 0.0011, brows: 0.003, hair: 0.0045, kit: 0.0042, fine: 0.0028, ...cells },
    budget,
    bones: bones(b, warp),
    /** Their build, to take a posed point back to where it was sculpted. */
    warp,
    materials: MATERIALS,
    // Deep in the creases: under the arms, the collar, between the legs.
    ambient: 0.22,
    sculpt(s) {
      s.setWarp(warp);
      const J = body(s, { b, look: full, mats, k, belly });
      head(s, { skin: tone, ...face });
      if (hairOpts) hair(s, hairOpts);
      extras?.(s, J, { b, skin: tone });
      // What they have on their face that is skin (a nose of their own, jowls) is the face's, and melts into it.
      for (const shape of s.shapes) if (shape.part === 'body' && shape.bone === 'head' && shape.mat === 'skin') shape.part = 'head';
      // Hands that hold something closed round it; what they wear put on them, not hanging just off them;
      // and its thin pieces (brims, peaks) on a finer grid.
      grip(s, J);
      fit(s);
      thin(s);
    },
    animate(kk, state) {
      moveHumanoid(kk, state, style);
    },
  };
}
