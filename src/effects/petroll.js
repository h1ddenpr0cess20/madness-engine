import { shardGeometry } from './core.js';

/**
 * Bits that fly: shards of plastic when the bubble pops, sparks off a car,
 * black bubbles when the tar takes it, glitter for a golden seed or a job
 * done, a puff of chaff off an eaten seed. Each bit is ballistic, bounces off the ground
 * once or twice, and shrinks away.
 */

const GRAVITY = 18;

export function createEffects(GFX, scene) {
  const group = new GFX.Group();
  group.name = 'effects';
  scene.add(group);
  let course = null;
  const bits = [];

  const plastic = (tint) => new GFX.MeshPhysicalMaterial({
    name: 'shard', color: new GFX.Color(tint), roughness: 0.15, metalness: 0, clearcoat: 0.6, transparent: true, opacity: 0.55, side: GFX.DoubleSide,
  });
  const plastics = new Map();
  const shard = shardGeometry(GFX);
  const bubble = new GFX.SphereGeometry(0.07, 12, 8);
  const tarMaterial = new GFX.MeshPhysicalMaterial({ name: 'tar-bubble', color: new GFX.Color('#0c0c10'), roughness: 0.05, clearcoat: 1 });
  const sparkMaterial = new GFX.MeshBasicMaterial({ name: 'spark', color: new GFX.Color('#ffd27a') });
  const spark = new GFX.BoxGeometry(0.03, 0.03, 0.12);
  const chaff = new GFX.PlaneGeometry(0.08, 0.05);
  const chaffMaterial = new GFX.MeshBasicMaterial({ name: 'chaff', color: new GFX.Color('#efe6d2'), side: GFX.DoubleSide });
  const paper = new GFX.PlaneGeometry(0.16, 0.1);
  const confettiColours = ['#f2c230', '#fff2b0', '#e8902c', '#ffffff', '#f5d76e'].map((c) => new GFX.MeshBasicMaterial({ color: new GFX.Color(c), side: GFX.DoubleSide }));

  function spawn(mesh, { x, y, z, vx, vy, vz, life, spin = 6, drag = 0, floaty = 1, bounce = 0.35 }) {
    mesh.position.set(x, y, z);
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    group.add(mesh);
    bits.push({
      mesh, vx, vy, vz, life, age: 0, drag, floaty, bounce,
      spin: [(Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin],
      scale: mesh.scale.x,
    });
  }

  const outward = (speed, up) => {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.4 + Math.random() * 0.6);
    return [Math.cos(a) * s, up * (0.5 + Math.random()), Math.sin(a) * s];
  };

  return {
    setCourse(c) {
      course = c;
      for (const b of bits) group.remove(b.mesh);
      bits.length = 0;
    },

    /** The bubble popped: plastic everywhere. */
    pop(x, y, z, vx = 0, vz = 0, tint = '#5aa8f0') {
      if (!plastics.has(tint)) plastics.set(tint, plastic(tint));
      for (let i = 0; i < 30; i++) {
        const m = new GFX.Mesh(shard, plastics.get(tint));
        m.scale.setScalar(0.8 + Math.random() * 1.4);
        const [ox, oy, oz] = outward(4, 4.5);
        spawn(m, { x: x + ox * 0.05, y: y + oy * 0.03, z: z + oz * 0.05, vx: ox + vx * 0.3, vy: oy, vz: oz + vz * 0.3, life: 1.6 + Math.random() * 0.8, spin: 16 });
      }
    },

    /** Sparks off a car, or a drum. */
    sparks(x, y, z, n = 10) {
      for (let i = 0; i < n; i++) {
        const [ox, oy, oz] = outward(5, 3);
        spawn(new GFX.Mesh(spark, sparkMaterial), { x, y, z, vx: ox, vy: oy, vz: oz, life: 0.35 + Math.random() * 0.3, spin: 20, bounce: 0.3 });
      }
    },

    /** Gone under the tar: black bubbles coming up. */
    gloop(x, y, z) {
      for (let i = 0; i < 18; i++) {
        const m = new GFX.Mesh(bubble, tarMaterial);
        m.scale.setScalar(0.8 + Math.random() * 1.8);
        const [ox, , oz] = outward(0.4, 0);
        spawn(m, { x: x + ox * 0.4, y: y - 0.25, z: z + oz * 0.4, vx: ox * 0.3, vy: 0.4 + Math.random() * 0.8, vz: oz * 0.3, life: 0.8 + Math.random() * 1.2, floaty: -0.05, spin: 0 });
      }
    },

    /** A seed eaten: a puff of husk. */
    chaff(x, y, z) {
      for (let i = 0; i < 5; i++) {
        const [ox, oy, oz] = outward(1.2, 2);
        spawn(new GFX.Mesh(chaff, chaffMaterial), { x, y, z, vx: ox, vy: oy, vz: oz, life: 0.5 + Math.random() * 0.3, spin: 14, drag: 2, floaty: 0.5, bounce: 0 });
      }
    },

    /** Glitter, for a golden seed or a job done. */
    confetti(x, y, z) {
      for (let i = 0; i < 80; i++) {
        const m = new GFX.Mesh(paper, confettiColours[i % confettiColours.length]);
        const [ox, oy, oz] = outward(3, 7);
        spawn(m, { x, y, z, vx: ox, vy: oy, vz: oz, life: 2.6 + Math.random(), spin: 14, drag: 1.6, floaty: 0.35, bounce: 0 });
      }
    },

    update(dt) {
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.age += dt;
        if (b.age >= b.life) {
          group.remove(b.mesh);
          bits.splice(i, 1);
          continue;
        }
        const m = b.mesh;
        b.vy -= GRAVITY * b.floaty * dt;
        const k = Math.max(0, 1 - b.drag * dt);
        b.vx *= k; b.vy *= b.drag ? Math.max(0, 1 - b.drag * 0.5 * dt) : 1; b.vz *= k;
        m.position.x += b.vx * dt;
        m.position.y += b.vy * dt;
        m.position.z += b.vz * dt;
        const ground = course?.heightAt(m.position.x, m.position.z);
        if (ground != null && b.bounce > 0 && m.position.y < ground + 0.03 && m.position.y > ground - 0.4 && b.vy < 0) {
          m.position.y = ground + 0.03;
          b.vy *= -b.bounce;
          b.vx *= 0.55; b.vz *= 0.55;
          b.spin = b.spin.map((s) => s * 0.5);
        } else if (ground != null && b.bounce === 0 && m.position.y < ground + 0.02 && m.position.y > ground - 0.4) {
          m.position.y = ground + 0.02;
          b.vx = b.vy = b.vz = 0;
          b.spin = [0, 0, 0];
        }
        m.rotation.x += b.spin[0] * dt;
        m.rotation.y += b.spin[1] * dt;
        m.rotation.z += b.spin[2] * dt;
        const fade = Math.min(1, (b.life - b.age) / 0.4);
        m.scale.setScalar(b.scale * fade);
      }
    },
  };
}
