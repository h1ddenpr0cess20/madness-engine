import archaeologist from './archaeologist.js';
import cabbie from './cabbie.js';
import { CAT_DEFS } from './cat.js';
import corgi from './corgi.js';
import dancer from './dancer.js';
import gent from './gent.js';
import hotdog from './hotdog.js';
import nonna from './nonna.js';
import pigeon from './pigeon.js';
import poodle from './poodle.js';
import rat from './rat.js';
import robot from './robot.js';
import security from './security.js';
import skier from './skier.js';
import superfan from './superfan.js';
import tourist from './tourist.js';
import yodeler from './yodeler.js';

/**
 * The townsfolk, and the animals about town: rigged and sculpted, borrowed
 * from the family — the people and the pigeons, the corgi, the rat and the
 * poodle from Rock 'n' Roller III, the cats (`cat-ginger` and the rest)
 * from Catroller.
 */
export const CAST = {
  archaeologist, cabbie, corgi, dancer, gent, hotdog, nonna, pigeon, poodle, rat, robot, security, skier, superfan, tourist, yodeler,
  ...CAT_DEFS,
};

/** How finely the townsfolk are meshed: a little coarser than a close-up. */
export const DETAIL = 0.6;
