/**
 * Where the ball rolls: a gentle S on the diagonal, from the back of the room
 * on the left toward the front on the right of the camera's usual seat — she
 * comes forward to talk, and goes back when it is over — and the tail behind its start that always lies there, curling as
 * it nears its end. Positions are in the floor plane (x, z), in metres.
 */

/** The tail that always lies on the floor, however far the ball has rolled back. */
export const NUB = 0.22;

/** Across the view, and toward the viewer, for the camera's default seat. */
const RIGHT = norm([1.25, -1]);
const TOWARD = norm([1, 1.25]);

/** Halfway between the two: the way the route runs, and square to it. */
const ALONG = norm([RIGHT[0] + TOWARD[0], RIGHT[1] + TOWARD[1]]);
const SIDE = norm([TOWARD[0] - RIGHT[0], TOWARD[1] - RIGHT[1]]);

/** The route's knots, as (along, side) pairs: a diagonal with a gentle sway. */
const KNOTS = [[-0.5, -0.08], [-0.24, 0.05], [0, 0.07], [0.24, 0.0], [0.46, -0.07]];

/** Floor samples every this many metres along the route; positions between are interpolated. */
const SPACING = 0.002;

function norm([x, z]) {
  const l = Math.hypot(x, z);
  return [x / l, z / l];
}

/*
 * A centripetal Catmull-Rom spline through the knots — the parameterisation
 * that never loops or cusps between close knots — the way three.js's
 * CatmullRomCurve3 works it out, open at both ends.
 */
function cubic(x0, x1, x2, x3, dt0, dt1, dt2) {
  let t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
  let t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;
  t1 *= dt1;
  t2 *= dt1;
  const c2 = -3 * x1 + 3 * x2 - 2 * t1 - t2;
  const c3 = 2 * x1 - 2 * x2 + t1 + t2;
  return (t) => x1 + t1 * t + c2 * t * t + c3 * t * t * t;
}

export function catmullRom(points) {
  const l = points.length;
  const spans = [];
  for (let i = 0; i < l - 1; i++) {
    const p1 = points[i], p2 = points[i + 1];
    const p0 = i > 0 ? points[i - 1] : [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]];
    const p3 = i + 2 < l ? points[i + 2] : [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]];
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    let dt0 = d2(p0, p1) ** 0.25, dt1 = d2(p1, p2) ** 0.25, dt2 = d2(p2, p3) ** 0.25;
    if (dt1 < 1e-4) dt1 = 1;
    if (dt0 < 1e-4) dt0 = dt1;
    if (dt2 < 1e-4) dt2 = dt1;
    spans.push([
      cubic(p0[0], p1[0], p2[0], p3[0], dt0, dt1, dt2),
      cubic(p0[1], p1[1], p2[1], p3[1], dt0, dt1, dt2),
    ]);
  }
  /** The point a fraction u of the way through the knots (not of the length). */
  return (u) => {
    const p = (l - 1) * Math.min(1, Math.max(0, u));
    const i = Math.min(Math.floor(p), l - 2);
    const [x, z] = spans[i];
    return [x(p - i), z(p - i)];
  };
}

/**
 * The route, sampled evenly by arc length, and the tail behind its start.
 * `floorAt(x)` is the floor position `x` metres along it — negative `x` is
 * the tail — with the unit direction it runs in there.
 */
export function buildRoute() {
  const curve = catmullRom(KNOTS.map(([a, s]) => [
    ALONG[0] * a + SIDE[0] * s,
    ALONG[1] * a + SIDE[1] * s,
  ]));

  // Arc length against the curve's own parameter, finely, then resampled evenly.
  const DIV = 4000;
  const us = new Float64Array(DIV + 1);
  const ls = new Float64Array(DIV + 1);
  let [px, pz] = curve(0);
  for (let k = 1; k <= DIV; k++) {
    const [x, z] = curve(k / DIV);
    us[k] = k / DIV;
    ls[k] = ls[k - 1] + Math.hypot(x - px, z - pz);
    px = x;
    pz = z;
  }
  const length = ls[DIV];
  const NRS = Math.ceil(length / SPACING) + 1;
  const RS = length / (NRS - 1);
  const rX = new Float32Array(NRS), rZ = new Float32Array(NRS);
  const rDX = new Float32Array(NRS), rDZ = new Float32Array(NRS);
  let j = 0;
  for (let k = 0; k < NRS; k++) {
    const s = k * RS;
    while (j < DIV - 1 && ls[j + 1] < s) j++;
    const u = us[j] + ((s - ls[j]) / (ls[j + 1] - ls[j] || 1)) * (us[j + 1] - us[j]);
    const [x, z] = curve(u);
    const [ax, az] = curve(Math.max(0, u - 1e-4));
    const [bx, bz] = curve(Math.min(1, u + 1e-4));
    const dl = Math.hypot(bx - ax, bz - az) || 1;
    rX[k] = x; rZ[k] = z; rDX[k] = (bx - ax) / dl; rDZ[k] = (bz - az) / dl;
  }

  // Behind the start: the tail, curling off to one side as it nears its end.
  const TAIL = NUB + 0.03;
  const NT = Math.ceil(TAIL / RS) + 1;
  const tX = new Float32Array(NT), tZ = new Float32Array(NT);
  const tDX = new Float32Array(NT), tDZ = new Float32Array(NT);
  {
    let x = rX[0], z = rZ[0];
    const bx = -rDX[0], bz = -rDZ[0], sx = bz, sz = -bx;
    for (let k = 0; k < NT; k++) {
      const th = 1.6 * ((k * RS) / TAIL) ** 2;
      const cx = bx * Math.cos(th) + sx * Math.sin(th), cz = bz * Math.cos(th) + sz * Math.sin(th);
      tX[k] = x; tZ[k] = z; tDX[k] = -cx; tDZ[k] = -cz;
      x += cx * RS;
      z += cz * RS;
    }
  }

  const F = { x: 0, z: 0, dx: 1, dz: 0 };
  /** Floor position at route distance x (x < 0: the tail), and the way it runs. Reuses one object. */
  function floorAt(x) {
    const neg = x < 0;
    const X = neg ? tX : rX, Z = neg ? tZ : rZ, DX = neg ? tDX : rDX, DZ = neg ? tDZ : rDZ;
    const cnt = neg ? NT : NRS;
    const f = (neg ? Math.min(-x, TAIL) : Math.min(x, length)) / RS;
    const i = Math.min(Math.floor(f), cnt - 2), t = f - i;
    F.x = X[i] + (X[i + 1] - X[i]) * t;
    F.z = Z[i] + (Z[i + 1] - Z[i]) * t;
    const dx = DX[i] + (DX[i + 1] - DX[i]) * t, dz = DZ[i] + (DZ[i + 1] - DZ[i]) * t;
    const l = Math.hypot(dx, dz) || 1;
    F.dx = dx / l;
    F.dz = dz / l;
    return F;
  }

  return { length, floorAt };
}
