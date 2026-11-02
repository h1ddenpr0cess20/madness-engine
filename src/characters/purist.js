import { cloth, hold, person } from './person.js';
import { battleVest, bulletBelt, longHair, spikedCuffs } from './metalwear.js';

/**
 * The Purist: a battle jacket with fifty patches, every one of them a band
 * from before you were born; a bullet belt, a spiked wristband on each
 * arm and a scowl that was fitted at the factory. Arms folded. Will tell
 * you which of your favourites are not metal, which is all of them, and
 * why it ended in 1986. Has not enjoyed a record since. About 1.0 tiles
 * tall, and unmoved.
 */

const TEE = cloth('#16161a', '#08080a');

export default person({
  name: 'purist',
  scale: 1.5,
  b: 1.04,
  shape: { legs: 1.02, girth: 0.96 },
  skin: '#dcb090',
  look: { torso: TEE, sleeve: TEE, cuff: '#dcb090', legs: cloth('#1a1a20', '#0a0a10'), boot: '#16161a', sole: '#3a3a40', belt: '#16161a', buckle: '#c8ccd4' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a3a3a', brow: '#3a3a3a', mood: -1, blush: 0.1 },
  hair: longHair(cloth('#8a8a8a', '#5a5a5a'), { length: 1.1 }),
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Arms folded tight across the chest; a very slow, very disapproving head shake, side to side.
      hold(k, 'armR', -0.95, 0, -0.15); hold(k, 'foreR', -0.95, 1.4, 0);
      hold(k, 'armL', -0.9, 0, 0.15); hold(k, 'foreL', -1.0, -1.4, 0);
      k.turn('head', 0.05, Math.sin(T * 0.8) * 0.2, 0);
    },
  },
  extras(s, J) {
    battleVest(s, { color: '#2a3550', patches: 18, seed: 5, studs: true });
    bulletBelt(s);
    spikedCuffs(s, J, { spikes: 5 });
  },
});
