import { createDeformer } from './deform.js';
import { buildEnvironment } from './environment.js';
import { createLobes } from './lobes.js';
import { ENERGY_GAIN, MODES } from './modes.js';
import { createPalette } from './palette.js';
import { createBubbles, createCore, createGlow, createShell } from './parts.js';
import { applyMolten, moltenColor } from './molten.js';
import { METALS } from '../../props/metalglobe.js';

export { METALS };

export function createSlimeOrb({ stage, GFX, metal = null, molten = false }) {
  buildEnvironment({ stage, GFX });

  const paletteAt = createPalette(GFX);
  const deform = createDeformer(GFX);
  const lobes = createLobes(GFX);
  const coreLobes = lobes.slice(0, 3);

  const shell = createShell(GFX);
  const core = createCore(GFX);
  const glow = createGlow(GFX, shell.geometry);
  const bubbles = createBubbles(GFX);

  const moltenAt = molten ? moltenColor(GFX) : null;
  if (molten) applyMolten(GFX, { shell, glow });

  const orb = new GFX.Group();
  orb.name = 'slime_orb';
  orb.add(shell.mesh, glow.mesh);
  if (!molten) orb.add(core.mesh, ...bubbles.meshes);

  let mode = MODES.idle;
  let state = 'idle';
  const m = { ...MODES.idle };

  let sustain = 0;
  let impulse = 0;
  let energy = 0;

  const tmpColor = new GFX.Color();
  const white = new GFX.Color('#ffffff');
  let hue = 0;
  let phase = 0;
  const timer = new GFX.Timer();
  let selectedMetal = null;

  const applyMetal = (name) => {
    const finish = METALS[name];
    if (!finish) throw new Error(`no metal called ${name}`);
    selectedMetal = name;
    for (const material of [shell.material, core.material, bubbles.material]) {
      material.color.set(finish.color);
      material.metalness = 1;
      material.roughness = finish.roughness;
      material.envMapIntensity = 3;
      material.transparent = false;
      material.opacity = 1;
      if ('transmission' in material) material.transmission = 0;
      if ('clearcoat' in material) material.clearcoat = 0;
      if ('iridescence' in material) material.iridescence = 0;
      if ('sheen' in material) material.sheen = 0;
    }
    shell.material.attenuationColor.set(finish.color);
    core.material.emissive.set('#000000');
    core.material.emissiveIntensity = 0;
    glow.mesh.visible = false;
  };

  shell.mesh.onBeforeRender = () => {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);

    impulse = Math.max(0, impulse - impulse * Math.min(1, dt * 3.4) - dt * 0.05);
    energy += (Math.min(1, sustain + impulse) - energy) * Math.min(1, dt * 6);

    for (const k in m) m[k] += (mode[k] - m[k]) * Math.min(1, dt * 3.2);

    const wobble = m.wobble * (1 + energy * ENERGY_GAIN.wobble);
    const speed = m.speed + energy * ENERGY_GAIN.speed;
    const halo = m.halo + energy * ENERGY_GAIN.halo;
    const bub = m.bub + energy * ENERGY_GAIN.bub;

    phase += dt * speed;
    hue += dt * m.hue;

    deform(shell.geometry, shell.base, lobes, {
      wobble,
      phase,
      scale: 1 + Math.sin(phase * 1.5) * m.breathe,
      ampScale: 1,
      freqScale: 2.35,
      phaseScale: 2.2,
    });

    deform(core.geometry, core.base, coreLobes, {
      wobble,
      phase,
      scale: 1 + energy * 0.16,
      ampScale: 1.5,
      freqScale: 2.6,
      phaseScale: -3,
    });

    if (molten) {
      // Heat drifts slowly, and rises with energy as if the gather were being reheated.
      const heat = Math.min(1, 0.45 + Math.sin(hue * 5) * 0.18 + energy * 0.35);
      moltenAt(heat, tmpColor);
      shell.material.attenuationColor.copy(tmpColor);
      shell.material.emissive.copy(tmpColor);
      shell.material.emissiveIntensity = 0.35 + heat * 0.4;
      glow.material.uniforms.uColor.value.copy(tmpColor);
    } else {
      if (selectedMetal) tmpColor.set(METALS[selectedMetal].color);
      else paletteAt(hue, tmpColor);
      shell.material.color.copy(tmpColor);
      shell.material.attenuationColor.copy(tmpColor).lerp(white, 0.35);
      core.material.emissive.copy(tmpColor);
      core.material.emissiveIntensity = selectedMetal ? 0 : m.glow + energy * ENERGY_GAIN.glow;
    }
    if (!molten) glow.material.uniforms.uColor.value.copy(tmpColor);
    glow.material.uniforms.uStrength.value = halo * 6.0 * (0.85 + Math.sin(phase * 2.1) * 0.15);

    core.mesh.position.set(
      Math.sin(phase * 0.7) * 0.06,
      Math.sin(phase * 0.9) * 0.05,
      Math.cos(phase * 0.6) * 0.06,
    );
    core.mesh.rotation.y = phase * 0.3;
    orb.rotation.y += dt * m.spin;

    for (const b of bubbles.meshes) {
      const o = b.userData.orbit;
      const a = o.a + phase * o.sp * bub;
      b.position.set(Math.cos(a) * o.rr, o.y + Math.sin(phase * 0.8 + o.a) * 0.12, Math.sin(a) * o.rr);
    }
  };

  stage.setObject(orb);

  glow.mesh.castShadow = glow.mesh.receiveShadow = false;
  for (const b of bubbles.meshes) b.castShadow = b.receiveShadow = false;

  const api = {
    get state() { return state; },
    setState(next) {
      if (!Object.hasOwn(MODES, next) || next === state) return;
      state = next;
      mode = MODES[next];
      if (next === 'idle' || next === 'thinking') sustain = 0;
    },
    setLevel(level) { sustain = Math.min(1, Math.max(0, level)); },
    pulse(weight = 0.3) { impulse = Math.min(1, impulse + Math.min(1, Math.max(0, weight))); },
  };
  if (metal !== null) {
    applyMetal(metal);
    Object.defineProperty(api, 'metal', { enumerable: true, get: () => selectedMetal });
    api.setMetal = (name) => { applyMetal(name); return api; };
  }
  return api;
}

export function createMetalSlimeOrb({ stage, GFX, metal = 'steel' }) {
  return createSlimeOrb({ stage, GFX, metal });
}

/** Slimey as molten glass: the same orb, lobes and moods, in hot orange glass with a procedural swirl painted on the shell. */
export function createMoltenSlimeOrb({ stage, GFX }) {
  return createSlimeOrb({ stage, GFX, molten: true });
}
