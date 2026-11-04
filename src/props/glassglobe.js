import { createEtchCanvas } from '../textures/earth/map.js';
import { createHazeMaterial } from '../textures/earth/haze.js';
import { createVisionMaterial } from '../heroes/krystal/vision.js';

/**
 * A clear glass Earth: a sphere of glass (a transmissive physical material,
 * as Alan's eye, the marble and Krystal's ball are) with the continents
 * etched on it from real coordinates (`textures/earth/map.js`), and room
 * inside for something to move: Krystal's coloured mist, a colorized map of
 * anything over the Earth (`setField`), or both.
 *
 * The etching is frosted glass: milky land with a fine bright coast, on a
 * clear sea. It is on the glass itself, so it is drawn twice, as it is on a
 * real etched globe: once on the near side, and once on the far side, which
 * you see through the glass from the inside, back to front.
 *
 * Longitude 0, latitude 0 faces +x (and east is -z) until `orient` turns it.
 *
 *     const globe = createGlassGlobe(GFX, { radius: 1 });
 *     scene.add(globe.group);
 *     globe.orient(40, -95);              // North America to the front
 *     globe.setField(canvas);             // a map of colour inside the glass
 *     stage.run((dt) => globe.update(dt));
 */

/** In course tiles, as the marble is: a globe a little over a tile across. */
export const RADIUS = 0.6;

/** Where the inner things sit, as fractions of the radius. */
export const FIELD_RADIUS = 0.93;
export const MIST_RADIUS = 0.95;
export const HAZE_RADIUS = 0.997;

/** The mist's settings: Krystal's, but all one blue (`spread: 0`); raise `spread` for her many colors. See `heroes/krystal/moods.js`. */
export const MIST = Object.freeze({ speed: 0.22, swirl: 2.0, churn: 0.5, glow: 0.8, core: 0.2, hue: 0.52, spread: 0 });

/**
 * @param {object} GFX
 * @param {object} [options]
 * @param {number} [options.radius]
 * @param {string|boolean} [options.mist]  Krystal's mist inside: true, or false for clear glass
 * @param {boolean} [options.etch]  the continents (default true)
 * @param {number} [options.etchWidth]  how wide the etching is painted, in texels
 * @param {HTMLCanvasElement} [options.etchCanvas]  an etching of your own, equirectangular (a planet's), in place of the Earth's
 * @param {object} [options.etchStyle]  `fill`, `coast` (CSS colors, alpha included) and `line` (width at 4096) of the etching
 * @param {boolean} [options.animate]  move itself on, once a frame, as Krystal does, for where nothing calls `update`
 * @param {number|null} [options.graticule]  degrees between etched lines of latitude and longitude, or null
 */
export function createGlassGlobe(GFX, { radius = RADIUS, mist: withMist = false, etch: withEtch = true, etchWidth = 4096, etchStyle = {}, etchCanvas = null, graticule = null, seed = 0, animate = false } = {}) {
  const R = radius;
  const scale = R / 0.8;

  const glass = new GFX.Mesh(
    new GFX.SphereGeometry(R, 128, 96),
    new GFX.MeshPhysicalMaterial({
      name: 'glass',
      color: new GFX.Color('#ffffff'),
      metalness: 0,
      roughness: 0.02,
      transmission: 1,
      thickness: 0.6 * scale,
      ior: 1.5,
      attenuationColor: new GFX.Color('#e4f2ff'),
      attenuationDistance: 5 * scale,
      clearcoat: 0.6,
      clearcoatRoughness: 0.02,
      specularIntensity: 1,
      depthWrite: false,
    }),
  );
  glass.name = 'glass';
  glass.castShadow = false;

  const spin = new GFX.Group();
  spin.name = 'earth';
  spin.add(glass);

  // --- the etching
  let etchTexture = null;
  const etched = [];
  if (withEtch) {
    const canvas = etchCanvas ?? createEtchCanvas({ width: etchWidth, graticule, ...etchStyle });
    if (canvas) {
      etchTexture = new GFX.CanvasTexture(canvas);
      etchTexture.colorSpace = GFX.SRGBColorSpace;
      etchTexture.anisotropy = 8;
      for (const [name, side, grow] of [['etch-near', GFX.FrontSide, 1.0015], ['etch-far', GFX.BackSide, 0.9985]]) {
        const shell = new GFX.Mesh(
          new GFX.SphereGeometry(R * grow, 128, 96),
          new GFX.MeshStandardMaterial({
            name, map: etchTexture, color: new GFX.Color('#ffffff'),
            roughness: 0.9, metalness: 0, transparent: true, side, depthWrite: false,
          }),
        );
        shell.name = name;
        shell.renderOrder = 2;
        shell.castShadow = false;
        etched.push(shell);
        spin.add(shell);
      }
    }
  }

  // --- the mist, Krystal's, inside the glass
  const mistMaterial = createVisionMaterial(GFX);
  mistMaterial.uniforms.uRadius.value = R * MIST_RADIUS;
  const mist = new GFX.Mesh(new GFX.SphereGeometry(R * MIST_RADIUS, 64, 48), mistMaterial);
  mist.name = 'mist';
  mist.renderOrder = 1;
  mist.castShadow = false;
  mist.receiveShadow = false;
  mist.visible = Boolean(withMist);
  spin.add(mist);
  const mood = { ...MIST };
  let flow = seed * 100;

  // --- a field of colour, as mist: the haze (`textures/earth/haze.js`) reads a map of the Earth as it marches through the glass
  let field = null;
  let fieldTexture = null;
  let fieldFlow = 0;

  const group = new GFX.Group();
  group.name = 'glassglobe';
  group.add(spin);

  const api = {
    group, spin, glass, mist, mistMaterial, mood,
    get etch() { return etched; },
    get field() { return field; },
    get fieldTexture() { return fieldTexture; },
    get etchTexture() { return etchTexture; },
    radius: R,
    /** How fast it turns on its own, in radians a second about its axis; 0 for still. */
    spinRate: 0,

    /**
     * Turns the globe so (`lat`, `lon`) in degrees faces the camera on +z,
     * with north up the screen; `roll` leans it over, in degrees.
     */
    orient(lat, lon, roll = 0) {
      const rad = Math.PI / 180;
      spin.rotation.order = 'XYZ';
      spin.rotation.set(lat * rad, -(Math.PI / 2 + lon * rad), 0);
      group.rotation.z = roll * rad;
      return api;
    },

    /**
     * Puts a map of colour inside the glass as mist: `source` is a canvas
     * covering the Earth, equirectangular, -180 on the left and 90 at the top,
     * painted in the colors it is to show. The mist is thick in a shell just
     * under the glass, so from outside it reads as the map, and it drifts. Drawn
     * on again, `refreshField()` sends it. null takes it out.
     */
    setField(source, { glow = 1, shell = 0.72 } = {}) {
      if (!source) {
        if (field) field.visible = false;
        return api;
      }
      if (!field) {
        fieldTexture = new GFX.CanvasTexture(source);
        fieldTexture.wrapS = GFX.RepeatWrapping;
        fieldTexture.anisotropy = 4;
        const material = createHazeMaterial(GFX, fieldTexture);
        material.uniforms.uRadius.value = R * HAZE_RADIUS;
        field = new GFX.Mesh(new GFX.SphereGeometry(R * HAZE_RADIUS, 96, 64), material);
        field.name = 'field';
        field.renderOrder = 1;
        field.castShadow = false;
        field.receiveShadow = false;
        spin.add(field);
      } else if (fieldTexture.image !== source) {
        fieldTexture.image = source;
        fieldTexture.needsUpdate = true;
      }
      field.material.uniforms.uGlow.value = glow;
      field.material.uniforms.uShell.value = shell;
      field.visible = true;
      return api;
    },

    refreshField() { if (fieldTexture) fieldTexture.needsUpdate = true; return api; },

    /** The mist's mood: any of `MIST`'s settings. `show` false clears the glass. */
    setMist(settings = {}, show = true) {
      Object.assign(mood, settings);
      mist.visible = show;
      return api;
    },

    /** Moves it on `dt` seconds: the mist's flow and the turn. Call it every frame. */
    update(dt) {
      if (api.spinRate) spin.rotation.y += api.spinRate * dt;
      if (field?.visible) {
        fieldFlow += dt * 0.35;
        const u = field.material.uniforms;
        u.uFlow.value = fieldFlow;
        field.updateWorldMatrix?.(true, false);
        u.uCenter.value.setFromMatrixPosition(field.matrixWorld);
        u.uInverse.value.copy(field.matrixWorld).invert();
      }
      if (!mist.visible) return;
      flow += dt * mood.speed;
      const u = mistMaterial.uniforms;
      u.uFlow.value = flow;
      u.uSwirl.value = mood.swirl;
      u.uChurn.value = mood.churn;
      u.uGlow.value = mood.glow;
      u.uCore.value = mood.core;
      u.uHue.value = mood.hue;
      u.uSpread.value = mood.spread;
      mist.updateWorldMatrix?.(true, false);
      u.uCenter.value.setFromMatrixPosition(mist.matrixWorld);
    },

    dispose() {
      etchTexture?.dispose();
      fieldTexture?.dispose();
    },
  };
  if (animate) {
    const timer = new GFX.Timer();
    glass.onBeforeRender = () => {
      timer.update();
      api.update(Math.min(timer.getDelta(), 0.05));
    };
  }
  return api;
}

/**
 * Where (`lat`, `lon`) is on a globe of `radius` that has not been turned:
 * `[x, y, z]`. East is -z. Turning the globe with `orient` moves it too, so
 * run it through the globe's `spin.localToWorld` for where it is now.
 */
export function surfacePoint(lat, lon, radius = RADIUS) {
  const rad = Math.PI / 180;
  const c = Math.cos(lat * rad);
  return [radius * c * Math.cos(lon * rad), radius * Math.sin(lat * rad), -radius * c * Math.sin(lon * rad)];
}
