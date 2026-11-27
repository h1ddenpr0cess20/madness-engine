/**
 * What a person cannot walk through: boxes and circles on the ground plan,
 * kept in a grid of 4-tile cells so that a walker only looks at what is near.
 * A walker is a circle too; `resolve` pushes it out of whatever it is in.
 */

const CELL = 4;

export function createColliders({ boxes = [], circles = [] } = {}) {
  const cells = new Map();
  const key = (cx, cz) => cx * 4096 + cz;
  const put = (item, x0, z0, x1, z1) => {
    for (let cz = Math.floor(z0 / CELL); cz <= Math.floor(z1 / CELL); cz++) {
      for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) {
        const k = key(cx, cz);
        if (!cells.has(k)) cells.set(k, []);
        cells.get(k).push(item);
      }
    }
  };
  const world = {
    boxes: [], circles: [],
    addBox(b) { world.boxes.push(b); put(b, b.x0, b.z0, b.x1, b.z1); return b; },
    addCircle(c) { world.circles.push(c); put(c, c.x - c.r, c.z - c.r, c.x + c.r, c.z + c.r); return c; },
    /** What is near (x, z) within `r`, once each. */
    near(x, z, r, visit) {
      const seen = new Set();
      for (let cz = Math.floor((z - r) / CELL); cz <= Math.floor((z + r) / CELL); cz++) {
        for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++) {
          const list = cells.get(key(cx, cz));
          if (!list) continue;
          for (const item of list) if (!seen.has(item)) { seen.add(item); visit(item); }
        }
      }
    },
  };
  for (const b of boxes) world.addBox(b);
  for (const c of circles) world.addCircle(c);
  return world;
}

/**
 * Moves the walker `p` ({ x, z }), radius `r`, out of every box and circle
 * it overlaps, and back inside `bounds` ({ x0, z0, x1, z1 }). Returns whether
 * anything pushed it.
 */
export function resolve(p, r, world, bounds, { ignore = null } = {}) {
  let pushed = false;
  for (let pass = 0; pass < 3; pass++) {
    world.near(p.x, p.z, r + 0.2, (item) => {
      if (item === ignore || item.off) return;
      if (item.r !== undefined) {
        const dx = p.x - item.x, dz = p.z - item.z, d = Math.hypot(dx, dz), need = r + item.r;
        if (d < need) {
          const k = d > 1e-6 ? (need - d) / d : 0;
          if (d > 1e-6) { p.x += dx * k; p.z += dz * k; } else p.x += need;
          pushed = true;
        }
      } else {
        const cx = Math.max(item.x0, Math.min(p.x, item.x1)), cz = Math.max(item.z0, Math.min(p.z, item.z1));
        const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
        if (d < r) {
          if (d > 1e-6) {
            p.x += (dx / d) * (r - d); p.z += (dz / d) * (r - d);
          } else {
            // Inside it: out by the nearest side.
            const out = [p.x - item.x0, item.x1 - p.x, p.z - item.z0, item.z1 - p.z];
            const m = Math.min(...out);
            if (m === out[0]) p.x = item.x0 - r; else if (m === out[1]) p.x = item.x1 + r; else if (m === out[2]) p.z = item.z0 - r; else p.z = item.z1 + r;
          }
          pushed = true;
        }
      }
    });
  }
  if (bounds) {
    const x = Math.max(bounds.x0 + r, Math.min(bounds.x1 - r, p.x)), z = Math.max(bounds.z0 + r, Math.min(bounds.z1 - r, p.z));
    if (x !== p.x || z !== p.z) pushed = true;
    p.x = x; p.z = z;
  }
  return pushed;
}

/** Whether the straight line from a to b is clear of every box and circle (for what sees and what chases). */
export function clearLine(a, b, world, step = 0.5) {
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  const n = Math.max(1, Math.ceil(d / step));
  let blocked = false;
  for (let i = 1; i < n && !blocked; i++) {
    const x = a.x + ((b.x - a.x) * i) / n, z = a.z + ((b.z - a.z) * i) / n;
    world.near(x, z, 0.1, (item) => {
      if (item.off || item.low) return;
      if (item.r !== undefined) { if (Math.hypot(x - item.x, z - item.z) < item.r) blocked = true; } else if (x > item.x0 && x < item.x1 && z > item.z0 && z < item.z1) blocked = true;
    });
  }
  return !blocked;
}
