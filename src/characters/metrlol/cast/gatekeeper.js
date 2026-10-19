import { cloth, hold, person } from './person.js';
import { battleVest, spikedCuffs } from './metalwear.js';
import { bandana, beard } from './wardrobe.js';
import { chestPrint } from './metalwear.js';

/**
 * The Gatekeeper: a battle vest so covered in patches the denim is a rumour,
 * a band shirt from a tour before you were born, a beard that has been
 * disappointed in everything since 1983, bandana, spiked cuffs, arms folded.
 * Will tell you that it is not real metal. About 1.1 tiles tall, and wide.
 */

const tee = cloth('#101014', '#08080a');

export default person({
  name: 'gatekeeper',
  budget: 17000,
  scale: 1.62,
  b: 1.36,
  shape: { legs: 0.96, girth: 1.18, hips: 1.08, head: 1.04 },
  belly: 0.9,
  skin: '#d8a888',
  look: { torso: tee, sleeve: '#d8a888', cuff: '#d8a888', legs: cloth('#1c2030', '#10131f'), boot: '#141416', sole: '#2a2a2e', belt: '#1a1a1e', buckle: '#c8ccd4' },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#5a5048', mood: 1, jaw: 1.1 },
  hair: { color: cloth('#4a4640', '#2a2824'), locks: [[[0, 0.77, -0.05], [0, 0.45, -0.14], 0.055, 0.5], [[0.06, 0.76, -0.04], [0.09, 0.46, -0.12], 0.045, 0.5], [[-0.06, 0.76, -0.04], [-0.09, 0.46, -0.12], 0.045, 0.5], [[0.09, 0.72, 0.0], [0.11, 0.55, -0.04], 0.035, 0.5], [[-0.09, 0.72, 0.0], [-0.11, 0.55, -0.04], 0.035, 0.5]] },
  style: {
    attack: 'punch', heavy: 0.9,
    after(k, { clip, time, seed }) {
      if (clip !== 'idle' && clip !== 'walk') return;
      const T = time + seed;
      // Arms folded, and a slow shake of the head: no. Not real metal.
      hold(k, 'armR', -0.95, 0, -0.15); hold(k, 'foreR', -0.95, 1.4, 0);
      hold(k, 'armL', -0.9, 0, 0.15); hold(k, 'foreL', -1.0, -1.4, 0);
      k.turn('head', 0.05, Math.sin(T * 1.4) * 0.35, 0);
    },
  },
  extras(s, J) {
    bandana(s, { color: '#1a1a1e' });
    beard(s, { color: '#6a6660', long: 0.8 });
    s.part('kit', () => { chestPrint(s, 'skull', '#d8d4c8', { y: 0.43, size: 0.04 }); });
    battleVest(s, { color: '#2e3c58', patches: 16, seed: 7 });
    spikedCuffs(s, J);
  },
});
