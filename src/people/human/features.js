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
 * a viewer can offer them now and they take effect as each is built.
 *
 * A group with a `figure` is that figure's only (facial hair is his): see
 * `customizationFor`.
 *
 * The face and the body are shaped by the MakeHuman project's own morph
 * targets (CC0), the ones its modelling tab moves: each slot's `shape` says
 * which of them, and how much, make it. A slider has an `up` recipe (for 1)
 * and a `down` one (for −1); a choice has one per option (the default as he
 * is). Each recipe is { 'group/target': weight }, a `{s}` in the name both
 * sides (l and r). For the woman, the male targets of a recipe are taken in
 * their female form, and `forFemale` replaces a recipe where hers differs.
 * scripts/bake-human.mjs bakes them into data/shapes.js (and, with
 * --female, data/shapes-female.js), each figure in its own pose and at its
 * own size; people/human/shape.js puts them on him or her.
 */

const choice = (key, label, options, { ready = false, value = options[0], shape = null } = {}) => ({ key, label, type: 'choice', options, default: value, ready: ready || !!shape, shape });
const slider = (key, label, { ready = false, min = -1, max = 1, value = 0, shape = null } = {}) => ({ key, label, type: 'range', min, max, default: value, ready: ready || !!shape, shape });
const colour = (key, label, value, { ready = false } = {}) => ({ key, label, type: 'color', default: value, ready });
/** A slider's recipes: `up` for +1, `down` for −1. */
const updown = (up, down) => ({ up, down });
/** The `-decr` and `-incr` targets of one modifier, as a slider's recipes, scaled by `k`. */
const range = (target, k = 1, [lo, hi] = ['decr', 'incr']) => updown({ [`${target}-${hi}`]: k }, { [`${target}-${lo}`]: k });

const MACRO = 'macrodetails/universal-male-young';

/**
 * The builds: each a set of the body sliders' values, added to what they are
 * set to (and kept within their range).
 */
export const BUILDS = Object.freeze({
  average: {},
  slim: { weight: -0.6, muscle: -0.35, shoulders: -0.25 },
  athletic: { muscle: 0.7, weight: -0.3, shoulders: 0.45 },
  stocky: { muscle: 0.35, weight: 0.55, height: -0.45, shoulders: 0.35 },
  heavy: { weight: 1, muscle: -0.15 },
});

export const CUSTOMIZATION = Object.freeze([
  { group: 'Body', slots: [
    // Chosen when the human is made (createHuman's `sex`, or this feature then): a man or a woman.
    choice('sex', 'Figure', ['male', 'female'], { ready: true }),
    choice('build', 'Build', Object.keys(BUILDS), { ready: true }),
    slider('height', 'Height', { shape: updown(
      { 'macrodetails/height/male-young-averagemuscle-averageweight-maxheight': 0.16 },
      { 'macrodetails/height/male-young-averagemuscle-averageweight-minheight': 0.33 },
    ) }),
    // He is baked at 0.62 of the way to the most muscular: up takes him the rest of the way, down to the
    // least. She is baked at a quarter of the way.
    slider('muscle', 'Muscle', { shape: {
      ...updown(
        { [`${MACRO}-maxmuscle-averageweight`]: 0.38 },
        { [`${MACRO}-maxmuscle-averageweight`]: -0.62, [`${MACRO}-minmuscle-averageweight`]: 0.75 },
      ),
      forFemale: updown(
        { [`${MACRO}-maxmuscle-averageweight`]: 0.6 },
        { [`${MACRO}-maxmuscle-averageweight`]: -0.25, [`${MACRO}-minmuscle-averageweight`]: 0.75 },
      ),
    } }),
    // Heavier: MakeHuman's heaviest build, and round the waist, hips, thighs, arms, neck and face besides.
    slider('weight', 'Weight', { shape: updown(
      {
        [`${MACRO}-averagemuscle-maxweight`]: 1, 'measure/measure-waist-circ-incr': 0.8, 'measure/measure-hips-circ-incr': 0.4, 'stomach/stomach-pregnant-incr': 0.15,
        'measure/measure-thigh-circ-incr': 0.5, 'measure/measure-upperarm-circ-incr': 0.4, 'measure/measure-neck-circ-incr': 0.5, 'head/head-fat-incr': 0.6,
      },
      { [`${MACRO}-averagemuscle-minweight`]: 1, 'measure/measure-waist-circ-decr': 0.5, 'measure/measure-thigh-circ-decr': 0.3, 'head/head-fat-decr': 0.4 },
    ) }),
    slider('shoulders', 'Shoulders', { shape: range('measure/measure-shoulder-dist', 1) }),
  ] },
  { group: 'Skin', slots: [
    colour('skin', 'Tone', '#b98a70', { ready: true }),
    slider('age', 'Age', { min: 0, max: 1 }),
    slider('freckles', 'Freckles', { min: 0, max: 1 }),
    choice('scars', 'Scars', ['none', 'cheek', 'brow', 'lip', 'eye']),
    choice('tattoo', 'Face tattoo', ['none', 'tribal', 'runes', 'tear']),
  ] },
  { group: 'Head', slots: [
    choice('face', 'Face shape', ['oval', 'round', 'square', 'long', 'heart', 'diamond'], { shape: {
      oval: {},
      round: { 'head/head-round': 1 },
      square: { 'head/head-square': 1 },
      long: { 'head/head-rectangular': 1 },
      heart: { 'head/head-invertedtriangular': 1 },
      diamond: { 'head/head-diamond': 1 },
    } }),
    slider('headSize', 'Head size', { shape: updown(
      { 'head/head-scale-horiz-incr': 0.35, 'head/head-scale-vert-incr': 0.35, 'head/head-scale-depth-incr': 0.35 },
      { 'head/head-scale-horiz-decr': 0.35, 'head/head-scale-vert-decr': 0.35, 'head/head-scale-depth-decr': 0.35 },
    ) }),
    slider('jaw', 'Jaw width', { shape: updown({ 'chin/chin-bones-incr': 1, 'chin/chin-width-incr': 0.4 }, { 'chin/chin-bones-decr': 1, 'chin/chin-width-decr': 0.4 }) }),
    slider('chin', 'Chin', { shape: range('chin/chin-prominent', 0.7) }),
    slider('cheekbones', 'Cheekbones', { shape: range('cheek/{s}-cheek-bones', 0.7) }),
    slider('forehead', 'Forehead', { shape: range('forehead/forehead-scale-vert', 0.55) }),
  ] },
  { group: 'Eyes', slots: [
    choice('eyeShape', 'Shape', ['almond', 'round', 'hooded', 'monolid', 'upturned', 'downturned'], { shape: {
      almond: {},
      round: { 'eyes/{s}-eye-height2-incr': 0.7, 'eyes/{s}-eye-height1-incr': 0.4, 'eyes/{s}-eye-height3-incr': 0.4 },
      hooded: { 'eyes/{s}-eye-eyefold-down': 0.9, 'eyes/{s}-eye-eyefold-convex': 0.5, 'eyes/{s}-eye-height2-decr': 0.2 },
      monolid: { 'eyes/{s}-eye-epicanthus-out': 0.8, 'eyes/{s}-eye-eyefold-down': 0.7, 'eyes/{s}-eye-height2-decr': 0.35 },
      upturned: { 'eyes/{s}-eye-corner2-up': 1, 'eyes/{s}-eye-corner1-down': 0.4, 'eyes/{s}-eye-eyefold-angle-up': 0.6 },
      downturned: { 'eyes/{s}-eye-corner2-down': 1, 'eyes/{s}-eye-corner1-up': 0.3, 'eyes/{s}-eye-eyefold-angle-down': 0.6 },
    } }),
    slider('eyeSize', 'Size', { shape: range('eyes/{s}-eye-scale', 0.8) }),
    slider('eyeSpacing', 'Spacing', { shape: range('eyes/{s}-eye-trans', 0.8, ['in', 'out']) }),
    // The outer corners up (or down), the inner ones a little the other way.
    slider('eyeTilt', 'Tilt', { shape: updown(
      { 'eyes/{s}-eye-corner2-up': 1, 'eyes/{s}-eye-corner1-down': 0.6, 'eyes/{s}-eye-eyefold-angle-up': 0.6 },
      { 'eyes/{s}-eye-corner2-down': 1, 'eyes/{s}-eye-corner1-up': 0.6, 'eyes/{s}-eye-eyefold-angle-down': 0.6 },
    ) }),
    // Deeper set: the eye and its lids pushed in under the brow.
    slider('eyeDepth', 'Depth', { shape: updown(
      { 'eyes/{s}-eye-push1-in': 0.8, 'eyes/{s}-eye-push2-in': 0.8 },
      { 'eyes/{s}-eye-push1-out': 0.8, 'eyes/{s}-eye-push2-out': 0.8 },
    ) }),
    colour('iris', 'Colour', '#5a4632', { ready: true }),
  ] },
  { group: 'Brows', slots: [
    choice('brows', 'Brows', ['none', ...Object.keys(BROWS)], { ready: true, value: 'natural' }),
    // How thick the brows' hair is: their cards drawn wider and standing further off the skin (shape.js).
    slider('browThickness', 'Thickness', { ready: true }),
    slider('browHeight', 'Height', { shape: range('eyebrows/eyebrows-trans', 1, ['down', 'up']) }),
    slider('browArch', 'Arch', { shape: range('eyebrows/eyebrows-angle', 1, ['down', 'up']) }),
  ] },
  { group: 'Nose', slots: [
    choice('noseShape', 'Shape', ['straight', 'aquiline', 'roman', 'button', 'snub', 'broad', 'hooked'], { shape: {
      straight: {},
      aquiline: { 'nose/nose-curve-convex': 0.7, 'nose/nose-point-down': 0.3, 'nose/nose-point-width-decr': 0.3 },
      roman: { 'nose/nose-hump-incr': 0.7, 'nose/nose-scale-vert-incr': 0.25, 'nose/nose-greek-decr': 0.3 },
      button: { 'nose/nose-scale-vert-decr': 0.5, 'nose/nose-volume-decr': 0.3, 'nose/nose-point-up': 0.45, 'nose/nose-point-width-incr': 0.4 },
      snub: { 'nose/nose-curve-concave': 0.8, 'nose/nose-point-up': 0.7 },
      broad: { 'nose/nose-scale-horiz-incr': 0.5, 'nose/nose-nostrils-width-incr': 0.7, 'nose/nose-flaring-incr': 0.5, 'nose/nose-width2-incr': 0.4 },
      hooked: { 'nose/nose-hump-incr': 1, 'nose/nose-point-down': 0.8, 'nose/nose-septumangle-decr': 0.4 },
    } }),
    slider('noseWidth', 'Width', { shape: range('nose/nose-scale-horiz', 1) }),
    slider('noseLength', 'Length', { shape: range('nose/nose-scale-vert', 1) }),
    slider('noseBridge', 'Bridge', { shape: range('nose/nose-greek', 1) }),
    slider('noseTip', 'Tip', { shape: updown({ 'nose/nose-point-up': 1 }, { 'nose/nose-point-down': 0.6 }) }),
  ] },
  { group: 'Mouth', slots: [
    choice('mouthShape', 'Shape', ['average', 'full', 'thin', 'wide', 'bow', 'downturned'], { shape: {
      average: {},
      full: { 'mouth/mouth-upperlip-volume-incr': 0.7, 'mouth/mouth-lowerlip-volume-incr': 0.7 },
      thin: { 'mouth/mouth-upperlip-volume-decr': 1, 'mouth/mouth-lowerlip-volume-decr': 1, 'mouth/mouth-upperlip-height-decr': 0.4 },
      wide: { 'mouth/mouth-scale-horiz-incr': 0.6 },
      bow: { 'mouth/mouth-cupidsbow-incr': 0.9, 'mouth/mouth-upperlip-volume-incr': 0.25 },
      downturned: { 'mouth/mouth-angles-down': 0.8 },
    } }),
    slider('mouthWidth', 'Width', { shape: range('mouth/mouth-scale-horiz', 1) }),
    slider('lipUpper', 'Upper lip', { shape: range('mouth/mouth-upperlip-volume', 1) }),
    slider('lipLower', 'Lower lip', { shape: range('mouth/mouth-lowerlip-volume', 1) }),
    colour('lipColour', 'Lip colour', '#a86a5e'),
  ] },
  { group: 'Ears', slots: [
    choice('earShape', 'Shape', ['round', 'attached', 'pointed', 'elven'], { shape: {
      round: {},
      attached: { 'ears/{s}-ear-lobe-decr': 1 },
      pointed: { 'ears/{s}-ear-shape-pointed': 1 },
      elven: { 'ears/{s}-ear-shape-pointed': 1, 'ears/{s}-ear-scale-vert-incr': 0.7, 'ears/{s}-ear-rot-backward': 0.4 },
    } }),
    slider('earSize', 'Size', { shape: range('ears/{s}-ear-scale', 1) }),
    slider('earAngle', 'Angle', { shape: range('ears/{s}-ear-wing', 1) }),
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
/**
 * Every baked shape the slots are made of, for the figure `sex`, by name: a
 * slider's `key+` and `key-`, a choice's `key:option`. Each is its recipe,
 * both sides spelled out, the male targets in her form for the woman:
 * { 'group/target': weight }.
 */
export function shapeRecipes(sex = 'male') {
  const out = {};
  const female = sex === 'female';
  const sides = (recipe) => {
    const r = {};
    for (const [t, w] of Object.entries(recipe)) {
      const name = female ? t.replace(/(^|[/-])male-young/g, '$1female-young') : t;
      for (const s of name.includes('{s}') ? ['l', 'r'] : ['']) r[name.replace('{s}', s)] = w;
    }
    return r;
  };
  for (const s of Object.values(SLOTS)) {
    if (!s.shape) continue;
    const shape = (female && s.shape.forFemale) || s.shape;
    if (s.type === 'range') { out[`${s.key}+`] = sides(shape.up); out[`${s.key}-`] = sides(shape.down); }
    else for (const [o, r] of Object.entries(shape)) if (o !== 'forFemale' && Object.keys(r).length) out[`${s.key}:${o}`] = sides(r);
  }
  return out;
}

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
