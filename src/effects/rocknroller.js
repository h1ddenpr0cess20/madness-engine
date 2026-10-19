/**
 * Bits that fly: puffs and stars where somebody was smashed, guitar picks,
 * stone chips off Rock, sparks off pyro, glitter from a mirror ball, confetti,
 * dust when he lands hard, a glitter for a pass or a lighter, and a ring that
 * goes out from a big hit. Each bit is ballistic, bounces off the floor or
 * settles on it, and shrinks away.
 */

const GRAVITY = 18;

const PICK_COLOURS = ['#ff3a8a', '#2ad0ff', '#ffd23a', '#7a4be8', '#3ae88a', '#ff7a1a', '#f5f0e6'];

export function createEffects(GFX, scene) {
  const group = new GFX.Group();
  group.name = 'effects';
  scene.add(group);
  let venue = null;
  const bits = [];

  const puff = new GFX.SphereGeometry(0.16, 12, 8);
  const smoke = new GFX.MeshStandardMaterial({ name: 'smoke', color: new GFX.Color('#c9c4d4'), roughness: 1, transparent: true, opacity: 0.55, depthWrite: false });
  // A guitar pick: a rounded triangle, thin.
  const pickGeometry = new GFX.CylinderGeometry(0.075, 0.075, 0.014, 3);
  const picks = PICK_COLOURS.map((c) => new GFX.MeshStandardMaterial({ name: 'pick', color: new GFX.Color(c), roughness: 0.3, metalness: 0.1, emissive: new GFX.Color(c), emissiveIntensity: 0.35 }));
  const mote = new GFX.SphereGeometry(0.035, 6, 4);
  const glows = new Map();
  const glow = (colour) => {
    if (!glows.has(colour)) glows.set(colour, new GFX.MeshBasicMaterial({ name: 'glow', color: new GFX.Color(colour), toneMapped: false }));
    return glows.get(colour);
  };
  const grit = new GFX.BoxGeometry(0.05, 0.05, 0.05);
  const dirt = new GFX.MeshStandardMaterial({ name: 'grit', color: new GFX.Color('#8a8276'), roughness: 1 });
  const chip = new GFX.BoxGeometry(0.07, 0.05, 0.06);
  const granite = new GFX.MeshStandardMaterial({ name: 'chip', color: new GFX.Color('#7a746b'), roughness: 0.95, flatShading: true });
  const paper = new GFX.PlaneGeometry(0.09, 0.05);
  const paperMats = PICK_COLOURS.map((c) => new GFX.MeshBasicMaterial({ name: 'confetti', color: new GFX.Color(c), side: GFX.DoubleSide, toneMapped: false }));
  const star = new GFX.IcosahedronGeometry(0.06, 0);

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

  /** An expanding ring on the floor: the thump of a hit going out. */
  const rings = [];
  const ringMaterial = (colour) => new GFX.MeshBasicMaterial({ name: 'ring', color: new GFX.Color(colour), transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false, blending: GFX.AdditiveBlending });

  return {
    setVenue(v) {
      venue = v;
      for (const b of bits) group.remove(b.mesh);
      bits.length = 0;
      for (const r of rings) group.remove(r.mesh);
      rings.length = 0;
    },

    /** Somebody smashed: a cloud, a spray of stars and paper, and a ring going out. */
    smash(x, y, z, { size = 1, dir = [0, 0], crit = false } = {}) {
      for (let i = 0; i < 12 * size; i++) {
        const m = new GFX.Mesh(puff, smoke);
        m.scale.setScalar((0.6 + Math.random() * 0.8) * size);
        const [ox, , oz] = outward(1.4 * size, 0);
        spawn(m, { x: x + ox * 0.2, y: y + 0.2 + Math.random() * 0.4 * size, z: z + oz * 0.2, vx: ox + dir[0] * 2, vy: 0.6 + Math.random(), vz: oz + dir[1] * 2, life: 0.8 + Math.random() * 0.5, floaty: -0.05, drag: 2.5, spin: 1, bounce: 0, grow: 1.4 });
      }
      for (let i = 0; i < (crit ? 26 : 14); i++) {
        const m = new GFX.Mesh(star, glow(i % 2 ? '#ffd23a' : '#ffffff'));
        const [ox, oy, oz] = outward(4.5, 6);
        spawn(m, { x, y: y + 0.3, z, vx: ox + dir[0] * 3, vy: oy, vz: oz + dir[1] * 3, life: 0.5 + Math.random() * 0.4, spin: 14, bounce: 0.4 });
      }
      this.confetti(x, y + 0.2, z, crit ? 36 : 18);
      this.ring(x, y, z, crit ? '#ffd23a' : '#ffffff', crit ? 3 : 2);
    },

    /** A ring on the floor that goes out and fades. */
    ring(x, y, z, colour = '#ffffff', reach = 2) {
      const mesh = new GFX.Mesh(new GFX.TorusGeometry(1, 0.035, 6, 44), ringMaterial(colour));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, (venue?.heightAt(x, z) ?? y) + 0.05, z);
      mesh.frustumCulled = false;
      group.add(mesh);
      rings.push({ mesh, age: 0, life: 0.5, reach });
    },

    /** Guitar picks, flung up: what a pick pile or a road case gives. */
    picks(x, y, z, n = 8) {
      for (let i = 0; i < n; i++) {
        const m = new GFX.Mesh(pickGeometry, picks[Math.floor(Math.random() * picks.length)]);
        const [ox, oy, oz] = outward(2.2, 6);
        spawn(m, { x, y: y + 0.2, z, vx: ox, vy: oy, vz: oz, life: 1.1 + Math.random() * 0.5, spin: 16, bounce: 0.4 });
      }
    },

    confetti(x, y, z, n = 24) {
      for (let i = 0; i < n; i++) {
        const m = new GFX.Mesh(paper, paperMats[Math.floor(Math.random() * paperMats.length)]);
        const [ox, oy, oz] = outward(3, 7);
        spawn(m, { x, y, z, vx: ox, vy: oy, vz: oz, life: 1.2 + Math.random() * 0.9, spin: 18, drag: 1.2, floaty: 0.35, bounce: 0.2 });
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

    /** Pyro on Rock, or a zap: embers and sparks up off him. */
    embers(x, y, z, colour = '#ff7a1a') {
      for (let i = 0; i < 30; i++) {
        const m = new GFX.Mesh(mote, glow(i % 3 ? colour : '#ffd23a'));
        const [ox, , oz] = outward(0.8, 0);
        spawn(m, { x: x + ox * 0.3, y, z: z + oz * 0.3, vx: ox, vy: 1.5 + Math.random() * 2.5, vz: oz, life: 0.8 + Math.random() * 0.9, floaty: -0.12, spin: 0, bounce: 0 });
      }
    },

    /** One spark lifting off a live floor and drifting up as it dies. */
    ember(x, y, z, colour = '#7ad8ff') {
      const m = new GFX.Mesh(mote, glow(Math.random() < 0.6 ? colour : '#ffffff'));
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

    /** Chips of stone knocked off Rock. */
    chips(x, y, z, n = 10) {
      for (let i = 0; i < n; i++) {
        const m = new GFX.Mesh(chip, granite);
        m.scale.setScalar(0.6 + Math.random() * 1.1);
        const [ox, oy, oz] = outward(3.4, 4.5);
        spawn(m, { x, y, z, vx: ox, vy: oy, vz: oz, life: 0.7 + Math.random() * 0.5, spin: 14, bounce: 0.35 });
      }
    },

    update(dt) {
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.age += dt;
        const u = r.age / r.life;
        if (u >= 1) { group.remove(r.mesh); rings.splice(i, 1); continue; }
        r.mesh.scale.setScalar(0.2 + r.reach * (1 - (1 - u) ** 2));
        r.mesh.material.opacity = 0.9 * (1 - u);
      }
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
        const ground = venue?.heightAt(m.position.x, m.position.z);
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
