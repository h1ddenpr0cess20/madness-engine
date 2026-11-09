/**
 * A test world for the human (`madness-engine/people/human`): Gravemoor's
 * town at night (from the rpg-test-world game), you in it with the banana
 * broadsword, and a crowd of the same man in every colour of skin, eyes,
 * shirt, jeans and shoes, each with a weapon from the engine's armoury and
 * the swing that goes with it. They wander, spot you, run at you shouting
 * and swing; you swing back. Three hits put one down; he gets up later.
 *
 *     npm install && npm run dev
 *
 * `?mobs=12` sets how many there are; `?detail=0.6` builds the crowd coarser
 * (faster), for slow machines.
 */
import * as GFX from 'madness-engine/gfx';
import { createStage } from 'madness-engine/stage';
import { createView } from 'madness-engine/views/town';
import { createInput } from 'madness-engine/input';
import { toGround } from 'madness-engine/view';
import horror from 'madness-engine/moods/horror';
import { createHuman } from 'madness-engine/people/human';
import * as WEAPONS from 'madness-engine/weapons';

import { buildTown, START, WALLS } from './world/town.js';
import { clearLine, createColliders, resolve } from './collide.js';

const params = new URLSearchParams(location.search);

// ———————————————————————————————————————————————— sizes and speeds

/** The human is built at real size (1.76 m); the town's people stand about 0.82 tiles. */
const SCALE = 0.52;
const RADIUS = 0.24;
const WALK = 2.0, RUN = 3.6, MOB_WALK = 1.1, MOB_RUN = 3.0;
/** How far a swing reaches (from the swinger's middle), and how wide either side of straight ahead. */
const REACH = 1.05, ARC = 1.1;
const SWING = 0.9; // seconds a swing takes
const STRIKE = 0.36; // when in it the blade lands (the swings' strike key)
const HIT_TIME = 0.6, DOWN_TIME = 9;
const NOTICE = 8, GIVE_UP = 14;
const PLAYER_LIFE = 12, MOB_LIFE = 3;
/** How many of the crowd are posed every frame (the nearest); the rest are posed one frame in TURNS. */
const NEAREST = 5, TURNS = 3;

// ———————————————————————————————————————————————— the looks

const SKINS = ['#f1d3bf', '#e2b596', '#c99872', '#a8754f', '#8a5a3c', '#5e3b26', '#3f2618'];
const IRISES = ['#4a6a9a', '#3c7a52', '#6a4a2a', '#2e2216', '#7a7a80', '#5a8aa0', '#8a6a3a'];
const SHIRTS = ['#8f9399', '#b8342c', '#2c5aa8', '#e8e4da', '#2a2b30', '#3f7a3a', '#d8a02a', '#7a3a8a', '#c86a9a', '#2a8a8a', '#e86a2a'];
const DENIMS = ['#ffffff', '#c8d4e8', '#9aa4b8', '#5a5a60', '#2a2a30', '#c8b48a', '#7a8a5a', '#b88a6a'];
const SHOES = ['#2c2c30', '#e8e4dc', '#b8342c', '#2c5aa8', '#6a4a2a', '#3f7a3a', '#d8a02a'];
const SOLES = ['#efece6', '#2a2a2a', '#d8c8a8', '#efece6'];
const BRIEFS = ['#2a2b30', '#2c5aa8', '#b8342c', '#e8e4da', '#3f7a3a'];

/** Every weapon there is but the player's own, and the swing each is used with. */
const ARMOURY = Object.keys(WEAPONS)
  .filter((k) => /^create/.test(k) && !/Handle|Pommel|BananaBroadsword/.test(k))
  .map((factory) => ({
    factory,
    swing: /Dagger/.test(factory) ? 'thrust' : /Greatsword/.test(factory) ? 'chop' : /Morningstar/.test(factory) ? 'smite' : 'slash',
  }));

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (list) => list[Math.floor(rand() * list.length)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const angleTo = (from, to) => {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

// ———————————————————————————————————————————————— the stage and the town

const host = document.getElementById('game');
const stage = await createStage(host, { view: createView(), label: 'human world', fixtures: 6, pixelRatio: 2 });
stage.setMood(horror);
const town = buildTown();
stage.scene.add(town.group);
const colliders = createColliders(town.colliders);

// A little more light than the mood's own, so the colours can be told apart at night.
stage.hemi.color.set('#b8d0c8');
stage.hemi.groundColor.set('#2a2028');
stage.hemi.intensity = 1.9;
stage.key.color.set('#d8e8ff');
stage.key.intensity = 1.7;

// ———————————————————————————————————————————————— people

/** One person in the world: the human, where he is, and what he is doing. */
function person({ look, weapon, swing, detail }) {
  const man = createHuman(GFX, { detail, look });
  man.group.scale.setScalar(SCALE);
  man.hold(weapon);
  man.setStyle({ attack: swing });
  const group = new GFX.Group();
  group.add(man.group);
  man.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  stage.scene.add(group);
  return {
    man, group, swing,
    x: 0, z: 0, yaw: 0, want: 0, speed: 0,
    state: 'idle', since: 0, clock: rand() * 10, struck: false,
    life: 1, cool: 0,
    place(x, z, yaw = 0) { this.x = x; this.z = z; this.yaw = this.want = yaw; },
    to(state) { if (this.state !== state) { this.state = state; this.since = 0; this.struck = false; } },
  };
}

/** Poses `p` for this frame: the clip its state calls for, at its own time. */
function pose(p, dt, { shout = false } = {}) {
  p.yaw += angleTo(p.yaw, p.want) * Math.min(1, dt * 10);
  p.group.position.set(p.x, 0, p.z);
  p.group.rotation.y = p.yaw;
  p.clock += dt;
  const { state, since } = p;
  if (state === 'attack') return p.man.pose({ clip: 'attack', t: Math.min(1, since / SWING), time: p.clock, speaking: shout, yell: shout });
  if (state === 'hit') return p.man.pose({ clip: 'hit', t: Math.min(1, since / HIT_TIME), time: p.clock });
  if (state === 'down') return p.man.pose({ clip: 'ko', t: Math.min(1, since / 1.2), time: p.clock });
  if (state === 'yell') return p.man.pose({ clip: 'yell', t: since, time: p.clock });
  if (p.speed > 0.1) {
    // The stride kept to the ground: the walk's stride is about 2 m/s a unit of `speed` at full size, the run's 3.3.
    const run = p.speed > 2.4;
    const pace = p.speed / ((run ? 3.3 : 2.0) * SCALE);
    return p.man.pose({ clip: run ? 'run' : 'walk', time: p.clock, speed: pace, speaking: shout, yell: shout });
  }
  return p.man.pose({ clip: 'idle', time: p.clock });
}

/** A step of `speed` toward ground direction (ax, az), sliding along what is in the way. */
function walk(p, ax, az, speed, dt) {
  const l = Math.hypot(ax, az) || 1;
  const q = { x: p.x + (ax / l) * speed * dt, z: p.z + (az / l) * speed * dt };
  resolve(q, RADIUS, colliders, WALLS);
  const moved = Math.hypot(q.x - p.x, q.z - p.z) / Math.max(dt, 1e-6);
  p.x = q.x; p.z = q.z;
  p.want = Math.atan2(ax, az);
  p.speed = Math.min(speed, moved + 0.3);
}

/** Somewhere clear to stand, away from (ax, az). */
function clearSpot(ax = -99, az = -99, away = 10) {
  for (let i = 0; i < 200; i++) {
    const x = WALLS.x0 + 2 + rand() * (WALLS.x1 - WALLS.x0 - 4), z = WALLS.z0 + 2 + rand() * (WALLS.z1 - WALLS.z0 - 4);
    if (Math.hypot(x - ax, z - az) < away) continue;
    const q = { x, z };
    if (!resolve(q, RADIUS + 0.3, colliders, WALLS)) return [x, z];
  }
  return [START[0], START[1] - 6];
}

// ———————————————————————————————————————————————— you

const player = person({ look: { skin: '#b98a70', iris: '#5a4632' }, weapon: WEAPONS.createBananaBroadsword(GFX), swing: 'slash', detail: 1 });
player.place(START[0], START[1] - 1.5, Math.PI);
player.life = PLAYER_LIFE;

// ———————————————————————————————————————————————— them

const MOBS = clamp(Number(params.get('mobs') ?? 14), 0, 60);
const mobDetail = Number(params.get('detail') ?? 1);
const mobs = [];
for (let i = 0; i < MOBS; i++) {
  const arm = ARMOURY[i % ARMOURY.length];
  const look = { skin: pick(SKINS), iris: pick(IRISES), shirt: pick(SHIRTS), denim: pick(DENIMS), shoe: pick(SHOES), sole: pick(SOLES), briefs: pick(BRIEFS) };
  const m = person({ look, weapon: WEAPONS[arm.factory](GFX), swing: arm.swing, detail: mobDetail });
  const [x, z] = clearSpot(player.x, player.z, 12);
  m.place(x, z, rand() * Math.PI * 2);
  m.life = MOB_LIFE;
  m.home = [x, z];
  m.goal = null;
  m.cool = 1 + rand() * 2;
  m.chasing = false;
  m.weapon = arm.factory.replace(/^create/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
  mobs.push(m);
}

// ———————————————————————————————————————————————— the screen's furniture

const hud = {
  bar: document.querySelector('#bar div'),
  downs: document.getElementById('downs'),
  falls: document.getElementById('falls'),
  toast: document.getElementById('toast'),
};
let downs = 0, falls = 0, toastTimer = 0;
function toast(text, time = 1.6) {
  hud.toast.textContent = text;
  hud.toast.classList.add('show');
  toastTimer = time;
}
const life = () => { hud.bar.style.width = `${(100 * Math.max(0, player.life)) / PLAYER_LIFE}%`; };
life();

// ———————————————————————————————————————————————— controls

const input = createInput(host, {
  presses: { Space: 'attack', KeyJ: 'attack', KeyF: 'attack', KeyY: 'yell', KeyC: 'home', KeyM: 'mute', Enter: 'attack' },
  padPresses: (b) => ({ attack: b(0) || b(2), yell: b(3), home: b(11) }),
  anchor() {
    const v = new GFX.Vector3(player.x, 0.5, player.z).project(stage.camera);
    const r = host.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  },
});
let shift = false;
addEventListener('keydown', (e) => { if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') shift = true; });
addEventListener('keyup', (e) => { if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') shift = false; });
addEventListener('blur', () => { shift = false; });
document.getElementById('attack').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); input.press('attack'); });

// ———————————————————————————————————————————————— fighting

/** Whether `a`'s swing, landing now, catches `b`: near enough, and in front of `a`. */
function catches(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
  if (d > REACH + RADIUS) return false;
  return Math.abs(angleTo(a.yaw, Math.atan2(dx, dz))) < ARC;
}

/** `who` takes a blow from `from`: knocked back a little, and down when there is no life left. */
function struck(who, from) {
  if (who.state === 'down') return false;
  who.life -= 1;
  const dx = who.x - from.x, dz = who.z - from.z, d = Math.hypot(dx, dz) || 1;
  const q = { x: who.x + (dx / d) * 0.25, z: who.z + (dz / d) * 0.25 };
  resolve(q, RADIUS, colliders, WALLS);
  who.x = q.x; who.z = q.z;
  who.want = Math.atan2(-dx, -dz);
  who.to(who.life <= 0 ? 'down' : 'hit');
  return true;
}

// ———————————————————————————————————————————————— the camera, and the lights

stage.view.aim.zoom = stage.view.zoom = 0.62;
stage.view.aim.pitch = stage.view.pitch = 0.95;
stage.target.set(player.x, 0.5, player.z);
stage.view.step(1, true);

const slots = stage.fixtureLights.map((light) => ({ light, src: null }));
function lights(time) {
  // Your lantern, and the nearest of the town's lamps and lit windows.
  const lantern = slots[0].light;
  // Hung well over him and a little ahead, so it lights the street round him without burning him white.
  lantern.position.set(player.x + Math.sin(player.yaw) * 0.6, 2.2, player.z + Math.cos(player.yaw) * 0.6);
  lantern.color.set('#ffd2a0');
  lantern.distance = 10;
  lantern.decay = 1.3;
  lantern.intensity = 7 * (0.92 + 0.08 * Math.sin(time * 9) * Math.sin(time * 5.3));
  const near = [...town.lamps, ...town.windows]
    .map((s) => [(s.x - player.x) ** 2 + (s.z - player.z) ** 2, s])
    .filter(([d2, s]) => d2 < (s.reach * 1.3) ** 2)
    .sort((a, b) => a[0] - b[0])
    .slice(0, slots.length - 1);
  for (let i = 1; i < slots.length; i++) {
    const s = near[i - 1]?.[1], L = slots[i].light;
    if (!s) { L.intensity = 0; continue; }
    const ph = s.x * 3.1 + s.z * 1.7;
    L.position.set(s.x, s.y, s.z);
    L.color.set(s.color);
    L.distance = s.reach * 1.5;
    L.decay = 1.4;
    L.intensity = 14 * (1 - 0.15 * (0.5 + 0.5 * Math.sin(time * 11 + ph) * Math.sin(time * 7.3 + ph * 2)));
  }
  if (town.mats.glow) town.mats.glow.color.setRGB(1.5, 1.35, 1.0);
}

// ———————————————————————————————————————————————— the loop

let time = 0;
function update(dt) {
  time += dt;
  for (const e of input.take()) {
    if (e === 'home') stage.view.reset();
    if (player.state === 'down') continue;
    if (e === 'attack' && player.state !== 'attack' && player.state !== 'hit') player.to('attack');
    if (e === 'yell' && player.state === 'idle') player.to('yell');
  }
  const look = input.view(dt);
  stage.view.turn(look.turn, look.tilt);
  stage.view.zoomBy(look.zoom);
  stage.view.step(dt);

  // You.
  player.since += dt;
  player.speed = 0;
  if (player.state === 'down') {
    if (player.since > 3.5) {
      player.life = PLAYER_LIFE; life();
      player.place(START[0], START[1] - 1.5, Math.PI);
      player.to('idle');
      toast('Up again');
    }
  } else if (player.state === 'hit' && player.since > HIT_TIME) player.to('idle');
  else if (player.state === 'yell' && player.since > 2) player.to('idle');
  else if (player.state === 'attack') {
    if (!player.struck && player.since >= STRIKE * SWING) {
      player.struck = true;
      for (const m of mobs) {
        if (catches(player, m) && struck(m, player) && m.state === 'down') { downs++; hud.downs.textContent = downs; toast(`Down: ${m.weapon}`); }
      }
    }
    if (player.since > SWING) player.to('idle');
  }
  if (player.state === 'idle' || player.state === 'walk' || player.state === 'yell') {
    const stick = input.stick(), mag = Math.hypot(stick.x, stick.y);
    if (mag > 0.05) {
      if (player.state === 'yell') player.to('idle');
      const [ax, az] = toGround(stick, stage.view.yaw);
      const run = shift || (input.pointing && mag > 0.97);
      walk(player, ax, az, (run ? RUN : WALK) * clamp(mag * 1.15, 0.35, 1), dt);
    }
  } else if (player.state === 'attack') {
    // A step can be taken into a swing, slowly.
    const stick = input.stick();
    if (Math.hypot(stick.x, stick.y) > 0.05) { const [ax, az] = toGround(stick, stage.view.yaw); walk(player, ax, az, 0.6, dt); }
  }
  pose(player, dt, { shout: player.state === 'yell' });

  // Them.
  for (const m of mobs) {
    m.since += dt;
    m.cool -= dt;
    m.speed = 0;
    const dx = player.x - m.x, dz = player.z - m.z, d = Math.hypot(dx, dz);
    if (m.state === 'down') {
      if (m.since > DOWN_TIME) {
        const [x, z] = clearSpot(player.x, player.z, 14);
        m.place(x, z, rand() * 6.28);
        m.life = MOB_LIFE;
        m.chasing = false;
        m.to('idle');
      }
    } else if (m.state === 'hit') {
      if (m.since > HIT_TIME) m.to('idle');
    } else if (m.state === 'attack') {
      m.want = Math.atan2(dx, dz);
      if (!m.struck && m.since >= STRIKE * SWING) {
        m.struck = true;
        if (player.state !== 'down' && catches(m, player) && struck(player, m)) {
          life();
          stage.shake = 0.25;
          if (player.state === 'down') { falls++; hud.falls.textContent = falls; toast('You are down'); }
        }
      }
      if (m.since > SWING) { m.to('idle'); m.cool = 0.9 + rand() * 1.4; }
    } else {
      // Notice the player (seen, near enough, and up), and go for him; lose interest further off.
      const sees = player.state !== 'down' && d < NOTICE && clearLine(m, player, colliders);
      if (sees) m.chasing = true;
      if (m.chasing && (d > GIVE_UP || player.state === 'down')) m.chasing = false;
      if (m.chasing) {
        if (d > REACH * 0.85) walk(m, dx, dz, d > 3 ? MOB_RUN : MOB_WALK * 1.4, dt);
        else {
          m.want = Math.atan2(dx, dz);
          if (m.cool <= 0 && Math.abs(angleTo(m.yaw, m.want)) < 0.5) m.to('attack');
        }
      } else {
        // Wander about home.
        if (!m.goal || Math.hypot(m.goal[0] - m.x, m.goal[1] - m.z) < 0.4 || m.since > 12) {
          m.goal = rand() < 0.4 ? null : [m.home[0] + (rand() - 0.5) * 8, m.home[1] + (rand() - 0.5) * 8];
          m.since = 0;
        }
        if (m.goal) walk(m, m.goal[0] - m.x, m.goal[1] - m.z, MOB_WALK, dt);
      }
    }
    // Shoulder to shoulder, not inside one another.
    for (const o of [player, ...mobs]) {
      if (o === m || o.state === 'down' || m.state === 'down') continue;
      const ex = m.x - o.x, ez = m.z - o.z, e = Math.hypot(ex, ez), need = RADIUS * 2;
      if (e > 1e-4 && e < need) { const k = (need - e) / e * 0.5; m.x += ex * k; m.z += ez * k; }
    }
  }

  // Draw only who is near enough to be seen. Posing a person is the costly part (the skin is moved on
  // the CPU), so the nearest are posed every frame and the rest take turns, a few a frame, each
  // posed with the time it has missed.
  frame++;
  const seen = [];
  for (const m of mobs) {
    m.owed = (m.owed ?? 0) + dt;
    m.group.position.set(m.x, 0, m.z);
    const d = Math.hypot(m.x - stage.target.x, m.z - stage.target.z);
    m.group.visible = d < 26;
    if (m.group.visible) seen.push([d, m]);
  }
  seen.sort((a, b) => a[0] - b[0]);
  seen.forEach(([, m], i) => {
    if (i >= NEAREST && (frame + i) % TURNS !== 0) return;
    pose(m, m.owed, { shout: m.chasing && m.state !== 'down' && m.state !== 'hit' });
    m.owed = 0;
  });

  if (toastTimer > 0 && (toastTimer -= dt) <= 0) hud.toast.classList.remove('show');
  if (stage.shake > 0.002) stage.shake *= Math.exp(-dt * 6); else stage.shake = 0;
  lights(time);

  // The camera follows.
  const k = 1 - Math.exp(-6 * dt);
  stage.target.x += (player.x - stage.target.x) * k;
  stage.target.y += (0.5 - stage.target.y) * k;
  stage.target.z += (player.z - stage.target.z) * k;
}
let frame = 0;

document.getElementById('loading').classList.add('hidden');
globalThis.__world = { player, mobs, stage, update };
stage.run((dt) => update(Math.min(dt, 0.05)));
toast('Gravemoor', 2.2);
