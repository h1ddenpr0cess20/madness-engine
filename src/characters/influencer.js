import { cloth, person, plate } from './person.js';
import { glasses } from './wardrobe.js';

/**
 * The Influencer: a glossy pink jacket, dark glasses indoors, a perfect
 * swoop of hair, and a selfie stick held high with a ring light on the end
 * of it that glows. Is not here for the music. Is here for the light.
 * About 0.9 tiles tall.
 */

export default person({
  name: 'influencer',
  scale: 1.4,
  b: 0.98,
  shape: { legs: 1.14, girth: 0.86, head: 1.06 },
  skin: '#e8b090',
  look: { torso: cloth('#ff5ab0', '#c0307a'), sleeve: cloth('#ff5ab0', '#c0307a'), cuff: cloth('#ff5ab0', '#c0307a'), legs: '#f2f0ec', boot: '#ffffff' },
  mats: { torso: 'plastic', sleeve: 'plastic', cuff: 'plastic', legs: 'cloth', boot: 'rubber' },
  face: { eyeColor: '#3a5a2a', brow: '#d8b050', blush: 0.1 },
  hair: { color: cloth('#e8c060', '#a8802a'), locks: [[[0, 0.78, 0.04], [0.02, 0.84, 0.14], 0.045], [[0.05, 0.77, 0.0], [0.1, 0.72, -0.03], 0.03], [[-0.05, 0.77, 0.0], [-0.1, 0.72, -0.03], 0.03]] },
  style: {
    attack: 'shove', twist: 0,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      // The stick held up and out in front, the phone turned back on her, posing for it.
      k.turn('armR', -1.75 + Math.sin(T * 1.2) * 0.05, 0, -0.35);
      k.turn('foreR', -0.25, 0, 0);
      aim?.(k, 'R', 'chest', [-0.2, 1.2, 0.55]);
      k.turn('head', 0.0, Math.sin(T * 0.9) * 0.1, 0.18);
      k.turn('chest', 0, 0, -0.05);
    },
  },
  extras(s, J, { pose }) {
    glasses(s, { rim: '#ff5ab0', round: false, dark: true, size: 0.026 });
    // The selfie stick up out of the fist, the phone on the end of it turned back to face them, and the ring light
    // round the phone, glowing white.
    const G = pose.grip('R'), top = G.at(0.3);
    const face = pose.at('head', [0, 0.67, 0.1]);
    let n = face.map((v, i) => v - top[i]);
    const nl = Math.hypot(...n);
    n = n.map((v) => v / nl);
    const up0 = G.along, d = up0[0] * n[0] + up0[1] * n[1] + up0[2] * n[2];
    let up = up0.map((v, i) => v - n[i] * d);
    const ul = Math.hypot(...up);
    up = up.map((v) => v / ul);
    const across = [up[1] * n[2] - up[2] * n[1], up[2] * n[0] - up[0] * n[2], up[0] * n[1] - up[1] * n[0]];
    const rot = [Math.atan2(Math.hypot(n[0], n[2]), n[1]), Math.atan2(n[0], n[2]), 0];
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(G.at(-0.05), G.at(0.04), 0.0085, 0.0085, { color: '#1a1a1e', mat: 'plastic', k: 0.003 });
        plate(s, top, across, up, [0.026, 0.048, 0.0045], 0.004, { color: '#101014', mat: 'plastic', k: 0.002 });
      });
      s.part('fine', () => s.limb(G.at(0.04), G.at(0.29), 0.0055, 0.0045, { color: '#1a1a1e', mat: 'metal', k: 0.002 }));
      s.part('fine', () => s.torus(top.map((v, i) => v - n[i] * 0.004), 0.072, 0.0095, { color: '#ffffff', mat: 'screen', k: 0.002, rot }));
    });
  },
});
