/**
 * Madness Quick: collect every gold piece, avoid the rat, and keep the marble on the board.
 *
 *     npm install && npm run dev
 */
import * as GFX from 'madness-engine/gfx';
import { createAudio } from 'madness-engine/audio';
import { CONFETTI, createEffects } from 'madness-engine/effects';
import { createInput } from 'madness-engine/input';
import { createStage } from 'madness-engine/stage';
import { createBall, placeBall, rollSpin, stepBall, turn, World } from 'madness-engine/physics';
import { toGround } from 'madness-engine/view';
import { createModel, createStatic } from 'madness-engine/models/model';
// The library: what the games made, to use as it is.
import { createMarble, RADIUS } from 'madness-engine/heroes/marble';
import rat from 'madness-engine/characters/rat';
import gold from 'madness-engine/props/gold';
import { createBand, THEMES } from 'madness-engine/music/band';
import { FLOORS, tiled } from 'madness-engine/textures/painters';
import { paintRoom } from 'madness-engine/textures/rooms/studio';
import { paintSky } from 'madness-engine/textures/skies/haze';

/** The board, in tiles: a floor, and a platform a tile up with a ramp to it. */
const SIZE = 12;
const PLATFORM = { x0: 7, x1: 11, z0: 7, z1: 11, y: 1 };
const RAMP = { z0: 3, z1: 7 };
const STEP = 1 / 120;

const board = {
  /** How high the board is at (x, z); null off its edge. */
  heightAt(x, z) {
    if (x < 0 || z < 0 || x > SIZE || z > SIZE) return null;
    if (x >= PLATFORM.x0 && x <= PLATFORM.x1) {
      if (z >= PLATFORM.z0 && z <= PLATFORM.z1) return PLATFORM.y;
      if (z >= RAMP.z0 && z < RAMP.z1) return ((z - RAMP.z0) / (RAMP.z1 - RAMP.z0)) * PLATFORM.y;
    }
    return 0;
  },
};

/** The board's triangles, for the physics and for the picture alike. */
function boardTriangles() {
  const tris = [];
  const quad = (a, b, c, d) => tris.push([a, b, c], [a, c, d]);
  const { x0, x1, z0, z1, y } = PLATFORM;
  for (let x = 0; x < SIZE; x++) {
    for (let z = 0; z < SIZE; z++) {
      // A tile of the ramp or the platform has its corners at their height; the rest is floor.
      const raised = x >= x0 && x < x1 && z >= RAMP.z0 && z < z1;
      const at = (px, pz) => [px, raised ? board.heightAt(px, pz) : 0, pz];
      quad(at(x, z), at(x, z + 1), at(x + 1, z + 1), at(x + 1, z));
    }
  }
  // The sides: the back of the platform, and down each side the ramp and the platform.
  quad([x0, 0, z1], [x0, y, z1], [x1, y, z1], [x1, 0, z1]);
  for (const x of [x0, x1]) {
    tris.push([[x, 0, RAMP.z0], [x, 0, z0], [x, y, z0]]);
    quad([x, 0, z0], [x, 0, z1], [x, y, z1], [x, y, z0]);
  }
  return tris;
}

/** Where a corner of a triangle is on the planks: across the ground for the floor, along and up for a side. */
function uvOf(tri) {
  const upright = tri.every((p) => p[0] === tri[0][0]) || tri.every((p) => p[2] === tri[0][2]);
  return tri.map(([x, y, z]) => (upright ? [x + z, y] : [x, z]));
}

const host = document.getElementById('game');
const stage = await createStage(host, { sky: paintSky(), room: paintRoom(), label: 'madness-quick' });
const { scene } = stage;

// The board: in the physics, and drawn in planks.
const world = new World({ cols: SIZE, rows: SIZE });
const position = [], uv = [];
for (const tri of boardTriangles()) {
  world.addTriangle(...tri.flat());
  position.push(...tri.flat());
  uv.push(...uvOf(tri).flat());
}
world.finish();
const geometry = new GFX.BufferGeometry();
geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(position), 3));
geometry.setAttribute('uv', new GFX.BufferAttribute(new Float32Array(uv), 2));
geometry.computeVertexNormals();
const planks = FLOORS.planks(GFX);
const floor = new GFX.Mesh(geometry, new GFX.MeshStandardMaterial({
  name: 'board', color: new GFX.Color('#b88a5a'), roughness: 0.7,
  map: tiled(GFX, planks.map, 1, 1), bumpMap: tiled(GFX, planks.bump, 1, 1), bumpScale: 0.6, side: GFX.DoubleSide,
}));
floor.receiveShadow = true;
scene.add(floor);

// The player: the marble, on a ball the physics rolls.
const ball = createBall({ r: RADIUS });
const start = [2, RADIUS + 0.2, 2];
placeBall(ball, ...start);
const { marble, spin } = createMarble(GFX);
scene.add(marble);
const q = [0, 0, 0, 1], spinRate = [0, 0, 0];

// A rat, going round and round.
const runner = createModel(GFX, rat, { detail: 0.5 });
scene.add(runner.group);

// The gold.
const coins = [[4, 0, 9], [9, 1, 9], [10, 1, 8], [2, 0, 10], [9, 0.5, 5], [6, 0, 2]].map(([x, y, z]) => {
  const coin = createStatic(GFX, gold, { detail: 0.6 });
  coin.position.set(x + 0.5, y + 0.3, z + 0.5);
  scene.add(coin);
  return coin;
});
let score = 0;
document.getElementById('total').textContent = coins.length;

const effects = createEffects(GFX, scene, { ground: board });
const paper = new GFX.PlaneGeometry(0.16, 0.1);
const papers = CONFETTI.map((c) => new GFX.MeshBasicMaterial({ color: new GFX.Color(c), side: GFX.DoubleSide }));

// Sound: the rolling, knocks, a jingle for the gold, and the band.
let roll = null;
const audio = createAudio({
  storageKey: 'madness-quick.muted',
  glue: true,
  onWake(a) {
    roll = a.loop({ filters: [{ type: 'bandpass', freq: 300 }, { type: 'lowpass', freq: 1400 }] });
    const theme = Object.values(THEMES)[0];
    createBand(a.ctx, a.music, a.noise).start(theme, theme.tempo ?? 128);
  },
});
for (const event of ['pointerdown', 'keydown']) addEventListener(event, () => audio.wake());

const input = createInput(host, {
  anchor() {
    const v = new GFX.Vector3(ball.x, ball.y, ball.z).project(stage.camera);
    const r = host.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  },
});

let accumulator = 0, time = 0;
stage.target.set(...start);
stage.run((dt) => {
  time += dt;
  for (const p of input.take()) {
    if (p === 'mute') audio.toggleMute();
    if (p === 'home') stage.view.reset();
  }
  const look = input.view(dt);
  stage.view.turn(look.turn, look.tilt);
  stage.view.zoomBy(look.zoom);
  stage.view.step(dt);

  // The physics, in fixed steps.
  const [ax, az] = toGround(input.stick(), stage.view.yaw);
  accumulator = Math.min(accumulator + dt, STEP * 12);
  while (accumulator >= STEP) {
    accumulator -= STEP;
    const hit = stepBall(ball, world, ax, az, STEP);
    if (hit.impact > 2) {
      const k = Math.min(1, hit.impact / 12);
      audio.burst({ length: 0.07, freq: 700 + 900 * k, gain: 0.4 * k });
      audio.tone({ freq: 140 + 60 * k, to: 60, length: 0.12, gain: 0.4 * k });
    }
  }
  if (ball.y < -6) placeBall(ball, ...start);

  // The marble where the ball is, turned as it rolls.
  marble.position.set(ball.x, ball.y, ball.z);
  if (ball.grounded) rollSpin(ball, spinRate);
  turn(q, spinRate, dt);
  spin.quaternion.set(...q);
  roll?.set({ gain: ball.grounded ? Math.min(0.3, Math.hypot(ball.vx, ball.vz) * 0.03) : 0, filter: 160 + Math.hypot(ball.vx, ball.vz) * 85 });

  // The rat's round.
  const a = time * 0.5;
  runner.group.position.set(4 + Math.cos(a) * 2.5, 0, 5 + Math.sin(a) * 2.5);
  runner.group.rotation.y = -a;
  runner.pose({ clip: 'walk', t: time, time });

  for (const coin of coins) {
    if (!coin.visible) continue;
    coin.rotation.y = time * 2;
    if (Math.hypot(coin.position.x - ball.x, coin.position.y - ball.y, coin.position.z - ball.z) < 0.7) {
      coin.visible = false;
      document.getElementById('score').textContent = ++score;
      audio.jingle([72, 76, 79, 84], { type: 'square', gain: 0.12, length: 0.16 });
      effects.burst({ at: [coin.position.x, coin.position.y, coin.position.z], count: 60, mesh: (i) => new GFX.Mesh(paper, papers[i % papers.length]), speed: 3, up: 7, life: 2.4, spin: 14, drag: 1.6, floaty: 0.35, bounce: 0 });
    }
  }
  effects.update(dt);

  // The camera after the ball.
  const k = 1 - Math.exp(-5 * dt);
  stage.target.x += (ball.x - stage.target.x) * k;
  stage.target.y += (Math.max(ball.y, -1) - stage.target.y) * k;
  stage.target.z += (ball.z - stage.target.z) * k;
});

/** For the console, and for a test to drive. */
globalThis.madnessQuick = { ball, stage, input, get score() { return score; } };
