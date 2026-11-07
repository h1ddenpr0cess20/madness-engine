import { buildWeapon } from './common.js';
import { BROADSWORD_SPEC, createBroadsword } from './broadsword.js';
import { DAGGER_SPEC, BANANA_DAGGER_SPEC, createDagger } from './dagger.js';
import { GREATSWORD_SPEC, createGreatsword } from './greatsword.js';
import { createMorningstar } from './morningstar.js';

function named(weapon, name) {
  weapon.name = name;
  weapon.group.name = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')} display`;
  return weapon;
}

function swordVariant(GFX, spec, name, pommelStyle, guardStyle = 'swept', wrapStyle = 'banded', options = {}) {
  return named(buildWeapon(GFX, {
    ...spec,
    name: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    pommelStyle,
    guardStyle,
    wrapStyle,
  }, options), name);
}

/** The marble-pommel Madness family defaults to rose-gold metal and white leather. */
const MADNESS_DEFAULTS = Object.freeze({
  bladeMetal: 'rose gold',
  hiltMetal: 'rose gold',
  gripColor: '#ffffff',
});

export function createMadnessSword(GFX, options = {}) {
  return named(createBroadsword(GFX, { ...MADNESS_DEFAULTS, ...options }), 'Madness Sword');
}

export function createMadnessDagger(GFX, options = {}) {
  return named(createDagger(GFX, { ...MADNESS_DEFAULTS, ...options }), 'Madness Dagger');
}

export function createMadnessGreatsword(GFX, options = {}) {
  return named(createGreatsword(GFX, { ...MADNESS_DEFAULTS, ...options }), 'Madness Greatsword');
}

export function createMadnessMorningstar(GFX, options = {}) {
  return named(createMorningstar(GFX, {
    metal: 'rose gold',
    gripColor: '#ffffff',
    ...options,
  }), 'Madness Morningstar');
}

/** Same sword geometry and banded grip; the glass marble is a metal ball. */
export function createRegularSword(GFX, options = {}) {
  return swordVariant(GFX, BROADSWORD_SPEC, 'Regular Sword', 'metal-ball', 'swept', 'banded', options);
}

export function createRegularDagger(GFX, options = {}) {
  return swordVariant(GFX, DAGGER_SPEC, 'Regular Dagger', 'metal-ball', 'swept', 'banded', options);
}

export function createRegularGreatsword(GFX, options = {}) {
  return swordVariant(GFX, GREATSWORD_SPEC, 'Regular Greatsword', 'metal-ball', 'swept', 'banded', options);
}

export function createRegularMorningstar(GFX, options = {}) {
  return named(createMorningstar(GFX, {
    ...options,
    pommelStyle: 'metal-ball',
    guardStyle: 'swept',
    wrapStyle: 'banded',
  }), 'Regular Morningstar');
}

/**
 * Krystal's sword and dagger retain the Madness blade, swept guard and
 * banded grip, replacing the marble with her crystal orb and adding her
 * animated mist as an optional sheath around the blade.
 */
const KRYSTAL_GRIP_COLOR = '#25364a';
const KRYSTAL_THREAD_COLOR = '#a7e6ff';

function createKrystalVariant(GFX, spec, slug, label, options) {
  return named(buildWeapon(GFX, {
    ...spec,
    name: slug,
    pommelStyle: 'krystal',
    guardStyle: 'lightning',
    guardThickness: 0.016,
    wrapStyle: 'diamond',
  }, {
    bladeMetal: 'platinum',
    hiltMetal: 'platinum',
    gripColor: KRYSTAL_GRIP_COLOR,
    threadColor: KRYSTAL_THREAD_COLOR,
    ...options,
    bladeMist: true,
  }), label);
}

export function createKrystalSword(GFX, options = {}) {
  return createKrystalVariant(GFX, BROADSWORD_SPEC, 'krystal-sword', 'Krystal Sword', options);
}

export function createKrystalDagger(GFX, options = {}) {
  return createKrystalVariant(GFX, DAGGER_SPEC, 'krystal-dagger', 'Krystal Dagger', options);
}

/** The inverted lightning-guard Magic Egg Sword with glass egg and white/yellow mist. */
function createMagicEggVariant(GFX, spec, slug, label, options = {}) {
  return named(buildWeapon(GFX, {
    ...spec,
    name: slug,
    pommelStyle: 'magic-egg',
    guardStyle: 'lightning',
    guardInverted: true,
    guardThickness: 0.016,
    wrapStyle: 'diamond',
    bladeMistPalette: 'egg',
  }, {
    bladeMetal: 'silver',
    hiltMetal: 'gold',
    gripColor: '#c0c0c0',
    threadColor: '#ffd264',
    ...options,
    bladeMist: true,
  }), label);
}

/** Magic Egg sword, dagger and greatsword share the same glass egg construction and finish palette. */
export function createMagicEggSword(GFX, options = {}) {
  return createMagicEggVariant(GFX, BROADSWORD_SPEC, 'magic-egg-sword', 'Magic Egg Sword', options);
}

export function createMagicEggDagger(GFX, options = {}) {
  return createMagicEggVariant(GFX, DAGGER_SPEC, 'magic-egg-dagger', 'Magic Egg Dagger', options);
}

export function createMagicEggGreatsword(GFX, options = {}) {
  return createMagicEggVariant(GFX, GREATSWORD_SPEC, 'magic-egg-greatsword', 'Magic Egg Greatsword', options);
}

const MARC_DEFAULTS = Object.freeze({
  bladeMetal: 'gold',
  hiltMetal: 'gold',
  gripColor: '#101010',
});

/** Marc's family uses the engine metal egg, upward horn guard and diagonal grip wrap. */
function marcsVariant(GFX, spec, label, options) {
  return swordVariant(GFX, spec, label, 'metal-egg', 'horns', 'diagonal', { ...MARC_DEFAULTS, ...options });
}

export function createMarcsSword(GFX, options = {}) {
  return marcsVariant(GFX, BROADSWORD_SPEC, "Marc's Sword", options);
}

export function createMarcsDagger(GFX, options = {}) {
  return marcsVariant(GFX, DAGGER_SPEC, "Marc's Dagger", options);
}

export function createMarcsGreatsword(GFX, options = {}) {
  return marcsVariant(GFX, GREATSWORD_SPEC, "Marc's Greatsword", options);
}

export function createMarcsMorningstar(GFX, options = {}) {
  return named(createMorningstar(GFX, {
    metal: 'gold',
    gripColor: '#101010',
    ...options,
    pommelStyle: 'metal-egg',
    guardStyle: 'none',
    wrapStyle: 'diagonal',
  }), "Marc's Morningstar");
}

/** A half-peeled banana: the dagger blade out of chrome-and-brass peel flaps over a curved brass grip. */
export function createBananaDagger(GFX, options = {}) {
  return named(buildWeapon(GFX, BANANA_DAGGER_SPEC, {
    bladeMetal: 'silver',
    hiltMetal: 'brass',
    accentMetal: 'chrome',
    ...options,
  }), 'Banana Dagger');
}
