import { BEARDS, BROWS, HAIRSTYLES } from './hair.js';
import { SUNGLASSES } from './glasses.js';

/**
 * Everything about a person a character creator lets a player choose, in the
 * order such a screen shows it: the body, the skin, the face and each of its
 * features, the hair. Each slot is a choice (`options`), a slider (`min` to
 * `max`, 0 the average) or a colour, with its `default`.
 *
 * `ready` says whether the human is built to show it yet. The rest are
 * already part of a person's `features`, kept and handed back, so a game or
 * a viewer can offer them now and they take effect as each is built: a
 * nose shape is a set of offsets on the nose's vertices, an eye shape on the
 * lids', a build on the body's.
 *
 * A group with a `figure` is that figure's only (facial hair is his): see
 * `customizationFor`.
 */

const choice = (key, label, options, { ready = false, value = options[0] } = {}) => ({ key, label, type: 'choice', options, default: value, ready });
const slider = (key, label, { ready = false, min = -1, max = 1, value = 0 } = {}) => ({ key, label, type: 'range', min, max, default: value, ready });
const colour = (key, label, value, { ready = false } = {}) => ({ key, label, type: 'color', default: value, ready });

export const CUSTOMIZATION = Object.freeze([
  { group: 'Body', slots: [
    // Chosen when the human is made (createHuman's `sex`, or this feature then): a man or a woman.
    choice('sex', 'Figure', ['male', 'female'], { ready: true }),
    choice('build', 'Build', ['average', 'slim', 'athletic', 'stocky', 'heavy']),
    slider('height', 'Height'),
    slider('muscle', 'Muscle'),
    slider('weight', 'Weight'),
    slider('shoulders', 'Shoulders'),
  ] },
  { group: 'Skin', slots: [
    colour('skin', 'Tone', '#b98a70', { ready: true }),
    slider('age', 'Age', { min: 0, max: 1 }),
    slider('freckles', 'Freckles', { min: 0, max: 1 }),
    choice('scars', 'Scars', ['none', 'cheek', 'brow', 'lip', 'eye']),
    choice('tattoo', 'Face tattoo', ['none', 'tribal', 'runes', 'tear']),
  ] },
  { group: 'Head', slots: [
    choice('face', 'Face shape', ['oval', 'round', 'square', 'long', 'heart', 'diamond']),
    slider('headSize', 'Head size'),
    slider('jaw', 'Jaw width'),
    slider('chin', 'Chin'),
    slider('cheekbones', 'Cheekbones'),
    slider('forehead', 'Forehead'),
  ] },
  { group: 'Eyes', slots: [
    choice('eyeShape', 'Shape', ['almond', 'round', 'hooded', 'monolid', 'upturned', 'downturned']),
    slider('eyeSize', 'Size'),
    slider('eyeSpacing', 'Spacing'),
    slider('eyeTilt', 'Tilt'),
    slider('eyeDepth', 'Depth'),
    colour('iris', 'Colour', '#5a4632', { ready: true }),
  ] },
  { group: 'Brows', slots: [
    choice('brows', 'Brows', ['none', ...Object.keys(BROWS)], { ready: true, value: 'natural' }),
    slider('browThickness', 'Thickness'),
    slider('browHeight', 'Height'),
    slider('browArch', 'Arch'),
  ] },
  { group: 'Nose', slots: [
    choice('noseShape', 'Shape', ['straight', 'aquiline', 'roman', 'button', 'snub', 'broad', 'hooked']),
    slider('noseWidth', 'Width'),
    slider('noseLength', 'Length'),
    slider('noseBridge', 'Bridge'),
    slider('noseTip', 'Tip'),
  ] },
  { group: 'Mouth', slots: [
    choice('mouthShape', 'Shape', ['average', 'full', 'thin', 'wide', 'bow', 'downturned']),
    slider('mouthWidth', 'Width'),
    slider('lipUpper', 'Upper lip'),
    slider('lipLower', 'Lower lip'),
    colour('lipColour', 'Lip colour', '#a86a5e'),
  ] },
  { group: 'Ears', slots: [
    choice('earShape', 'Shape', ['round', 'attached', 'pointed', 'elven']),
    slider('earSize', 'Size'),
    slider('earAngle', 'Angle'),
  ] },
  { group: 'Hair', slots: [
    choice('hair', 'Style', ['none', ...Object.keys(HAIRSTYLES)], { ready: true, value: 'sidePart' }),
    colour('hairColour', 'Colour', '#3b2a1f', { ready: true }),
  ] },
  { group: 'Facial hair', figure: 'male', slots: [
    choice('beard', 'Beard', ['none', ...Object.keys(BEARDS)], { ready: true, value: 'none' }),
    choice('moustache', 'Moustache', ['with beard', 'none', 'chevron', 'handlebar', 'pencil', 'walrus']),
    slider('stubble', 'Stubble', { min: 0, max: 1, value: 0.5 }),
  ] },
  { group: 'Accessories', slots: [
    choice('glasses', 'Sunglasses', ['none', ...Object.keys(SUNGLASSES)], { ready: true, value: 'aviator' }),
  ] },
]);

/** What a creator offers the figure `sex` ('male' or 'female'): every group but the other figure's own. */
export function customizationFor(sex) {
  return CUSTOMIZATION.filter((g) => !g.figure || g.figure === sex);
}

/** The figure a slot is only for, by key (none for most). */
const FIGURE_OF = Object.fromEntries(CUSTOMIZATION.flatMap((g) => (g.figure ? g.slots.map((s) => [s.key, g.figure]) : [])));

/** Every slot, by key. */
export const SLOTS = Object.freeze(Object.fromEntries(CUSTOMIZATION.flatMap((g) => g.slots).map((s) => [s.key, s])));

/** Every slot's default. */
export const DEFAULT_FEATURES = Object.freeze(Object.fromEntries(Object.values(SLOTS).map((s) => [s.key, s.default])));

/**
 * `change` checked against the slots: unknown keys, options and out-of-range values are refused, and
 * so is anything but the default of a slot that is another figure's (a beard for her), for `sex`.
 */
export function checkFeatures(change, sex = null) {
  for (const [key, value] of Object.entries(change)) {
    const s = SLOTS[key];
    if (!s) throw new Error(`human: no feature called ${key}; choose ${Object.keys(SLOTS).join(', ')}`);
    if (sex && FIGURE_OF[key] && FIGURE_OF[key] !== sex && value !== s.default) throw new Error(`human: ${key} is for the ${FIGURE_OF[key]} figure only`);
    if (s.type === 'choice' && !s.options.includes(value)) throw new Error(`human: ${key} is one of ${s.options.join(', ')}, not ${value}`);
    if (s.type === 'range' && !(typeof value === 'number' && value >= s.min && value <= s.max)) throw new Error(`human: ${key} runs ${s.min} to ${s.max}, not ${value}`);
    if (s.type === 'color' && !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`human: ${key} is a #rrggbb colour, not ${value}`);
  }
  return change;
}
