import { createHuman } from './human.js';

/**
 * The shonen heroes: the human, built as an action anime draws him and her. Separate models
 * from the realistic man and woman (who are left as they are), made of the same figures and the
 * same rig, so they wear the same clothes, play the same clips and hold the same weapons.
 *
 * Their faces are the creator's `faceStyle: 'shonen'`: very large, tall eyes set low and wide with
 * sharp outer corners and a big glossy painted iris, a hint of a nose, a small low mouth, flat cheeks,
 * a narrow jaw to a pointed chin, small ears, brows low over the eyes. Their bodies are built to
 * fight: broad shoulders, a narrow waist, heavy arms and legs; hers lean and strong.
 */

/** What makes each figure a shonen hero, as creator features (anything given to `createShonen` wins). */
export const SHONEN_FEATURES = Object.freeze({
  male: Object.freeze({
    faceStyle: 'shonen', build: 'athletic', muscle: 0.55, shoulders: 0.35, chest: 0.4, waist: -0.55, arms: 0.45, legs: 0.3, neck: 0.25, height: 0.2,
    hair: 'texturedCrop', hairColour: '#16161f', iris: '#2f6fd0', brows: 'natural', browThickness: 0.5, glasses: 'none',
  }),
  female: Object.freeze({
    faceStyle: 'shonen', muscle: 0.45, shoulders: 0.15, waist: -0.45, arms: 0.2, legs: 0.3, height: 0.15,
    hair: 'longBangs', hairColour: '#e8743b', iris: '#2fa86a', brows: 'fine', glasses: 'none',
  }),
});

/**
 * A shonen hero: `createShonen(GFX)` the man, `createShonen(GFX, { sex: 'female' })` the heroine.
 * Takes `createHuman`'s options; `features` are laid over the hero's own (SHONEN_FEATURES).
 */
export function createShonen(GFX, options = {}) {
  const sex = options.sex ?? options.features?.sex ?? 'male';
  return createHuman(GFX, { ...options, sex, features: { ...SHONEN_FEATURES[sex], ...options.features } });
}
