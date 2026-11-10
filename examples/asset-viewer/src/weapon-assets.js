/**
 * The Weapons shelf's catalog. Each entry names a factory in
 * `src/weapons/variants.js`, the set it belongs to and the hands that hold it.
 * The entries are plain data, so a test can check each one against the weapon
 * it builds.
 */
import { HANDS, HAND_LABELS, RANGE, RANGE_LABELS } from '../../../src/weapons/categories.js';

const ONE = HANDS.ONE;
const TWO = HANDS.TWO;

export const WEAPON_ASSETS = [
  { id: 'weapons/madness-sword', factory: 'createMadnessSword', name: 'Madness Sword', set: 'Madness Set', hands: ONE, paletteKind: 'weapon', bladeMetal: 'rose gold', hiltMetal: 'rose gold', grip: '#ffffff' },
  { id: 'weapons/madness-dagger', factory: 'createMadnessDagger', name: 'Madness Dagger', set: 'Madness Set', hands: ONE, paletteKind: 'weapon', bladeMetal: 'rose gold', hiltMetal: 'rose gold', grip: '#ffffff' },
  { id: 'weapons/madness-greatsword', factory: 'createMadnessGreatsword', name: 'Madness Greatsword', set: 'Madness Set', hands: TWO, paletteKind: 'weapon', bladeMetal: 'rose gold', hiltMetal: 'rose gold', grip: '#ffffff' },
  { id: 'weapons/madness-morningstar', factory: 'createMadnessMorningstar', name: 'Madness Morningstar', set: 'Madness Set', hands: ONE, paletteKind: 'morningstar', metal: 'rose gold', grip: '#ffffff' },
  { id: 'weapons/krystal-sword', factory: 'createKrystalSword', name: 'Krystal Sword', set: 'Krystal Set', hands: ONE, paletteKind: 'weapon', bladeMetal: 'platinum', hiltMetal: 'platinum', grip: '#25364a', thread: '#a7e6ff' },
  { id: 'weapons/krystal-dagger', factory: 'createKrystalDagger', name: 'Krystal Dagger', set: 'Krystal Set', hands: ONE, paletteKind: 'weapon', bladeMetal: 'platinum', hiltMetal: 'platinum', grip: '#25364a', thread: '#a7e6ff' },
  { id: 'weapons/magic-egg-sword', factory: 'createMagicEggSword', name: 'Magic Egg Sword', set: 'Magic Egg Set', hands: ONE, paletteKind: 'weapon', bladeMetal: 'silver', hiltMetal: 'gold', grip: '#c0c0c0', thread: '#ffd264' },
  { id: 'weapons/magic-egg-dagger', factory: 'createMagicEggDagger', name: 'Magic Egg Dagger', set: 'Magic Egg Set', hands: ONE, paletteKind: 'weapon', bladeMetal: 'silver', hiltMetal: 'gold', grip: '#c0c0c0', thread: '#ffd264' },
  { id: 'weapons/magic-egg-greatsword', factory: 'createMagicEggGreatsword', name: 'Magic Egg Greatsword', set: 'Magic Egg Set', hands: TWO, paletteKind: 'weapon', bladeMetal: 'silver', hiltMetal: 'gold', grip: '#c0c0c0', thread: '#ffd264' },
  { id: 'weapons/banana-dagger', factory: 'createBananaDagger', name: 'Banana Dagger', set: 'Banana Set', hands: ONE, paletteKind: 'weapon', bladeMetal: 'platinum', hiltMetal: 'brass', metalGrip: true },
  { id: 'weapons/banana-broadsword', factory: 'createBananaBroadsword', name: 'Banana Broadsword', set: 'Banana Set', hands: ONE, paletteKind: 'weapon', bladeMetal: 'platinum', hiltMetal: 'brass', metalGrip: true },
  { id: 'weapons/regular-sword', factory: 'createRegularSword', name: 'Regular Sword', set: 'Regular Set', hands: ONE, paletteKind: 'weapon' },
  { id: 'weapons/regular-dagger', factory: 'createRegularDagger', name: 'Regular Dagger', set: 'Regular Set', hands: ONE, paletteKind: 'weapon' },
  { id: 'weapons/granite-sword', factory: 'createGraniteSword', name: 'Granite Sword', set: 'Granite Set', hands: ONE, paletteKind: 'granite-weapon', grip: '#101010', granite: 'grey' },
  { id: 'weapons/granite-dagger', factory: 'createGraniteDagger', name: 'Granite Dagger', set: 'Granite Set', hands: ONE, paletteKind: 'granite-weapon', grip: '#101010', granite: 'grey' },
  { id: 'weapons/regular-greatsword', factory: 'createRegularGreatsword', name: 'Regular Greatsword', set: 'Regular Set', hands: TWO, paletteKind: 'weapon' },
  { id: 'weapons/regular-morningstar', factory: 'createRegularMorningstar', name: 'Regular Morningstar', set: 'Regular Set', hands: ONE, paletteKind: 'morningstar' },
  { id: 'weapons/marcs-sword', factory: 'createMarcsSword', name: "Marc's Sword", set: "Marc's Set", hands: ONE, paletteKind: 'weapon', bladeMetal: 'gold', hiltMetal: 'gold', grip: '#101010' },
  { id: 'weapons/marcs-dagger', factory: 'createMarcsDagger', name: "Marc's Dagger", set: "Marc's Set", hands: ONE, paletteKind: 'weapon', bladeMetal: 'gold', hiltMetal: 'gold', grip: '#101010' },
  { id: 'weapons/marcs-greatsword', factory: 'createMarcsGreatsword', name: "Marc's Greatsword", set: "Marc's Set", hands: TWO, paletteKind: 'weapon', bladeMetal: 'gold', hiltMetal: 'gold', grip: '#101010' },
  { id: 'weapons/marcs-morningstar', factory: 'createMarcsMorningstar', name: "Marc's Morningstar", set: "Marc's Set", hands: ONE, paletteKind: 'morningstar', metal: 'gold', grip: '#101010' },
];

/**
 * The shelf a weapon is put on: 'Ranged' for a weapon that strikes at a
 * distance, otherwise its hands ('One-handed' or 'Two-handed').
 */
export function weaponShelf({ hands, range }) {
  return range === RANGE.RANGED ? RANGE_LABELS[RANGE.RANGED] : HAND_LABELS[hands];
}
