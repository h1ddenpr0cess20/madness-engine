import { bag, cloth, cord, hold, person } from './person.js';
import { baseballCap, battleVest } from './metalwear.js';
import { print } from './wardrobe.js';

/**
 * Security: a hi-vis vest with reflective stripes, a black cap, a radio on
 * the shoulder and a hand on it. Has a radio. Is using the radio. About 1.1
 * tiles tall and well built.
 */

const BLACK = cloth('#16161a', '#0a0a0c');

export default person({
  name: 'security',
  scale: 1.6,
  b: 1.4,
  shape: { legs: 0.94, girth: 1.22, hips: 1.1 },
  belly: 1.0,
  skin: '#b8805e',
  look: { torso: BLACK, sleeve: BLACK, cuff: BLACK, legs: BLACK, boot: '#0a0a0c', sole: '#16161a', belt: '#0a0a0c', buckle: '#8a8e98' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#160d07', mood: 1, jaw: 1.18 },
  style: {
    attack: 'punch', heavy: 0.8, twist: 0,
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // A hand up at the radio on his shoulder, the other at his side; looking the crowd over.
      hold(k, 'armR', -0.6, 0, -0.3); hold(k, 'foreR', -1.8, 0, 0);
      reach?.(k, 'R', 'chest', [-0.07, 0.505, 0.105]);
      k.turn('head', 0, Math.sin(T * 0.5) * 0.3, 0);
    },
  },
  extras(s) {
    baseballCap(s, { color: '#16161a' });
    // The hi-vis vest over the black jacket: its silver bands, SECURITY across the back.
    battleVest(s, { color: '#e8f23a', patches: 0, studs: false, open: 0.02, back: false });
    for (const y of [0.37, 0.43]) s.paint((p) => Math.max(Math.abs(p[1] - y) - 0.007, Math.abs(p[0]) - 0.15, Math.max(0, 0.025 - Math.abs(p[0])) * (p[2] > 0 ? 1 : 0)), '#d8dce0', 0.0015);
    print(s, 'SECURITY', { y: 0.47, size: 0.017, color: '#101014', side: -1, width: 0.0028 });
    // The radio on its clip at the right shoulder, its aerial up; the earpiece's coiled lead.
    const radio = bag(s, [-0.07, 0.505, 0.085], { size: [0.012, 0.022, 0.008], color: '#101014', flap: false, over: ['outer', 'top'], part: 'kit', bone: 'chest' });
    s.part('kit', () => {
      const top = radio.c.map((v, i) => v + radio.up[i] * 0.022 - radio.across[i] * 0.005);
      s.limb(top, top.map((v, i) => v + radio.up[i] * 0.04), 0.0028, 0.002, { color: '#101014', mat: 'plastic', bone: 'chest', k: 0.001 });
    });
    s.part('fine', () => cord(s, [[-0.106, 0.645, 0.01], [-0.1, 0.6, 0.0], [-0.085, 0.565, -0.02], [-0.07, 0.545, -0.045]], 0.0022, { color: '#c8ccd4', mat: 'plastic', bone: 'head' }));
  },
});
