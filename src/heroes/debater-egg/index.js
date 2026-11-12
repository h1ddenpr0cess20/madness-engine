import { ENERGY_GAIN, MOODS } from './moods.js';
import { approach, spring } from '../motion.js';
import { createEggBlot } from './blot.js';
import { createShell, dressInChocolate, dressInVariety, dressInWood, EGG_VARIETIES } from './shell.js';
import { createShellSkin } from './skin.js';
import { createEggMist } from './mist.js';
import { METALS } from '../../props/metalglobe.js';
import { CHOCOLATES } from '../../textures/chocolate.js';
import { WOOD_FINISHES, WOOD_SPECIES } from '../../textures/wood.js';

export { CHOCOLATES, EGG_VARIETIES, METALS, WOOD_FINISHES, WOOD_SPECIES, createEggBlot };

/** The looks an egg comes in. */
export const EGG_APPEARANCES = Object.freeze(['original', 'metal', 'glass', 'wood', 'chocolate']);

const RADIUS = 0.78;

/**
 * How far he rolls from his spot before turning back. Shorter than he had the
 * floor to himself for — there is a lectern in front of him now, and somebody
 * else's on the other side.
 */
export const ROLL_REACH = 0.22;

/** How far below its middle the Egg's foot is, and the most it is ever squashed by (a share of its height). */
const FOOT = 1.02;
const SQUASH_LIMIT = 0.16;

/**
 * Marc, as a rig rather than a scene. The stage owns the lighting and decides
 * where he stands — this returns the group to hang off a podium, and the three
 * handles the debate drives him by.
 */
function buildEgg({ GFX, shadow = null, reach = ROLL_REACH, planted = false, squashGain = 1 }, { appearance = 'original', metal = 'steel', mist: withMist = false, species = 'walnut', finish = 'lacquered', chocolate = 'milk', variety = 'speckled' } = {}) {
  /** The speckles are painted only for the speckled egg, and only once: the plain ones are a color. */
  let skin = appearance === 'original' && variety === 'speckled' ? createShellSkin(GFX) : { map: null, bumpMap: null };
  const shell = createShell(GFX, skin, { appearance, metal, species, finish, chocolate, variety });
  const mistLayer = appearance === 'glass' ? createEggMist(GFX, { visible: withMist }) : null;

  const marc = new GFX.Group();
  marc.name = 'marc';
  const spinner = new GFX.Group();
  spinner.name = 'spinner';
  const body = new GFX.Group();
  body.name = 'body';

  marc.add(spinner);
  spinner.add(body);
  body.add(shell.mesh);
  if (mistLayer) body.add(mistLayer.mesh);

  let mood = MOODS.idle;
  let state = 'idle';
  const m = { ...MOODS.idle };

  let sustain = 0;
  let impulse = 0;
  let energy = 0;

  const sq = { p: 0, v: 0 };
  const tx = { p: 0, v: 0 };
  const ty = { p: 0, v: 0 };
  const tz = { p: 0, v: 0 };

  let t = 0;
  let spinA = 0;
  let spinV = 0;
  let lie = 0;
  let ang = 0;
  let x = 0;
  let dir = 1;
  let rollPhase = 0;
  let rest = 0;
  let fidgetT = 2.4;

  const timer = new GFX.Timer();

  shell.mesh.onBeforeRender = () => {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    t += dt;

    impulse = Math.max(0, impulse - impulse * Math.min(1, dt * 3.4) - dt * 0.05);
    energy = approach(energy, Math.min(1, sustain + impulse), 6, dt);

    for (const k in m) m[k] = approach(m[k], mood[k], 3.4, dt);

    const jitter = m.jitter * (1 + energy * ENERGY_GAIN.jitter);
    const squash = m.squash * (1 + energy * ENERGY_GAIN.squash);
    const rockAmp = m.rock + energy * ENERGY_GAIN.rock;

    const spinning = state === 'thinking';
    lie = approach(lie, spinning ? 1 : 0, 3.2, dt);
    if (spinning) {
      spinV += (m.spin - spinV) * Math.min(1, dt * 4.1) - spinV * 0.12 * dt;
    } else {
      spinV = approach(spinV, 0, 3.2, dt);
      if (Math.abs(spinV) < 0.05) spinV = 0;
    }
    spinA += spinV * dt;
    const precAmp = 0.018 * Math.min(1, Math.abs(spinV) / 6);
    const precA = spinA * 0.9;

    const rolling = m.roll > 0.02 && !spinning;
    let lift = 0;
    if (rolling) {
      if (rest > 0) {
        rest -= dt;
      } else {
        const speed = 1.15 * m.roll;
        rollPhase += dt * speed;
        ang += dir * dt * speed;
        x += dir * dt * speed * RADIUS;
        lift = Math.abs(Math.sin(rollPhase * 1.5)) * 0.035;
        if (Math.abs(x) > reach) {
          dir *= -1;
          rest = 0.5 + Math.random() * 0.6;
          sq.v += 1.2;
        }
      }
    } else {
      x = approach(x, 0, 1.8, dt);
      ang = approach(ang, 0, 1.8, dt);
      rest = 0;
    }

    if (m.fidget > 0.01) {
      fidgetT -= dt * m.fidget;
      if (fidgetT <= 0) {
        const r = Math.random();
        if (r < 0.45) sq.v += 1.8;
        else if (r < 0.75) ty.v += (Math.random() < 0.5 ? -1 : 1) * 2.2;
        else { tz.v += (Math.random() - 0.5) * 4; tx.v += 1.2; }
        fidgetT = 2.6 + Math.random() * 4;
      }
    }

    spring(sq, 175, 10.5, dt, squash);
    const rock = Math.sin(t * m.rockSpeed * 2.0) * rockAmp;
    spring(tz, 68, 6.2, dt, rolling && rest <= 0 ? dir * 0.1 : rock);
    spring(tx, 68, 6.2, dt, m.lean * 0.2);
    spring(ty, 38, 4.8, dt, 0);

    const tremor = jitter * 0.014;
    const breathe = Math.sin(t * 1.3) * 0.007;
    const orbit = lie * Math.min(1, Math.abs(spinV) / 9) * 0.075;

    marc.position.set(
      x + Math.cos(spinA * 0.9) * orbit + (Math.random() - 0.5) * tremor,
      lift + breathe * 0.5 + Math.abs(rock) * 0.34 - lie * 0.2,
      Math.sin(spinA * 0.9) * orbit + (Math.random() - 0.5) * tremor,
    );
    marc.rotation.set(
      tx.p + Math.sin(precA) * precAmp + (Math.random() - 0.5) * tremor,
      ty.p,
      tz.p + Math.cos(precA) * precAmp + (Math.random() - 0.5) * tremor * 1.3,
    );

    spinner.rotation.y = spinA;
    body.rotation.set(lie * Math.PI * 0.5, 0, -ang + lie * Math.sin(spinA * 0.9) * 0.05);

    /** How far it squashes, and never so far that it is a ball: a hard pulse on a spring can throw `sq.p` well past what speech asks for. */
    const s = Math.max(-SQUASH_LIMIT, Math.min(SQUASH_LIMIT, sq.p * 0.085 * squashGain + breathe));
    body.scale.set(1 + s * 0.5, 1 - s, 1 + s * 0.5);
    /** Squashed about its middle, an egg's foot lifts off whatever it stands on; planted, the foot stays where it was and the top comes down. On its side it has no foot to keep. */
    body.position.y = planted ? -FOOT * s * (1 - lie) : 0;

    /** The blot under him, which is all the shadow he gets on a lit stage. */
    if (shadow) {
      shadow.position.x = marc.position.x;
      shadow.position.z = marc.position.z;
      const spread = 1 - Math.min(0.45, Math.max(0, marc.position.y) * 1.2);
      shadow.scale.setScalar(spread);
      shadow.material.opacity = 0.34 * spread;
    }
  };

  const api = {
    group: marc,
    shell: shell.mesh,
    /** How far he gets from where he was put. The stage keeps that much clear. */
    reach,
    get state() { return state; },

    setState(next) {
      if (!Object.hasOwn(MOODS, next) || next === state) return;
      state = next;
      mood = MOODS[next];
      if (next === 'idle' || next === 'thinking') sustain = 0;
    },

    setLevel(level) {
      sustain = Math.min(1, Math.max(0, level));
    },

    pulse(weight = 0.3) {
      const w = Math.min(1, Math.max(0, weight));
      impulse = Math.min(1, impulse + w);
      sq.v += w * 2.4;
      tz.v += (Math.random() - 0.5) * w * 2.6;
    },
  };

  if (appearance === 'metal') {
    let selectedMetal = metal;
    Object.defineProperty(api, 'metal', { enumerable: true, get: () => selectedMetal });
    api.setMetal = (name) => {
      const finish = METALS[name];
      if (!finish) throw new Error(`no metal called ${name}`);
      shell.material.color.set(finish.color);
      shell.material.roughness = finish.roughness;
      selectedMetal = name;
      return api;
    };
  }

  if (appearance === 'original') {
    let selected = variety;
    Object.defineProperty(api, 'variety', { enumerable: true, get: () => selected });
    /** Lays another egg's shell on it: `speckled` (Marc's cream), `white` or `brown`, the last two plain. */
    api.setVariety = (name) => {
      if (name === 'speckled' && !skin.map) skin = createShellSkin(GFX);
      dressInVariety(shell.material, name, skin);
      selected = name;
      return api;
    };
  }

  if (appearance === 'wood') {
    let selected = { species, finish };
    Object.defineProperty(api, 'species', { enumerable: true, get: () => selected.species });
    Object.defineProperty(api, 'finish', { enumerable: true, get: () => selected.finish });
    /** Turns the egg from another wood or in another finish: either may be left as it is. */
    api.setWood = (name = selected.species, how = selected.finish) => {
      dressInWood(GFX, shell.material, name, how);
      selected = { species: name, finish: how };
      return api;
    };
  }

  if (appearance === 'chocolate') {
    let selected = chocolate;
    Object.defineProperty(api, 'chocolate', { enumerable: true, get: () => selected });
    api.setChocolate = (kind) => {
      dressInChocolate(GFX, shell.material, kind);
      selected = kind;
      return api;
    };
  }

  if (appearance === 'glass') {
    api.glass = shell.mesh;
    api.mist = mistLayer.mesh;
    api.setMist = (show = true) => {
      mistLayer.mesh.visible = Boolean(show);
      return api;
    };
  }

  return api;
}

/**
 * The Egg. `appearance` is any of `EGG_APPEARANCES` (the original speckled shell by default) and the rest of
 * the options are those of the functions below: `metal`, `mist`, `species` and `finish`, `chocolate`, and for the original egg `variety` (`EGG_VARIETIES`: `speckled`, `white`, `brown`). `reach`
 * is how far it rolls from where it stands, in tiles (`ROLL_REACH`); `planted` keeps its foot
 * on what it stands on as it squashes (it lifts off otherwise), and `squashGain` scales how far
 * it squashes (1).
 */
export function createEgg({ appearance, metal, mist, species, finish, chocolate, variety, ...rig } = {}) {
  return buildEgg(rig, { appearance, metal, mist, species, finish, chocolate, variety });
}

export function createMetalEgg({ GFX, shadow = null, reach, planted, squashGain, metal = 'steel' } = {}) {
  return buildEgg({ GFX, shadow, reach, planted, squashGain }, { appearance: 'metal', metal });
}

export function createGlassEgg({ GFX, shadow = null, reach, planted, squashGain, mist = false } = {}) {
  return buildEgg({ GFX, shadow, reach, planted, squashGain }, { appearance: 'glass', mist });
}

/** A turned wooden egg: any `species` of `textures/wood` in any `finish`, the grain running tip to tip. `setWood(species, finish)` changes either. */
export function createWoodEgg({ GFX, shadow = null, reach, planted, squashGain, species = 'walnut', finish = 'lacquered' } = {}) {
  return buildEgg({ GFX, shadow, reach, planted, squashGain }, { appearance: 'wood', species, finish });
}

/** A molded chocolate egg, `milk`, `dark` or `white` (`CHOCOLATES`), with the seam where the mold met. `setChocolate(kind)` changes it. */
export function createChocolateEgg({ GFX, shadow = null, reach, planted, squashGain, chocolate = 'milk' } = {}) {
  return buildEgg({ GFX, shadow, reach, planted, squashGain }, { appearance: 'chocolate', chocolate });
}
