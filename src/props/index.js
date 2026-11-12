import bucket from './bucket.js';
import caseModel from './case.js';
import chair from './chair.js';
import chest from './chest.js';
import clapper from './clapper.js';
import demo from './demo.js';
import globe from './globe.js';
import gold from './gold.js';
import key from './key.js';
import lighter from './lighter.js';
import pass from './pass.js';
import pick from './pick.js';
import podium from './podium.js';
import popcorn from './popcorn.js';
import potion from './potion.js';
import record from './record.js';
import reel from './reel.js';
import revive from './revive.js';
import suitcase from './suitcase.js';
import tape from './tape.js';
import vinyl from './vinyl.js';
import whetstone from './whetstone.js';
import { bones, cauldron, coffin, cross, deadtree, haybale, mushrooms, obelisk, scarecrow, tombstone } from './halloween.js';
import { barrel, cornshock, gourd, haystack, table, whitepumpkin } from './harvest.js';
import { CAFE } from './cafe.js';
import { GROCERIES } from './groceries.js';
import { bigpumpkin, jack, pumpkin, pumpkinpile } from './pumpkin.js';
import { candycane, candycorn, caramelapple, gumdrop, lollipop, peppermint, sweet } from './sweets.js';
import { crystals, pine, snowball, snowheap, snowlantern, snowrock } from './winter.js';

/**
 * Every sculpted prop in the library, by name: the default version of each.
 */
export const PROPS = {
  bucket, case: caseModel, chair, chest, clapper, demo, globe, gold, key, lighter, pass, pick, podium, popcorn,
  potion, record, reel, revive, suitcase, tape, vinyl, whetstone,
  // Blubber's: the pumpkins, the harvest, the sweets, the graveyard and the winter.
  pumpkin, jack, bigpumpkin, pumpkinpile, whitepumpkin, gourd, cornshock, barrel, haystack, table,
  sweet, candycorn, lollipop, caramelapple, peppermint, gumdrop, candycane,
  haybale, deadtree, scarecrow, tombstone, cross, obelisk, coffin, bones, mushrooms, cauldron,
  snowheap, snowlantern, snowball, pine, snowrock, crystals,
  // Bodega's: the corner store's stock, and the carton it comes in.
  ...GROCERIES,
  // Venture Cafe's: the dining chair, the pedestal table, the counter stool and the booth.
  ...CAFE,
};
export { DICE, DICE_TYPES, createDieProp, createD4, createD6, createD6Pips, createD8, createD10, createDPercentile, createD12, createD20 } from '../dice.js';
export { BOWLING_BALL_DESIGNS, BOWLING_BALL_RADIUS, createBowlingBall } from './bowling-ball.js';
export { PODIUM_ACCENT, PODIUM_SIZE, PODIUM_TILT, PODIUM_TOP, podiumOf } from './podium.js';
export { BOWLING_PIN_DESIGNS, BOWLING_PIN_HEIGHT, BOWLING_PIN_RADIUS, createBowlingPin } from './bowling-pin.js';
export { createBitcoinCoin } from './bitcoin-coin.js';
export { createPoliticalCoin } from './political-coin.js';
export { PUTTER_DIMENSIONS, PUTTER_HEADS, PUTTER_HEAD_NAMES, PUTTER_LENGTHS, PUTTER_LIES, PUTTER_SIGHTS, PUTTER_SPEC, createPutter } from './putter.js';
