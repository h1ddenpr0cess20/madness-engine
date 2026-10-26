import { BUMPERS } from './travel/index.js';

/**
 * What moves, and what lies about, as it is drawn: rigs and presses that
 * drop on the beat, pyro and steam in the floor, dollies and trams and the
 * rest of the lifts, closed sets' shutters, breakaways, bumpers and the
 * pickups. Each `create…` gives { group, update(...) }; the logic is in
 * actors.js.
 */

const dark = (GFX, hex, o = {}) => new GFX.MeshStandardMaterial({ color: new GFX.Color(hex), roughness: 0.6, ...o });

/** A bumper: a squat chrome post with a glowing ring, which flashes when Metroll bounces off it. */
/**
 * A bumper, by its `look`: 'post' (a chrome post with a lit ring), 'rope' (a
 * brass stanchion of a velvet rope, the rope looped round it), 'podium' (a
 * dancer's lit cube), 'drum' (a kick drum on its side, the head up),
 * 'barrel' (a banded barrel), 'cactus' (a saguaro, foam, painted) or
 * 'hydrant' (a fire hydrant). Each flashes and swells when it throws Metroll.
 */
export function createBumperMesh(GFX, { radius, look = 'post' }) {
  const group = new GFX.Group();
  const parts = [];
  let flashColour = [1, 0.23, 0.54], rest = [1, 0.23, 0.54];
  const ringMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(...rest), toneMapped: false });
  if (BUMPERS[look]) {
    const made = BUMPERS[look](GFX, { radius, ringMat });
    group.add(...made.objects);
    parts.push(...made.parts);
    rest = made.rest;
    flashColour = made.flash;
  } else if (look === 'rope') {
    const brass = dark(GFX, '#d8a848', { metalness: 0.9, roughness: 0.25 });
    const base = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.55, radius * 0.7, 0.08, 18), brass);
    base.position.y = 0.04;
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.06, 0.8, 10), brass);
    post.position.y = 0.42;
    const knob = new GFX.Mesh(new GFX.SphereGeometry(0.1, 12, 8), brass);
    knob.position.y = 0.86;
    const velvet = new GFX.MeshStandardMaterial({ color: new GFX.Color('#b0102a'), roughness: 0.75 });
    const rope = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.72, 0.045, 8, 24), velvet);
    rope.rotation.x = Math.PI / 2;
    rope.position.y = 0.66;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.7, 0.025, 6, 24), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.09;
    parts.push(base, post, knob, rope);
    group.add(...parts, ring);
    rest = [1, 0.75, 0.3];
    flashColour = [1, 1, 0.8];
  } else if (look === 'podium') {
    const shell = dark(GFX, '#1a1424', { metalness: 0.3, roughness: 0.35 });
    const cube = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.6, 0.5, radius * 1.6), shell);
    cube.position.y = 0.25;
    const top = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.5, 0.04, radius * 1.5), ringMat);
    top.position.y = 0.51;
    const band = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.64, 0.05, radius * 1.64), ringMat);
    band.position.y = 0.06;
    parts.push(cube);
    group.add(cube, top, band);
    rest = [0.2, 0.85, 1];
    flashColour = [1, 0.3, 0.8];
  } else if (look === 'barrel') {
    const wood = dark(GFX, '#8a5a32', { roughness: 0.8 });
    const band = dark(GFX, '#3a3a40', { metalness: 0.7, roughness: 0.4 });
    const body = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.85, radius * 0.85, 0.8, 18), wood);
    body.position.y = 0.4;
    const bulge = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.95, 18, 10), wood);
    bulge.scale.y = 0.5;
    bulge.position.y = 0.4;
    for (const y of [0.1, 0.7]) {
      const hoop = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.87, 0.025, 6, 22), band);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = y;
      group.add(hoop);
    }
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.94, 0.03, 6, 22), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.4;
    parts.push(body, bulge);
    group.add(body, bulge, ring);
    rest = [0.9, 0.55, 0.2];
    flashColour = [1, 0.95, 0.6];
  } else if (look === 'cactus') {
    const green = dark(GFX, '#3a7a3a', { roughness: 0.7 });
    const trunk = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.45, radius * 0.5, 1.4, 12), green);
    trunk.position.y = 0.7;
    const crown = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.45, 12, 8), green);
    crown.position.y = 1.4;
    parts.push(trunk, crown);
    group.add(trunk, crown);
    for (const [s, y, h] of [[-1, 0.6, 0.5], [1, 0.85, 0.4]]) {
      const out = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.25, radius * 0.25, radius * 0.6, 10), green);
      out.rotation.z = Math.PI / 2;
      out.position.set(s * radius * 0.55, y, 0);
      const up = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.25, radius * 0.25, h, 10), green);
      up.position.set(s * radius * 0.8, y + h / 2, 0);
      const cap = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.25, 10, 6), green);
      cap.position.set(s * radius * 0.8, y + h, 0);
      parts.push(out, up, cap);
      group.add(out, up, cap);
    }
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.6, 0.025, 6, 20), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.04;
    group.add(ring);
    rest = [0.5, 0.85, 0.3];
    flashColour = [1, 1, 0.6];
  } else if (look === 'hydrant') {
    const paint = dark(GFX, '#c8302a', { roughness: 0.45, metalness: 0.3 });
    const body = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.4, radius * 0.48, 0.6, 14), paint);
    body.position.y = 0.3;
    const dome = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.42, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), paint);
    dome.position.y = 0.6;
    const nut = new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.05, 0.08, 5), paint);
    nut.position.y = 0.82;
    const arms = new GFX.Mesh(new GFX.CylinderGeometry(0.07, 0.07, radius * 1.2, 10), paint);
    arms.rotation.z = Math.PI / 2;
    arms.position.y = 0.42;
    const base = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.6, radius * 0.6, 0.06, 14), paint);
    base.position.y = 0.03;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.62, 0.025, 6, 20), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.07;
    parts.push(body, dome, arms);
    group.add(body, dome, nut, arms, base, ring);
    rest = [1, 0.85, 0.7];
    flashColour = [1, 1, 1];
  } else if (look === 'drum') {
    const shellMat = dark(GFX, '#b81c2a', { metalness: 0.2, roughness: 0.3 });
    const chrome = dark(GFX, '#e8eaf0', { metalness: 0.9, roughness: 0.2 });
    const head = new GFX.MeshStandardMaterial({ color: new GFX.Color('#f2ece0'), roughness: 0.7 });
    const body = new GFX.Mesh(new GFX.CylinderGeometry(radius, radius, 0.42, 24), shellMat);
    body.position.y = 0.21;
    const skin = new GFX.Mesh(new GFX.CircleGeometry(radius * 0.96, 24), head);
    skin.rotation.x = -Math.PI / 2;
    skin.position.y = 0.425;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.98, 0.03, 6, 28), chrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.42;
    const glow = new GFX.Mesh(new GFX.TorusGeometry(radius * 1.0, 0.025, 6, 28), ringMat);
    glow.rotation.x = Math.PI / 2;
    glow.position.y = 0.03;
    parts.push(body);
    group.add(body, skin, ring, glow);
    rest = [1, 0.6, 0.2];
    flashColour = [1, 1, 0.6];
  } else {
    const chrome = dark(GFX, '#eef0f6', { metalness: 0.55, roughness: 0.22, emissive: new GFX.Color('#4a3a58'), emissiveIntensity: 0.7 });
    const post = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.8, radius, 0.5, 20), chrome);
    post.position.y = 0.25;
    const cap = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), chrome);
    cap.position.y = 0.5;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.92, 0.04, 8, 28), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.22;
    parts.push(post, cap);
    group.add(post, cap, ring);
    flashColour = [1, 0.93, 0.94];
  }
  for (const m of parts) m.castShadow = true;
  return {
    group,
    update(since) {
      const flash = since >= 0 && since < 0.25 ? 1 - since / 0.25 : 0;
      ringMat.color.setRGB(...rest.map((v, i) => v + (flashColour[i] - v) * flash));
      group.scale.setScalar(1 + flash * 0.12);
    },
  };
}
