import { axisRot, bag, cloth, onBody, person, plate, strap } from './person.js';
import { baseballCap } from './metalwear.js';
import { headphones } from './wardrobe.js';

/**
 * The Production Assistant: cargo shorts whatever the weather, a crew
 * T-shirt, a lanyard, a walkie on the belt, a headset, a backwards cap and a
 * clipboard with the call sheet on it. Runs everywhere. Says "copy". About
 * 0.9 tiles tall.
 */

const tee = cloth('#2a2a30', '#16161a');

export default person({
  name: 'pa',
  scale: 1.4,
  b: 0.98,
  shape: { legs: 1.06, girth: 0.9 },
  skin: '#c89070',
  look: { torso: tee, sleeve: tee, cuff: '#c89070', legs: cloth('#8a8058', '#5a5238'), shorts: 0.6, shin: 'skin', boot: '#e8e4dc', belt: '#16161a', buckle: '#8a8e98', sole: '#2a2a30' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'rubber' },
  face: { eyeColor: '#3a2a1a', brow: '#2a1a10', mood: 0 },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, talk = Math.max(0, Math.sin(T * 0.9));
      // The clipboard up in front, being checked; the walkie up to the mouth now and then: copy that.
      k.turn('armL', -0.75, 0, 0.15);
      k.turn('foreL', -1.3, 0, 0);
      k.turn('armR', -0.35 - talk * 0.7, 0, -0.25 - talk * 0.1);
      k.turn('foreR', -1.0 - talk * 0.9, 0, 0);
      k.turn('head', 0.2 - talk * 0.1, Math.sin(T * 1.4) * 0.12, 0.08);
    },
  },
  extras(s, J, { pose }) {
    baseballCap(s, { color: '#d8302a', back: true });
    // The headset round the neck, its boom mic swung down.
    headphones(s, { color: '#16161a', around: true });
    // CREW across the back of the shirt, in white.
    const stroke = (x0, y0, x1, y1) => s.paint((p) => {
      const x = p[0] - x0, y = p[1] - y0, dx = x1 - x0, dy = y1 - y0, t = Math.max(0, Math.min(1, (x * dx + y * dy) / (dx * dx + dy * dy)));
      return Math.max(Math.hypot(x - dx * t, y - dy * t) - 0.0035, p[2] + 0.04);
    }, '#f4f2ee', 0.0008);
    // Read from behind: the letters run from +x to −x.
    const X = (i) => 0.039 - i * 0.026, Y0 = 0.465, H = 0.024;
    stroke(X(0) - 0.009, Y0 + H, X(0) + 0.009, Y0 + H); stroke(X(0) + 0.009, Y0 + H, X(0) + 0.009, Y0); stroke(X(0) + 0.009, Y0, X(0) - 0.009, Y0);
    stroke(X(1) + 0.009, Y0, X(1) + 0.009, Y0 + H); stroke(X(1) + 0.009, Y0 + H, X(1) - 0.008, Y0 + H); stroke(X(1) - 0.008, Y0 + H, X(1) - 0.008, Y0 + H * 0.5); stroke(X(1) - 0.008, Y0 + H * 0.5, X(1) + 0.009, Y0 + H * 0.5); stroke(X(1), Y0 + H * 0.5, X(1) - 0.009, Y0);
    stroke(X(2) + 0.008, Y0, X(2) + 0.008, Y0 + H); stroke(X(2) + 0.008, Y0 + H, X(2) - 0.009, Y0 + H); stroke(X(2) + 0.008, Y0 + H * 0.5, X(2) - 0.005, Y0 + H * 0.5); stroke(X(2) + 0.008, Y0, X(2) - 0.009, Y0);
    stroke(X(3) + 0.011, Y0 + H, X(3) + 0.006, Y0); stroke(X(3) + 0.006, Y0, X(3), Y0 + H * 0.6); stroke(X(3), Y0 + H * 0.6, X(3) - 0.006, Y0); stroke(X(3) - 0.006, Y0, X(3) - 0.011, Y0 + H);
    // The lanyard and the laminated pass.
    strap(s, [[0, 0.552, -0.06], [0.05, 0.545, -0.03], [0.056, 0.53, 0.03], [0.03, 0.47, 0.075], [0.004, 0.43, 0.085], [-0.004, 0.43, 0.085], [-0.03, 0.47, 0.075], [-0.056, 0.53, 0.03], [-0.05, 0.545, -0.03], [0, 0.552, -0.06]], { width: 0.006, thick: 0.002, color: '#3a6ad8', mat: 'cloth', over: ['top', 'head'], bone: 'chest' });
    bag(s, [0, 0.405, 0.088], { size: [0.017, 0.024, 0.0018], color: '#f4f2ee', flap: false, over: ['top'], bone: 'chest' });
    // Cargo pockets on the shorts; the gaffer tape on the belt.
    for (const m of [1, -1]) bag(s, [m * 0.075, 0.24, 0.0], { size: [0.014, 0.024, 0.006], color: '#7a7048', flap: '#7a7048', buckle: null, over: ['bottoms'], bone: m > 0 ? 'thighL' : 'thighR' });
    const tape = onBody(s, [-0.1, 0.335, 0.0], ['bottoms', 'belt']);
    s.part('kit', () => s.torus(tape.p.map((v, i) => v + tape.n[i] * 0.016), 0.022, 0.009, { color: '#2a2a30', mat: 'cloth', bone: 'hips', k: 0.002, rot: axisRot(tape.n) }));
    // The clipboard in the left fist, held by its edge and turned up to read: the board, the clip, the sheet.
    const L = pose.grip('L'), n = [L.along[1] * L.out[2] - L.along[2] * L.out[1], L.along[2] * L.out[0] - L.along[0] * L.out[2], L.along[0] * L.out[1] - L.along[1] * L.out[0]];
    pose.hold(s, 'handL', () => s.part('kit', () => {
      const c = L.at(0, 0, -0.06);
      plate(s, c, L.along, L.out, [0.06, 0.048, 0.003], 0.003, { color: '#a87a48', mat: 'leather', k: 0.001 });
      for (const sg of [1, -1]) plate(s, c.map((v, i) => v + n[i] * sg * 0.0035 - L.out[i] * 0.004), L.along, L.out, [0.052, 0.04, 0.001], 0.0005, { color: '#f4f2ee', mat: 'paper', k: 0 });
      plate(s, L.at(0, 0, -0.014), L.along, L.out, [0.02, 0.006, 0.006], 0.002, { color: '#c8ccd4', mat: 'metal', k: 0.001 });
    }));
    // The walkie-talkie in the right: a black block, its stubby aerial up out of the thumb side.
    const R = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      plate(s, R.at(0.005, -0.004, -0.004), R.along, R.up, [0.04, 0.016, 0.011], 0.004, { color: '#16161a', mat: 'plastic', k: 0.002 });
      s.limb(R.at(0.045), R.at(0.08), 0.0045, 0.0035, { color: '#2a2a30', mat: 'plastic', k: 0.001 });
    }));
  },
});
