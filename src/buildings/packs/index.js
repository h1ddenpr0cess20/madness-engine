import * as amsterdam from './amsterdam.js';
import * as greece from './greece.js';
import * as istanbul from './istanbul.js';
import * as mexico from './mexico.js';
import * as moscow from './moscow.js';
import * as paris from './paris.js';
import * as rio from './rio.js';
import * as southwest from './southwest.js';
import * as tokyo from './tokyo.js';

/**
 * The city packs: each a set of buildings for one place. `PACK_MODELS` are the
 * models, `PACK_FOOTPRINTS` the tiles each is drawn for, `PACK_OF` the pack a
 * type belongs to, and `PACK_LABELS` the name of each pack for a catalogue.
 */
const PACKS = { amsterdam, greece, istanbul, mexico, moscow, paris, rio, southwest, tokyo };

export const PACK_LABELS = Object.freeze({
  amsterdam: 'Amsterdam', greece: 'Greece', istanbul: 'Istanbul', mexico: 'Mexico', moscow: 'Moscow',
  paris: 'Paris', rio: 'Rio', southwest: 'Southwest', tokyo: 'Tokyo',
});

export const PACK_MODELS = {};
export const PACK_FOOTPRINTS = {};
export const PACK_OF = {};
for (const [id, mod] of Object.entries(PACKS)) {
  for (const [name, value] of Object.entries(mod)) {
    if (name.endsWith('_FOOTPRINTS')) {
      Object.assign(PACK_FOOTPRINTS, value);
      for (const type of Object.keys(value)) PACK_OF[type] = id;
    } else if (typeof value === 'function') {
      PACK_MODELS[name] = value;
    }
  }
}
