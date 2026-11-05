import { createVisionMaterial } from '../heroes/krystal/vision.js';
import { createStatic } from '../models/model.js';
import { pine } from '../scenery/street.js';
import { MIST } from './glassglobe.js';

/**
 * `STREET.pine` (`scenery/street.js`) in glass, with green mist inside it: the very model the street has, its
 * trunk and four tiers of needles as sculpted, but cast in the crystal ball's glass (`heroes/krystal/model.js`:
 * the same roughness, transmission, thickness, ior, attenuation and clearcoat), and in each tier a cloud of
 * Krystal's mist (`heroes/krystal/vision.js`), green, drifting. Sits on the ground at y = 0, scaled by `scale`
 * (the street's pine is 3.8 tall, so 0.32 makes it a little over a tile).
 *
 *     const tree = createGlassPine(GFX, { scale: 0.32 });
 *     scene.add(tree.group);
 *     stage.run((dt) => tree.update(dt));
 */

/** The crystal ball's glass, as a model's material: `heroes/krystal/model.js` `createBall`. */
const KRYSTAL_GLASS = Object.freeze({
  roughness: 0.02, metalness: 0, transmission: 1, thickness: 0.6, ior: 1.5,
  attenuationColor: '#efe6ff', attenuationDistance: 4, clearcoat: 0.6, clearcoatRoughness: 0.02, specularIntensity: 1,
});

/** The street pine's tiers: where each stands, how wide it is at the base, how tall. */
export const TIERS = Object.freeze([0, 1, 2, 3].map((i) => ({ base: 1.0 + i * 0.62, radius: 1.0 - i * 0.2, height: 0.95 })));

/** The mist's green: the palette's green, with the red and the blue drawn down. */
export const GREEN = Object.freeze({ hue: 0.7, spread: 0.04, tint: [0.45, 1.25, 0.5], glow: 0.75, core: 0.05 });

/**
 * @param {object} GFX
 * @param {object} [options]
 * @param {number} [options.scale]  the street pine's units to tiles
 * @param {boolean} [options.mist]  green mist inside (default true)
 * @param {boolean} [options.animate]  move itself on, once a frame, for where nothing calls `update`
 */
export function createGlassPine(GFX, { scale = 0.32, mist: withMist = true, animate = false } = {}) {
  const group = new GFX.Group();
  group.name = 'glasspine';

  // The street's own pine, with its two materials (bark, needles) both the crystal ball's glass.
  const glassPine = { ...pine, bones: [['root', null, [0, 0, 0]]], name: 'glass pine', scale, materials: { bark: KRYSTAL_GLASS, leaves: KRYSTAL_GLASS } };
  const tree = createStatic(GFX, glassPine);
  tree.name = 'tree';
  tree.castShadow = false;
  tree.receiveShadow = false;
  // Clear, as the ball is: no vertex colors to tint it, and no depth written, so the mist shows through.
  for (const m of [].concat(tree.material)) {
    m.vertexColors = false;
    m.color?.set('#ffffff');
    m.depthWrite = false;
    m.needsUpdate = true;
  }
  group.add(tree);

  const clouds = [];
  const mistMaterials = [];
  const addCloud = (name, x, y, z, radius) => {
    const material = createVisionMaterial(GFX);
    material.uniforms.uRadius.value = radius * scale;
    const cloud = new GFX.Mesh(new GFX.SphereGeometry(radius * scale, 48, 36), material);
    cloud.name = name;
    cloud.renderOrder = 1;
    cloud.castShadow = false;
    cloud.receiveShadow = false;
    cloud.position.set(x * scale, y * scale, z * scale);
    cloud.visible = Boolean(withMist);
    group.add(cloud);
    clouds.push(cloud);
    mistMaterials.push(material);
  };
  for (const [i, t] of TIERS.entries()) {
    // The cloud in the tier: the largest sphere that fits in its cone, a little over, so it fills it out to the glass.
    const inscribed = (t.radius * t.height) / (t.radius + Math.hypot(t.radius, t.height)) * 1.3;
    addCloud(`mist ${i}`, 0, t.base + inscribed * 0.92, 0, inscribed);
    // The wide lower tiers, which one cloud leaves bare round its edge, have clouds spread round it as well.
    if (i < 3) {
      const around = 3 + (2 - i);
      for (let k = 0; k < around; k++) {
        const a = (k / around) * Math.PI * 2 + i;
        addCloud(`mist ${i}.${k}`, Math.cos(a) * t.radius * 0.55, t.base + t.height * 0.16, Math.sin(a) * t.radius * 0.55, inscribed * 0.62);
      }
    }
  }

  const mood = { ...MIST, ...GREEN };
  let flow = 0;
  const api = {
    group, tree, clouds, mood,
    /** The mist, shown or cleared; `settings` are any of `MIST`'s. */
    setMist(settings = {}, show = true) {
      Object.assign(mood, settings);
      for (const c of clouds) c.visible = show;
      return api;
    },
    /** Moves it on `dt` seconds: the mist's flow. Call it every frame. */
    update(dt) {
      if (!clouds[0].visible) return;
      flow += dt * mood.speed;
      for (const [i, material] of mistMaterials.entries()) {
        const u = material.uniforms;
        // Each tier's cloud is a little out of step with the rest, so they do not move as one.
        u.uFlow.value = flow + i * 1.3;
        u.uSwirl.value = mood.swirl;
        u.uChurn.value = mood.churn;
        u.uGlow.value = mood.glow;
        u.uCore.value = mood.core;
        u.uHue.value = mood.hue;
        u.uSpread.value = mood.spread;
        u.uTint.value.set(...mood.tint);
        clouds[i].updateWorldMatrix?.(true, false);
        u.uCenter.value.setFromMatrixPosition(clouds[i].matrixWorld);
      }
    },
  };
  if (animate) {
    const timer = new GFX.Timer();
    tree.onBeforeRender = () => {
      timer.update();
      api.update(Math.min(timer.getDelta(), 0.05));
    };
  }
  return api;
}
