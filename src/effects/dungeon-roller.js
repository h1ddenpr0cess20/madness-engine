/**
 * Bits that fly: smoke where a monster was beaten, a burst of coins, sparks
 * off spikes, embers when the die goes into the lava, dust when it lands
 * hard, a glitter for a potion or a key. Each bit is ballistic, bounces off
 * the floor or settles on it, and shrinks away.
 */

const GRAVITY = 18;

export function createEffects(GFX, scene) {
  const group = new GFX.Group();
  group.name = 'effects';
  scene.add(group);
  let dungeon = null;
  const bits = [];

  const puff = new GFX.SphereGeometry(0.16, 12, 8);
  const smoke = new GFX.MeshStandardMaterial({ name: 'smoke', color: new GFX.Color('#b9b2c4'), roughness: 1, transparent: true, opacity: 0.55, depthWrite: false });
  const coin = new GFX.CylinderGeometry(0.06, 0.06, 0.02, 12);
  const gold = new GFX.MeshStandardMaterial({ name: 'coin', color: new GFX.Color('#ffcf4a'), metalness: 1, roughness: 0.25, emissive: new GFX.Color('#6a4a00'), emissiveIntensity: 0.6 });
  const mote = new GFX.SphereGeometry(0.035, 6, 4);
  const glows = new Map();
  const glow = (colour) => {
    if (!glows.has(colour)) glows.set(colour, new GFX.MeshBasicMaterial({ name: 'glow', color: new GFX.Color(colour), toneMapped: false }));
    return glows.get(colour);
  };
  const grit = new GFX.BoxGeometry(0.05, 0.05, 0.05);
  const dirt = new GFX.MeshStandardMaterial({ name: 'grit', color: new GFX.Color('#8a8276'), roughness: 1 });

  function spawn(mesh, { x, y, z, vx, vy, vz, life, spin = 6, drag = 0, floaty = 1, bounce = 0.35, grow = 0 }) {
    mesh.position.set(x, y, z);
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    group.add(mesh);
    bits.push({
      mesh, vx, vy, vz, life, age: 0, drag, floaty, bounce, grow,
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
    setDungeon(d) {
      dungeon = d;
      for (const b of bits) group.remove(b.mesh);
      bits.length = 0;
    },

    /** A monster beaten: a cloud of smoke where it stood. */
    poof(x, y, z, size = 1) {
      for (let i = 0; i < 16 * size; i++) {
        const m = new GFX.Mesh(puff, smoke);
        m.scale.setScalar((0.6 + Math.random() * 0.8) * size);
        const [ox, , oz] = outward(1.2 * size, 0);
        spawn(m, { x: x + ox * 0.2, y: y + 0.2 + Math.random() * 0.4 * size, z: z + oz * 0.2, vx: ox, vy: 0.6 + Math.random(), vz: oz, life: 0.9 + Math.random() * 0.5, floaty: -0.05, drag: 2.5, spin: 1, bounce: 0, grow: 1.4 });
      }
    },

    coins(x, y, z, n = 14) {
      for (let i = 0; i < n; i++) {
        const m = new GFX.Mesh(coin, gold);
        const [ox, oy, oz] = outward(2.2, 6);
        spawn(m, { x, y: y + 0.2, z, vx: ox, vy: oy, vz: oz, life: 1.1 + Math.random() * 0.5, spin: 16, bounce: 0.4 });
      }
    },

    sparkle(x, y, z, colour = '#ff5a7a') {
      for (let i = 0; i < 18; i++) {
        const m = new GFX.Mesh(mote, glow(colour));
        const [ox, oy, oz] = outward(1.2, 3);
        spawn(m, { x, y: y + 0.3, z, vx: ox, vy: oy, vz: oz, life: 0.7 + Math.random() * 0.5, floaty: -0.1, drag: 1.5, bounce: 0 });
      }
    },

    sparks(x, y, z) {
      for (let i = 0; i < 20; i++) {
        const m = new GFX.Mesh(mote, glow('#ffd27a'));
        m.scale.setScalar(0.6);
        const [ox, oy, oz] = outward(4, 4);
        spawn(m, { x, y, z, vx: ox, vy: oy, vz: oz, life: 0.35 + Math.random() * 0.3, bounce: 0.5 });
      }
    },

    embers(x, y, z) {
      for (let i = 0; i < 30; i++) {
        const m = new GFX.Mesh(mote, glow(i % 3 ? '#ff7a1a' : '#ffd23a'));
        const [ox, , oz] = outward(0.8, 0);
        spawn(m, { x: x + ox * 0.3, y, z: z + oz * 0.3, vx: ox, vy: 1.5 + Math.random() * 2.5, vz: oz, life: 0.8 + Math.random() * 0.9, floaty: -0.12, spin: 0, bounce: 0 });
      }
    },

    /** One spark lifting off the lava and drifting up, slowly, as it dies. */
    ember(x, y, z) {
      const m = new GFX.Mesh(mote, glow(Math.random() < 0.6 ? '#ff7a1a' : '#ffd23a'));
      m.scale.setScalar(0.5 + Math.random() * 0.6);
      spawn(m, { x, y, z, vx: (Math.random() - 0.5) * 0.3, vy: 0.5 + Math.random() * 0.7, vz: (Math.random() - 0.5) * 0.3, life: 1.2 + Math.random() * 1.4, floaty: -0.05, spin: 0, bounce: 0 });
    },

    dust(x, y, z) {
      for (let i = 0; i < 14; i++) {
        const m = new GFX.Mesh(grit, dirt);
        const [ox, oy, oz] = outward(2.5, 2.5);
        spawn(m, { x, y: y + 0.05, z, vx: ox, vy: oy, vz: oz, life: 0.5 + Math.random() * 0.4, spin: 12, bounce: 0.3 });
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
        const ground = dungeon?.heightAt(m.position.x, m.position.z);
        if (ground != null && b.bounce > 0 && m.position.y < ground + 0.03 && m.position.y > ground - 0.4 && b.vy < 0) {
          m.position.y = ground + 0.03;
          b.vy *= -b.bounce;
          b.vx *= 0.55; b.vz *= 0.55;
          b.spin = b.spin.map((s) => s * 0.5);
        }
        m.rotation.x += b.spin[0] * dt;
        m.rotation.y += b.spin[1] * dt;
        m.rotation.z += b.spin[2] * dt;
        const fade = Math.min(1, (b.life - b.age) / 0.4);
        m.scale.setScalar(b.scale * fade * (1 + b.grow * (b.age / b.life)));
      }
    },
  };
}
