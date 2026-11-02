import { axisRot, bag, cloth, hold, person, rigid, shell, strap } from './person.js';

/**
 * The Theme-Park Ninja: from the ninja village at the park outside town,
 * in black from hood to split-toed boots, the mask over the face but for
 * the eyes, a red headband, the sword on the back, a throwing star in each
 * hand, creeping. Invisible. Mostly. The name badge pinned on the chest
 * says Kenji. About 0.9 tiles tall when he stands up.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const BLACK = cloth('#1a1a22', '#0a0a10');

export default person({
  name: 'ninja',
  scale: 1.42,
  b: 0.96,
  shape: { legs: 1.02, girth: 0.9 },
  skin: '#e8c0a0',
  look: { torso: BLACK, sleeve: BLACK, cuff: BLACK, hand: BLACK, legs: BLACK, boot: '#0a0a10', sole: '#050508' },
  mats: { hand: 'cloth', boot: 'cloth' },
  face: { eyeColor: '#1a1210', brow: '#14100a', mood: 1, ears: false, blush: 0 },
  style: {
    attack: 'slash', twist: -0.9,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Crouched and creeping, a star ready in each hand, looking left and right.
      k.move('hips', 0, -0.05, 0);
      k.turn('spine', 0.3, 0, 0);
      for (const [S, m] of [['L', 1], ['R', -1]]) {
        hold(k, `thigh${S}`, -0.7, 0, m * 0.2);
        hold(k, `shin${S}`, 0.9, 0, 0);
        hold(k, `foot${S}`, -0.2, 0, 0);
        hold(k, `arm${S}`, -0.7, 0, m * 0.3);
        hold(k, `fore${S}`, -1.0, 0, 0);
      }
      if (clip === 'walk') k.move('root', 0, Math.abs(Math.sin(T * 6)) * 0.01, 0);
      k.turn('head', -0.2, Math.round(Math.sin(T * 0.7) * 2) * 0.3, 0);
    },
  },
  extras(s, J, { pose }) {
    // The hood and the mask: black cloth over the whole head and neck, but for a slot for the eyes.
    const slot = (p) => Math.max(Math.abs(p[1] - 0.668) - 0.019, Math.abs(p[0]) - 0.07, 0.04 - p[2]);
    shell(s, (p) => Math.max(0.55 - p[1], -slot(p)), { color: BLACK, mat: 'cloth', part: 'outer', thick: 0.006, lift: 0.002, over: ['head', 'hair'], bones: { head: (p) => 0.585 - p[1], chest: (p) => p[1] - 0.585 }, k: 0.004 });
    // The headband, red, knotted at the back, its tails flying.
    strap(s, [[0, 0.71, 0.11], [0.08, 0.715, 0.075], [0.112, 0.72, 0.0], [0.08, 0.725, -0.08], [0, 0.73, -0.11], [-0.08, 0.725, -0.08], [-0.112, 0.72, 0.0], [-0.08, 0.715, 0.075], [0, 0.71, 0.11]], { width: 0.016, thick: 0.004, color: '#c8141e', mat: 'cloth', part: 'outer2', over: ['outer'], bone: 'head', closed: true });
    s.part('outer2', () => {
      s.sphere([0, 0.728, -0.118], 0.011, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.003 });
      for (const m of [1, -1]) s.flake([m * 0.006, 0.726, -0.122], [m * 0.045, 0.69, -0.21], [m * 0.2, 1, 0], 0.011, 0.013, 0.28, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.002 });
    });
    // The sword on the back in its black scabbard, straight, the hilt up over the right shoulder: a gold guard, the
    // grip bound in red; the scabbard's cords round the chest.
    const a = [0.085, 0.31, -0.105], b = [-0.075, 0.6, -0.105], d = b.map((v, i) => v - a[i]), L = Math.hypot(...d), u = d.map((v) => v / L);
    const on = (t) => a.map((v, i) => v + u[i] * t);
    rigid(s, on(L * 0.5), () => s.part('kit', () => {
      s.limb(on(0), on(L), 0.012, 0.011, { color: '#14141a', mat: 'leather', bone: 'chest', k: 0.002 });
      s.cylinder(on(L + 0.004), 0.021, 0.003, { color: '#d8b040', mat: 'metal', bone: 'chest', k: 0.001, rot: [0, 0, -Math.atan2(u[0], u[1])] });
      s.limb(on(L + 0.008), on(L + 0.1), 0.009, 0.009, { color: '#a8141e', mat: 'cloth', bone: 'chest', k: 0.002, bump: [0.0012, 300] });
      s.sphere(on(L + 0.104), 0.0095, { color: '#d8b040', mat: 'metal', bone: 'chest', k: 0.002 });
    }));
    strap(s, [[-0.06, 0.53, 0.05], [0.0, 0.45, 0.08], [0.09, 0.36, 0.05], [0.1, 0.34, -0.03], [0.04, 0.38, -0.085], [-0.04, 0.5, -0.08], [-0.06, 0.53, 0.05]], { width: 0.007, thick: 0.003, color: '#2a2a32', mat: 'cloth', over: ['top', 'bottoms'], keep: TRUNK, closed: true });
    // The name badge, white with a blue stripe: hello.
    const badge = bag(s, [-0.045, 0.47, 0.08], { size: [0.022, 0.013, 0.0018], color: '#f4f2ec', flap: false, over: ['top', 'straps'], bone: 'chest' });
    s.paint((p) => Math.max(Math.abs(p[0] - badge.c[0]) - 0.022, Math.abs(p[1] - badge.c[1] - 0.008) - 0.004, badge.c[2] - 0.002 - p[2]), '#1a4ad8', 0.0008);
    // A throwing star in each fist, held flat out past the thumb: four points round a hole.
    for (const S of ['L', 'R']) {
      const G = pose.grip(S), n = G.out;
      const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, y]) => G.along.map((v, i) => (v * x + G.up[i] * y) / Math.SQRT2));
      const c = G.at(0.045);
      pose.hold(s, `hand${S}`, () => s.part('fine', () => {
        for (const dv of dirs) s.flake(c, c.map((v, i) => v + dv[i] * 0.03), n, 0.009, 0.0015, 0.22, { color: '#c8ccd4', mat: 'metal', k: 0.002 });
        s.cylinder(c, 0.006, 0.0035, { color: '#16161a', mat: 'metal', k: 0.001, rot: axisRot(n) });
      }));
    }
  },
});
