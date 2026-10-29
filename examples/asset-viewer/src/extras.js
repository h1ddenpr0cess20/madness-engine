/**
 * The assets that are made by code rather than listed in a file of their own:
 * trees, the sea and the rivers, weather and the things that fly, a stretch of
 * dungeon, and the smoke, lamps and sails the buildings carry. Each is an item
 * as in catalog.js; the ones that move give `pose({ time })`, and the ones that
 * want a dark room say so with `dark` (the viewer dims the sun for them).
 *
 * A build may also say `frame: { center, radius }` where its bounds would be
 * the whole horizon (the sea), and `noFloor` where it is its own ground.
 */
import * as GFX from '../../../src/gfx/index.js';
import { Mesher } from '../../../src/mesher.js';
import { FLORA } from '../../../src/flora.js';
import { createOcean, SEAS, SKIES } from '../../../src/ocean.js';
import { createRiver, RIVERS, riverOf } from '../../../src/river.js';
import { createEffects, CONFETTI, WEATHER, shardGeometry } from '../../../src/effects.js';
import { createDungeonMeshes, createExit, createTorches, flicker } from '../../../src/scenery/dungeon.js';

/** The seconds since the last call, from a clock that may be reset to 0. */
const ticker = () => {
  let last = null;
  return (time) => {
    const dt = last === null || time < last ? 0 : Math.min(0.1, time - last);
    last = time;
    return dt;
  };
};

/** A Mesher's finished parts, one mesh each, coloured by material name. */
export function meshesOf(parts, colours = {}) {
  const group = new GFX.Group();
  for (const [name, p] of Object.entries(parts)) {
    const g = new GFX.BufferGeometry();
    g.setAttribute('position', new GFX.BufferAttribute(p.pos, 3));
    g.setAttribute('normal', new GFX.BufferAttribute(p.nor, 3));
    g.setAttribute('color', new GFX.BufferAttribute(p.col, 3));
    const m = new GFX.Mesh(g, new GFX.MeshStandardMaterial({ name, vertexColors: true, color: new GFX.Color(colours[name] ?? '#ffffff'), roughness: 0.85, side: GFX.DoubleSide }));
    m.castShadow = m.receiveShadow = true;
    group.add(m);
  }
  return group;
}

const count = (object) => {
  let vertices = 0;
  object.traverse((o) => { vertices += o.geometry?.attributes?.position?.count ?? 0; });
  return vertices;
};

// ———————————————————————————————————————————————— trees

const LEAF = { leafA: '#4f8a3a', leafB: '#5f9a42', needle: '#2f5d3a' };
const TREES = { palm: 'Date palm', fanPalm: 'Fan palm', redwood: 'Redwood', cypress: 'Cypress' };

const treeItems = () => Object.entries(TREES).map(([key, name]) => ({
  id: `flora/${key}`, category: 'Flora', group: 'flora', name, source: 'flora.js', kind: 'object',
  build({ detail = 1 }) {
    const m = new Mesher();
    FLORA[key](m, { hi: detail >= 1, seed: 3 });
    const object = meshesOf(m.finish(), LEAF);
    return { object, info: { Source: 'flora.js', Version: detail >= 1 ? 'near' : 'far', Vertices: count(object) } };
  },
}));

// ———————————————————————————————————————————————— water

const SEA_FRAME = { center: [0, 1, 0], radius: 14 };

function seaItem(id, name, sea, sky, source) {
  return {
    id, category: 'Water', group: source, name, source, kind: 'object',
    build({ stage }) {
      const ocean = createOcean(GFX, { sea, sky, reach: 600, rings: 120, segments: 160 });
      const group = new GFX.Group();
      group.add(ocean.group);
      if (stage) ocean.dress(stage);
      const tick = ticker();
      return {
        object: group, frame: SEA_FRAME, noFloor: true,
        pose: ({ time }) => ocean.update(tick(time)),
        info: { Source: source, Sea: typeof sea === 'string' ? sea : 'river', Sky: sky },
      };
    },
  };
}

const waterItems = () => [
  ...Object.keys(SEAS).map((s) => seaItem(`water/sea/${s}`, `Sea · ${s}`, s, 'noon', 'ocean')),
  ...Object.keys(SKIES).map((s) => seaItem(`water/sky/${s}`, `Sky over the sea · ${s}`, 'breeze', s, 'ocean/sky')),
  ...Object.entries(RIVERS).map(([name, wild]) => ({
    id: `water/river/${name}`, category: 'Water', group: 'river', name: `River · ${name}`, source: 'river.js', kind: 'object',
    build({ stage }) {
      const group = new GFX.Group();
      const { sea } = riverOf(wild);
      const ocean = createOcean(GFX, { sea, sky: 'noon', reach: 600, rings: 120, segments: 160 });
      group.add(ocean.group);
      const river = createRiver(GFX, group, { width: 20, snake: 0.4, current: 0.6 });
      river.place(0);
      if (stage) ocean.dress(stage);
      const tick = ticker();
      return {
        object: group, frame: SEA_FRAME, noFloor: true,
        pose: ({ time }) => ocean.update(tick(time)),
        info: { Source: 'river.js', Wildness: wild, Width: river.width },
      };
    },
  })),
];

// ———————————————————————————————————————————————— weather and things that fly

const effectItem = (id, name, start) => ({
  id: `effects/${id}`, category: 'Effects', group: 'effects', name, source: 'effects.js', kind: 'object',
  build() {
    const holder = new GFX.Group();
    const effects = createEffects(GFX, holder, { ground: { heightAt: () => 0 } });
    const tick = ticker();
    const act = start(effects) ?? (() => {});
    let since = 99;
    return {
      object: holder, frame: { center: [0, 2, 0], radius: 6 },
      pose: ({ time }) => {
        const dt = tick(time);
        since += dt;
        act(dt, since > 2.2 ? (since = 0, true) : false);
        effects.update(dt);
      },
      info: { Source: 'effects.js' },
    };
  },
});

const effectItems = () => [
  ...Object.keys(WEATHER).map((w) => effectItem(w, `Weather · ${w}`, (fx) => {
    fx.setWeather(w);
    return (dt) => fx.weather(dt, 0, 1, 0);
  })),
  effectItem('confetti', 'Confetti burst', (fx) => {
    const bit = () => new GFX.Mesh(new GFX.BoxGeometry(0.07, 0.012, 0.05), new GFX.MeshBasicMaterial({ color: CONFETTI[Math.floor(Math.random() * CONFETTI.length)], side: GFX.DoubleSide }));
    return (dt, now) => { if (now) fx.burst({ at: [0, 0.3, 0], count: 60, mesh: bit, speed: 3, up: 6, life: 1.8 }); };
  }),
  effectItem('shards', 'Shard burst', (fx) => {
    const geometry = shardGeometry(GFX);
    const glass = new GFX.MeshStandardMaterial({ color: '#9ad0ff', roughness: 0.1, metalness: 0.2, flatShading: true });
    return (dt, now) => { if (now) fx.burst({ at: [0, 0.4, 0], count: 30, mesh: () => new GFX.Mesh(geometry, glass), speed: 4, up: 5, life: 1.5 }); };
  }),
  effectItem('ring', 'Shock ring', (fx) => (dt, now) => { if (now) fx.ring(0, 0.05, 0, { colour: '#ffffff', reach: 3, life: 0.8 }); }),
];

// ———————————————————————————————————————————————— a stretch of dungeon

const N = 9;
const DUNGEON = {
  cell(x, z) {
    if (x < 0 || z < 0 || x >= N || z >= N) return null;
    if (x === 0 || z === 0 || x === N - 1 || z === N - 1) return { kind: 'wall', h: [1.2, 1.2, 1.2, 1.2] };
    if (x >= 6 && x <= 7 && z >= 2 && z <= 3) return { kind: 'lava', h: [-0.1, -0.1, -0.1, -0.1] };
    if (x >= 6 && x <= 7 && z >= 6 && z <= 7) return { kind: 'exit', h: [0, 0, 0, 0] };
    return { kind: 'floor', h: [0, 0, 0, 0] };
  },
  cols: N, rows: N,
  torches: [{ x: 0, z: 2 }, { x: 0, z: 6 }, { x: 4, z: 0 }, { x: 8, z: 4 }],
};

/** Flat quads for floors and walls, in the arrays a dungeon's meshes are made from. */
function dungeonParts() {
  const parts = () => ({ position: [], normal: [], color: [], uv: [] });
  const tops = parts(), walls = parts(), lava = parts();
  const quad = (p, pts, n, rgb) => {
    // Wound to face along n, whichever way round the corners were given.
    const [a, b, c, d] = pts;
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const facing = (u[1] * v[2] - u[2] * v[1]) * n[0] + (u[2] * v[0] - u[0] * v[2]) * n[1] + (u[0] * v[1] - u[1] * v[0]) * n[2];
    const order = facing >= 0 ? [a, b, c, a, c, d] : [a, c, b, a, d, c];
    const uvs = new Map([[a, [0, 0]], [b, [1, 0]], [c, [1, 1]], [d, [0, 1]]]);
    for (const q of order) { p.position.push(...q); p.normal.push(...n); p.color.push(...rgb); p.uv.push(...uvs.get(q)); }
  };
  for (let z = 0; z < N; z++) {
    for (let x = 0; x < N; x++) {
      const c = DUNGEON.cell(x, z);
      if (c.kind === 'lava') { quad(lava, [[x, c.h[0], z], [x + 1, c.h[0], z], [x + 1, c.h[0], z + 1], [x, c.h[0], z + 1]], [0, 1, 0], [1, 1, 1]); continue; }
      const y = Math.max(...c.h);
      quad(c.kind === 'wall' ? walls : tops, [[x, y, z], [x + 1, y, z], [x + 1, y, z + 1], [x, y, z + 1]], [0, 1, 0], c.kind === 'exit' ? [0.8, 0.9, 1] : [1, 1, 1]);
      if (c.kind !== 'wall') continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const o = DUNGEON.cell(x + dx, z + dz);
        if (!o || o.kind === 'wall') continue;
        const xe = dx > 0 ? x + 1 : x, ze = dz > 0 ? z + 1 : z;
        const edge = dx ? [[xe, 0, z], [xe, 0, z + 1], [xe, y, z + 1], [xe, y, z]] : [[x, 0, ze], [x + 1, 0, ze], [x + 1, y, ze], [x, y, ze]];
        quad(walls, edge, [dx, 0, dz], [1, 1, 1]);
      }
    }
  }
  const fin = (p) => ({ position: Float32Array.from(p.position), normal: Float32Array.from(p.normal), color: Float32Array.from(p.color), uv: Float32Array.from(p.uv) });
  return { tops: fin(tops), walls: fin(walls), lava: fin(lava) };
}

const dungeonItem = () => ({
  id: 'scenery/dungeon-room', category: 'Dungeon', group: 'dungeon', name: 'Dungeon room: floor, walls, lava, torches, exit', source: 'scenery/dungeon.js', kind: 'object',
  build({ lights = [] } = {}) {
    const meshes = createDungeonMeshes(GFX, dungeonParts());
    const torches = createTorches(GFX, DUNGEON);
    const exit = createExit(GFX, DUNGEON);
    const group = new GFX.Group();
    group.add(meshes.group, torches.group);
    if (exit) group.add(exit.group);
    group.position.set(-N / 2, 0, -N / 2);
    const holder = new GFX.Group();
    holder.add(group);
    const orange = new GFX.Color('#ff9a3a');
    const pose = ({ time }) => {
      meshes.update(time);
      torches.update(time);
      exit?.update(time);
      lights.forEach((l, i) => {
        const f = torches.flames[i];
        if (!f) { l.intensity = 0; return; }
        l.position.set(f[0] - N / 2, f[1], f[2] - N / 2);
        l.color.copy(orange);
        l.distance = 7;
        l.intensity = 7 * flicker(time, i * 1.91);
      });
    };
    pose({ time: 0 });
    return { object: holder, pose, dark: true, noFloor: true, info: { Source: 'scenery/dungeon.js', Torches: DUNGEON.torches.length, Cells: `${N} × ${N}` } };
  },
});

// ———————————————————————————————————————————————— what a building carries

/** Puffs of smoke over each chimney, the lamps (on the stage's real lights) and the parts that turn, for a building's model. */
export function dress(model, group, lights = []) {
  const puffs = [];
  const smoke = new GFX.SphereGeometry(0.06, 10, 8);
  for (const at of model.smoke ?? []) {
    for (let i = 0; i < 6; i++) {
      const material = new GFX.MeshBasicMaterial({ color: '#c9c9c9', transparent: true, opacity: 0, depthWrite: false });
      const mesh = new GFX.Mesh(smoke, material);
      group.add(mesh);
      puffs.push({ mesh, material, at, phase: i / 6 });
    }
  }
  const spinners = (model.anim ?? []).filter((a) => a.kind === 'spin').map((a) => {
    const pivot = new GFX.Group();
    pivot.position.set(...a.pivot);
    const inner = meshesOf(a.parts);
    inner.position.set(-a.pivot[0], -a.pivot[1], -a.pivot[2]);
    pivot.add(inner);
    group.add(pivot);
    return { pivot, rate: a.rate };
  });
  const lamps = (model.lights ?? []).slice(0, lights.length);
  if (!puffs.length && !spinners.length && !lamps.length) return null;
  return ({ time }) => {
    for (const p of puffs) {
      const t = (time * 0.25 + p.phase) % 1;
      p.mesh.position.set(p.at[0] + t * 0.15, p.at[1] + t * 0.9, p.at[2]);
      p.mesh.scale.setScalar(1 + t * 3);
      p.material.opacity = 0.5 * Math.sin(Math.PI * t);
    }
    for (const s of spinners) s.pivot.rotation.z = s.rate * Math.PI * 2 * time;
    lights.forEach((l, i) => {
      const lamp = lamps[i];
      if (!lamp) { l.intensity = 0; return; }
      l.position.set(...lamp.at);
      l.color.set(lamp.color);
      l.distance = lamp.reach * 1.5;
      l.intensity = 6 * (1 + 0.1 * Math.sin(time * 9 + i));
    });
  };
}

export const extraItems = () => [...treeItems(), ...waterItems(), ...effectItems(), dungeonItem()];
