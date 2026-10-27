import { COUNT, createSea, SEAS } from './ocean/waves.js';
import { SKY_GLSL, SKY_WGSL, WATER_GLSL, WATER_WGSL } from './ocean/shaders.js';
import { mixLight, mixSky, paintRoom, SKIES, skyLight } from './ocean/sky.js';

export { COUNT, createSea, SEAS, SKIES, mixSky, paintRoom, skyLight };

/**
 * The ripples: a dozen short waves, from about three tiles long to under
 * half a tile, running with the wind and fanned out either side of it. The
 * shaders only tip the water's normal with them.
 */
const RIPPLES = Array.from({ length: 12 }, (_, i) => {
  const k = (Math.PI * 2) / (3.2 * Math.pow(0.42 / 3.2, i / 11));
  return { k, w: Math.sqrt(9.8 * k), off: (((i * 0.618034) % 1) * 2 - 1) * 0.9, phi: (i * 2.399963) % (Math.PI * 2) };
});

/**
 * An endless sea, all the way to the horizon, and the sky over it, for the
 * stage: waves that run, steepen and break with the wind (ocean/waves.js),
 * shaded after Neverending Tunnel III's barrel of water (ocean/shaders.js),
 * under a sky with a sun, clouds and stars (ocean/sky.js). Nothing is
 * painted: it is all worked out as it is drawn, so it never repeats and
 * never ends.
 *
 *     const ocean = createOcean(GFX, { sea: 'breeze', sky: 'noon' });
 *     stage.scene.add(ocean.group);
 *     ocean.dress(stage);                     // the sun on everything else, too
 *     // every frame:
 *     ocean.update(dt);
 *     const { height, normal } = ocean.sea.sample(x, z);   // for what floats
 *     // later:
 *     ocean.setSea('storm', 8);               // over eight seconds
 *     ocean.setSky('dusk', 8);
 *
 * The grid of water goes with the camera, so wherever the camera goes there
 * is sea, set for each camera just before it is drawn. It reaches `reach`
 * tiles round it, and the sky's dome a little further: the camera's far
 * plane is pushed out past both.
 *
 * @param GFX     the renderer's scene API (`madness-engine/gfx`)
 * @param options
 *   - `sea`: a sea state (`SEAS`, by name or as one of your own)
 *   - `sky`: a sky (`SKIES`, by name or your own)
 *   - `reach`: how far the water goes, in tiles (1400)
 *   - `rings`, `segments`: the grid, out from the camera and round it (200, 256)
 *   - `exposure`: how bright the water and sky are drawn (1)
 *   - `roomEvery`: how often, at most, what shiny things reflect is repainted as the sky changes, in seconds (0.5)
 * @returns { group, water, dome, sea, light, sky, exposure, setSea, setSky, dress, update }
 */
export function createOcean(GFX, { sea = 'breeze', sky = 'noon', reach = 1400, rings = 200, segments = 256, exposure = 1, roomEvery = 0.5 } = {}) {
  const seaOf = (s) => (typeof s === 'string' ? SEAS[s] : s);
  const skyOf = (s) => (typeof s === 'string' ? SKIES[s] : s);
  const running = createSea(seaOf(sea));

  const uniforms = {};
  for (const name of ['uA', 'uQ', 'uK', 'uDX', 'uDZ', 'uPhase', 'uR1', 'uR2', 'uR3']) uniforms[name] = { value: new GFX.Matrix4() };
  for (const name of ['uNoiseC', 'uCloudShift', 'uWind']) uniforms[name] = { value: new GFX.Vector2() };
  for (const name of ['uSun', 'uSunColor', 'uZenith', 'uHorizon', 'uCloud', 'uSkyShape', 'uDeep', 'uBody', 'uGlow', 'uFoam', 'uSea', 'uLook', 'uFrame']) {
    uniforms[name] = { value: new GFX.Vector3() };
  }

  const water = new GFX.Mesh(waterGrid(GFX, reach, rings, segments), new GFX.ShaderMaterial({
    name: 'ocean', uniforms, glsl: WATER_GLSL, wgsl: WATER_WGSL, side: GFX.DoubleSide,
  }));
  water.name = 'ocean';
  water.frustumCulled = false;

  // The dome shares the water's uniforms: the sky is the one the water reflects.
  const dome = new GFX.Mesh(new GFX.SphereGeometry(reach * 1.2, 48, 24), new GFX.ShaderMaterial({
    name: 'ocean-sky', uniforms, glsl: SKY_GLSL, wgsl: SKY_WGSL, side: GFX.BackSide, depthWrite: false,
  }));
  dome.name = 'ocean-sky';
  dome.frustumCulled = false;
  // After the stage's own backdrop, over it, and before everything else.
  dome.renderOrder = -0.5;

  const group = new GFX.Group();
  group.add(dome, water);

  // The sky now, and the sky it is turning into.
  let skyFrom = skyLight(skyOf(sky)), skyTo = skyFrom, skyBlend = 1, skyOver = 1;
  const light = mixLight(skyFrom, skyTo, 1);
  let target = skyOf(sky), lightWas = null;
  let dressed = null;
  // What shiny things reflect is repainted once the sky settles, and not more often than every `roomEvery` seconds.
  let roomDirty = false, roomWait = 0;

  const phase = new Float64Array(COUNT);
  const TAU = Math.PI * 2;
  const wrap = (v) => ((v % 256) + 256) % 256;
  const setMatrix = (m, values) => {
    for (let i = 0; i < COUNT; i++) m.elements[i] = values[i];
  };
  const set3 = (name, [x, y, z]) => uniforms[name].value.set(x, y, z);

  const ocean = {
    group, water, dome,
    /** The running sea: `sample(x, z)` for what floats, `displace(x0, z0)` for what drifts with the water. */
    sea: running,
    /** The sky as it is now, as the shaders take it (ocean/sky.js `skyLight`). */
    light,
    /** How bright the water and sky are drawn. */
    exposure,
    /** The sky it is, or is turning into. */
    get sky() { return target; },

    /** Turns the sea into another (`SEAS`, by name or your own) over `seconds`. */
    setSea(next, seconds = 6) {
      running.to(seaOf(next), seconds);
    },

    /** Turns the sky into another (`SKIES`, by name or your own) over `seconds`; the stage's light follows if it is dressed. */
    setSky(next, seconds = 6) {
      if (dressed) {
        const { hemi, key } = dressed;
        lightWas = { sky: hemi.color.clone(), ground: hemi.groundColor.clone(), wash: hemi.intensity, key: key.color.clone(), strength: key.intensity };
      }
      target = skyOf(next);
      skyFrom = { ...light };
      skyTo = skyLight(target);
      skyBlend = 0;
      skyOver = Math.max(1e-3, seconds);
      roomDirty = true;
    },

    /**
     * Lights the stage by this sky: the wash and the key from the sky's
     * `light`, the key coming from the sun, and what shiny things reflect
     * painted from it (`paintRoom`). The stage keeps following as the sky
     * changes.
     */
    dress(stage) {
      dressed = stage;
      stage.setSky(null);
      stage.setRoom(paintRoom(target));
      if (stage.fill) stage.fill.visible = false;
      stage.camera.far = Math.max(stage.camera.far, reach * 1.3);
      lightStage();
    },

    /** Moves the sea and the sky on by `dt` seconds. */
    update(dt) {
      running.step(dt);
      if (skyBlend < 1) {
        skyBlend = Math.min(1, skyBlend + dt / skyOver);
        mixLight(skyFrom, skyTo, skyBlend * skyBlend * (3 - 2 * skyBlend), light);
        if (dressed) lightStage();
      }
      roomWait -= dt;
      if (dressed && roomDirty && skyBlend >= 1 && roomWait <= 0) {
        dressed.setRoom(paintRoom(target));
        roomDirty = false;
        roomWait = roomEvery;
      }
    },
  };

  /**
   * Sets the water and the sky for the camera they are about to be drawn
   * for: the grid goes under it, and every wave's phase there, and the
   * noise's offsets, are worked out here in double precision.
   */
  const frame = (renderer, scene, camera) => {
    const far = reach * 1.3;
    if (camera.far < far) {
      camera.far = far;
      camera.updateProjectionMatrix();
    }
    const cx = camera.position.x, cz = camera.position.z;
    water.position.set(cx, 0, cz);
    water.updateMatrixWorld();
    dome.position.copy(camera.position);
    dome.updateMatrixWorld();
    running.anchorAt(cx, cz);
    running.phases([cx, cz], phase);
    const w = running.waves;
    setMatrix(uniforms.uA.value, w.A);
    setMatrix(uniforms.uQ.value, w.Q);
    setMatrix(uniforms.uK.value, w.k);
    setMatrix(uniforms.uDX.value, w.dx);
    setMatrix(uniforms.uDZ.value, w.dz);
    setMatrix(uniforms.uPhase.value, phase);

    const t = running.time;
    // The ripples, turned with the wind, and their phases under the camera.
    const ripples = [uniforms.uR1.value.elements, uniforms.uR2.value.elements, uniforms.uR3.value.elements];
    RIPPLES.forEach(({ k, w: omega, off, phi }, i) => {
      const a = running.wind + off;
      const dx = Math.cos(a), dz = Math.sin(a);
      const th = k * (dx * cx + dz * cz) - omega * t + phi;
      const m = ripples[i >> 2], o = (i & 3) * 4;
      m[o] = k;
      m[o + 1] = dx;
      m[o + 2] = dz;
      m[o + 3] = ((th % TAU) + TAU) % TAU;
    });

    // The foam's streaks' offset, along the wind and across it, running with the wind.
    const wx = Math.cos(running.wind), wz = Math.sin(running.wind);
    const along = cx * wx + cz * wz, across = -cx * wz + cz * wx;
    uniforms.uWind.value.set(wx, wz);
    uniforms.uNoiseC.value.set(wrap((along - t * 1.2) * 0.16), wrap(across * 0.32));
    uniforms.uCloudShift.value.set(wrap(-t * 0.006 * wx), wrap(-t * 0.006 * wz));

    set3('uSun', light.sun);
    set3('uSunColor', light.sunColor);
    set3('uZenith', light.zenith);
    set3('uHorizon', light.horizon);
    set3('uCloud', light.cloud);
    set3('uSkyShape', [light.cover, light.stars, 0]);
    set3('uDeep', light.deep);
    set3('uBody', light.body);
    set3('uGlow', light.glow);
    set3('uFoam', light.foam);
    const crest = w.A.reduce((sum, a) => sum + a, 0) * 0.6;
    const pixels = renderer?.domElement?.height || 900;
    set3('uSea', [running.choppy, running.foam, (camera.fov * Math.PI) / 180 / pixels]);
    set3('uLook', [ocean.exposure, Math.max(light.haze, 3 / reach), crest]);
    set3('uFrame', [reach, t % 3600, 0]);
  };
  // The dome is drawn first, so it sets up for both.
  dome.onBeforeRender = frame;

  function lightStage() {
    const stage = dressed;
    const l = target.light;
    const f = skyBlend * skyBlend * (3 - 2 * skyBlend);
    // From the light the stage had when the sky began to change.
    const was = lightWas ?? {
      sky: new GFX.Color(l.hemisphere.sky), ground: new GFX.Color(l.hemisphere.ground), wash: l.hemisphere.intensity,
      key: new GFX.Color(l.key.color), strength: l.key.intensity,
    };
    const toward = (out, from, hex) => {
      const c = new GFX.Color(hex);
      out.setRGB(from.r + (c.r - from.r) * f, from.g + (c.g - from.g) * f, from.b + (c.b - from.b) * f);
    };
    toward(stage.hemi.color, was.sky, l.hemisphere.sky);
    toward(stage.hemi.groundColor, was.ground, l.hemisphere.ground);
    stage.hemi.intensity = was.wash + (l.hemisphere.intensity - was.wash) * f;
    toward(stage.key.color, was.key, l.key.color);
    stage.key.intensity = was.strength + (l.key.intensity - was.strength) * f;
    // The key comes from the sun; under the horizon, from just over it.
    stage.keyFrom.set(light.sun[0], Math.max(0.08, light.sun[1]), light.sun[2]).normalize();
  }

  return ocean;
}

/**
 * The water's grid: `rings` rings round the camera, out to `reach`, each
 * `segments` points round, spaced so the cells are about square and grow
 * with the distance, finest underfoot. Each point's y is how far apart the
 * points are there, for the shaders to leave out waves too short for it.
 */
export function waterGrid(GFX, reach, rings, segments) {
  // r(u) = reach (b^u - 1) / (b - 1): a tenth of a tile or so apart in the middle.
  const b = 260;
  const radius = (j) => (reach * (Math.pow(b, j / rings) - 1)) / (b - 1);
  const count = (rings + 1) * segments;
  const position = new Float32Array(count * 3);
  for (let j = 0; j <= rings; j++) {
    const r = radius(j);
    const across = Math.max(radius(Math.min(rings, j + 1)) - r, r - radius(Math.max(0, j - 1)));
    const spacing = Math.max(across, (Math.PI * 2 * r) / segments);
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const o = (j * segments + i) * 3;
      position[o] = Math.cos(a) * r;
      position[o + 1] = spacing;
      position[o + 2] = Math.sin(a) * r;
    }
  }
  const index = new (count > 65535 ? Uint32Array : Uint16Array)(rings * segments * 6);
  let n = 0;
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * segments + i, b2 = j * segments + ((i + 1) % segments);
      const c = a + segments, d = b2 + segments;
      index.set([a, c, b2, b2, c, d], n);
      n += 6;
    }
  }
  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(position, 3));
  geometry.setIndex(new GFX.BufferAttribute(index, 1));
  return geometry;
}
