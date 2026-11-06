import { buildWeapon } from './common.js';
import { BROADSWORD_SPEC, createBroadsword } from './broadsword.js';
import { DAGGER_SPEC, createDagger } from './dagger.js';
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

/** The original marble-pommel family, now explicitly named Madness. */
export function createMadnessSword(GFX, options = {}) {
  return named(createBroadsword(GFX, options), 'Madness Sword');
}

export function createMadnessDagger(GFX, options = {}) {
  return named(createDagger(GFX, options), 'Madness Dagger');
}

export function createMadnessGreatsword(GFX, options = {}) {
  return named(createGreatsword(GFX, options), 'Madness Greatsword');
}

export function createMadnessMorningstar(GFX, options = {}) {
  return named(createMorningstar(GFX, options), 'Madness Morningstar');
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
export function createKrystalSword(GFX, options = {}) {
  return named(buildWeapon(GFX, {
    ...BROADSWORD_SPEC,
    name: 'krystal-sword',
    pommelStyle: 'krystal',
    guardStyle: 'swept',
    wrapStyle: 'banded',
  }, { ...options, bladeMist: true }), 'Krystal Sword');
}

export function createKrystalDagger(GFX, options = {}) {
  return named(buildWeapon(GFX, {
    ...DAGGER_SPEC,
    name: 'krystal-dagger',
    pommelStyle: 'krystal',
    guardStyle: 'swept',
    wrapStyle: 'banded',
  }, { ...options, bladeMist: true }), 'Krystal Dagger');
}

/** A broad fantasy sword with a swept three-bend lightning guard and diamond-stitched grip. */
export function createLightningSword(GFX, options = {}) {
  return named(buildWeapon(GFX, {
    ...BROADSWORD_SPEC,
    name: 'lightning-sword',
    pommelStyle: 'marble',
    guardStyle: 'lightning',
    guardThickness: 0.016,
    wrapStyle: 'diamond',
  }, options), 'Lightning Sword');
}

/** Marc's family uses the engine metal egg, upward horn guard and diagonal grip wrap. */
export function createMarcsSword(GFX, options = {}) {
  return swordVariant(GFX, BROADSWORD_SPEC, "Marc's Sword", 'metal-egg', 'horns', 'diagonal', options);
}

export function createMarcsDagger(GFX, options = {}) {
  return swordVariant(GFX, DAGGER_SPEC, "Marc's Dagger", 'metal-egg', 'horns', 'diagonal', options);
}

export function createMarcsGreatsword(GFX, options = {}) {
  return swordVariant(GFX, GREATSWORD_SPEC, "Marc's Greatsword", 'metal-egg', 'horns', 'diagonal', options);
}

export function createMarcsMorningstar(GFX, options = {}) {
  return named(createMorningstar(GFX, {
    ...options,
    pommelStyle: 'metal-egg',
    guardStyle: 'none',
    wrapStyle: 'diagonal',
  }), "Marc's Morningstar");
}
