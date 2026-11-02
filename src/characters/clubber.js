import { buttons, cloth, hold, onBody, person, strap } from './person.js';
import { shades } from './metalwear.js';

/**
 * The Clubber: black, all of it: a black tee, black jeans, black boots, a
 * leather harness over the tee for no reason anybody has explained, a
 * shaved head, a shaved everything else, a face the colour of a basement
 * and sunglasses, at night, indoors, with the lights off. Has been in this
 * queue since Thursday and does not mean to leave it. About 0.95 tiles
 * tall, and swaying to a beat only it can hear.
 */

const BLACK = cloth('#16161a', '#08080a');

export default person({
  name: 'clubber',
  scale: 1.5,
  b: 1.0,
  shape: { legs: 1.06, girth: 0.86 },
  skin: '#e0d4cc',
  look: { torso: BLACK, sleeve: BLACK, cuff: '#e0d4cc', legs: BLACK, boot: '#0c0c10', sole: '#2a2a30', belt: '#1a1a1e', buckle: '#c8ccd4' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#2a2a30', brow: '#2a2a2a', mood: -1, blush: 0 },
  style: {
    attack: 'slash',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const b = Math.sin(T * 4);
      // The beat from somewhere else: a slow nod, the shoulders going, one hand on the chest and the other hanging.
      hold(k, 'armR', -0.7, 0.2, -0.2); hold(k, 'foreR', -1.4, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.15); hold(k, 'foreL', -0.2, 0, 0);
      k.turn('head', 0.1 + b * 0.08, Math.sin(T * 0.4) * 0.1, 0);
      k.turn('chest', 0, 0, b * 0.05);
    },
  },
  extras(s) {
    shades(s, { color: '#08080a' });
    // The harness, on the T-shirt: a strap over each shoulder from the belt at the back, crossing to a steel ring
    // on the chest, and one down from the ring to the belt in front.
    const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    const ring = onBody(s, [0, 0.445, 0.09], ['top']);
    const R = ring.p.map((v, i) => v + ring.n[i] * 0.004);
    for (const m of [1, -1]) {
      strap(s, [[m * 0.012, 0.448, 0.09], [m * 0.05, 0.5, 0.07], [m * 0.06, 0.552, 0.0], [m * 0.045, 0.5, -0.07], [m * 0.03, 0.4, -0.07], [m * 0.02, 0.352, -0.065]],
        { width: 0.016, thick: 0.004, color: '#1e1e22', over: ['top', 'belt'], keep: trunk });
    }
    strap(s, [[0, 0.432, 0.092], [0, 0.39, 0.09], [0, 0.358, 0.088]], { width: 0.016, thick: 0.004, color: '#1e1e22', over: ['top', 'belt'], keep: trunk });
    s.part('kit', () => s.torus(R, 0.018, 0.0042, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.001, rot: [Math.PI / 2 - Math.asin(ring.n[1]), Math.atan2(ring.n[0], ring.n[2]), 0] }));
    // Rivets where the straps meet the ring.
    buttons(s, [[0.022, 0.456, 0.09], [-0.022, 0.456, 0.09], [0, 0.426, 0.092]], { r: 0.004, color: '#d6d9e0', over: ['straps'] });
  },
});
