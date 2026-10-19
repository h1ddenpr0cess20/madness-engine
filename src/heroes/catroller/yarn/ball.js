import { buildTube, createYarn, SEG_IDX } from './model.js';

/** As the tube in `model.js`: sides round it, and ply phase per metre over the texture's tile. */
const RADIAL = 8;
const UV_PER_METRE = (3 / 0.03) / 4;
import { STEP, YR } from './winding.js';

/**
 * The yarn ball in the house: the Yarn character's ball as Carol has it on
 * this engine (`model.js`, `winding.js`, as they are there), rolled by the
 * game's physics instead of along Carol's route.
 *
 * While nothing holds its loose end, it rolls free, turned as a ball turns.
 * When something catches the end — a cat's paw, the nosing of a stair, a
 * nail — the strand pays out behind it along the floor wherever it rolls,
 * and the ball is posed from the strand just as Carol's is: the bit at the
 * contact patch at the bottom, running back along the path, so rolling back
 * along the strand winds it back on. Past a holder's limit, it snaps, and
 * that much yarn is gone.
 *
 * The ball is in metres, as Carol is; `root` is scaled to the house.
 */

/** Metres to a tile of the house. */
export const TILE_METRES = 0.3;

/** The longest the strand pays out before it snaps, whatever holds it, in metres. */
export const MAX_LAID = 4.5;

/** Further than this in one step (metres) and the ball didn't roll there: it fell, or was put there. */
const JUMP = 0.12;

/** The floor path is sampled every 2 mm, as Carol's route is. */
const RS = 0.002;
const CAPR = 4;

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

/** The sample at arc length `a`, and how far on to the next: [lo, hi, f]. */
function sampleAt(cum, N, a) {
  let lo = 0, hi = N - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= a) lo = mid; else hi = mid;
  }
  return [lo, hi, clamp((a - cum[lo]) / (cum[hi] - cum[lo] || 1), 0, 1)];
}

/**
 * `floor(x, z)` is the height of the floor under (x, z) in tiles, or null
 * over nothing.
 */
export function createBall(GFX, floor) {
  const yarn = createYarn(GFX);
  const { ball, wound, material } = yarn;
  // Carol's own laid strand runs along Carol's route; here it is laid as the ball goes.
  yarn.laid.visible = false;
  const { N, dirs, cum, tS, rBall } = yarn.wind;
  const TOTAL = yarn.total;
  wound.castShadow = true;
  wound.receiveShadow = true;

  const root = new GFX.Group();
  root.name = 'yarn';
  root.scale.setScalar(1 / TILE_METRES);
  root.add(ball);

  /* The laid part: where each bit of strand rests once it's down. No slip —
     the bit at arc length a touches the floor exactly where the ball was
     when it got there, so its floor position never changes. */
  const DL = STEP;
  const NL = Math.ceil(MAX_LAID / DL) + 1;
  const rings = NL + CAPR;
  const C = new Float32Array(rings * 3), T = new Float32Array(rings * 3), NR = new Float32Array(rings * 3);
  const A = new Float32Array(rings), RAD = new Float32Array(rings).fill(YR), TILT = new Float32Array(rings);
  const laidAO = (i, x, y, z, nx, ny) => {
    const t = clamp((ny + 0.9) / 1.5, 0, 1);
    return 0.42 + 0.58 * t * t * (3 - 2 * t);
  };
  for (let j = 0; j < rings; j++) { NR[3 * j + 1] = -1; T[3 * j] = 1; }
  const laidGeo = buildTube(GFX, rings, C, T, NR, A, RAD, TILT, laidAO);
  laidGeo.boundingSphere.radius = 1e6;
  const laidCount = laidGeo.index.count;
  const laid = new GFX.Mesh(laidGeo, material);
  laid.name = 'strand_laid';
  laid.castShadow = true;
  laid.receiveShadow = true;
  laid.frustumCulled = false;
  laid.visible = false;
  root.add(laid);
  // Rings [from, to) of the laid tube again, from C, T, NR, A, RAD, TILT: buildTube's rings, in place.
  const pos = laidGeo.attributes.position.array, nor = laidGeo.attributes.normal.array;
  const col = laidGeo.attributes.color.array, uv = laidGeo.attributes.uv.array;
  const refill = (from, to) => {
    if (to <= from) return;
    const per = RADIAL + 1;
    for (let i = from; i < to; i++) {
      const tx = T[3 * i], ty = T[3 * i + 1], tz = T[3 * i + 2];
      const nx = NR[3 * i], ny = NR[3 * i + 1], nz = NR[3 * i + 2];
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      const tilt = TILT[i], cb = Math.cos(tilt), sb = Math.sin(tilt);
      const r = RAD[i];
      for (let j = 0; j <= RADIAL; j++) {
        const th = (j / RADIAL) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
        const mx = nx * c + bx * s, my = ny * c + by * s, mz = nz * c + bz * s;
        const v = i * per + j;
        const px = C[3 * i] + mx * r, py = C[3 * i + 1] + my * r, pz = C[3 * i + 2] + mz * r;
        const qx = mx * cb + tx * sb, qy = my * cb + ty * sb, qz = mz * cb + tz * sb;
        pos[3 * v] = px; pos[3 * v + 1] = py; pos[3 * v + 2] = pz;
        nor[3 * v] = qx; nor[3 * v + 1] = qy; nor[3 * v + 2] = qz;
        const ao = laidAO(i, px, py, pz, qx, qy, qz);
        col[3 * v] = col[3 * v + 1] = col[3 * v + 2] = ao;
        uv[2 * v] = A[i] * UV_PER_METRE;
        uv[2 * v + 1] = j / RADIAL;
      }
    }
    for (const name of ['position', 'normal', 'color', 'uv']) laidGeo.attributes[name].needsUpdate = true;
  };

  /* The dark pinch where the ball meets the floor, as Carol has it. */
  let contact = null;
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,0.55)');
      grad.addColorStop(0.35, 'rgba(0,0,0,0.28)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 128);
      contact = new GFX.Mesh(
        new GFX.PlaneGeometry(1, 1),
        new GFX.MeshBasicMaterial({ map: new GFX.CanvasTexture(c), transparent: true, depthWrite: false }));
      contact.name = 'contact';
      contact.rotation.x = -Math.PI / 2;
      contact.renderOrder = -1;
      root.add(contact);
    }
  }

  // Where the strand ends now (lost yarn has gone from the outside), and the
  // floor path it has paid out along since it was caught, in metres.
  let end = TOTAL;
  let holder = null;
  const path = [];
  let written = NL;
  let blend = 1;

  /* The pose, as Carol's: the bit of strand at a = end − s is at the contact
     patch, the ball turned so that bit is at the bottom, running back along
     the path. */
  const mL = new GFX.Matrix4(), mW = new GFX.Matrix4();
  const qL = new GFX.Quaternion(), qPosed = new GFX.Quaternion(), qFree = new GFX.Quaternion();
  const vA = new GFX.Vector3(), vB = new GFX.Vector3(), vC = new GFX.Vector3();
  const wA = new GFX.Vector3(), wB = new GFX.Vector3(0, -1, 0), wC = new GFX.Vector3();

  function strandPose(aC, dx, dz) {
    const [lo, hi, f] = sampleAt(cum, N, aC);
    vB.set(
      dirs[3 * lo] + (dirs[3 * hi] - dirs[3 * lo]) * f,
      dirs[3 * lo + 1] + (dirs[3 * hi + 1] - dirs[3 * lo + 1]) * f,
      dirs[3 * lo + 2] + (dirs[3 * hi + 2] - dirs[3 * lo + 2]) * f).normalize();
    vA.set(
      tS[3 * lo] + (tS[3 * hi] - tS[3 * lo]) * f,
      tS[3 * lo + 1] + (tS[3 * hi + 1] - tS[3 * lo + 1]) * f,
      tS[3 * lo + 2] + (tS[3 * hi + 2] - tS[3 * lo + 2]) * f);
    vA.addScaledVector(vB, -vA.dot(vB)).normalize();
    vC.crossVectors(vA, vB);
    wA.set(-dx, 0, -dz);
    wC.set(-dz, 0, dx);
    // The turn that takes the strand's frame there onto the floor's frame here.
    qL.setFromRotationMatrix(mL.makeBasis(vA, vB, vC)).invert();
    qPosed.setFromRotationMatrix(mW.makeBasis(wA, wB, wC)).multiply(qL);
    return lo;
  }

  /** The radius the ball rides on with the bit at `a` at the contact, in metres (to its middle). */
  const riding = (a) => {
    const [lo, hi, f] = sampleAt(cum, N, clamp(a, 0, TOTAL));
    return rBall[lo] + (rBall[hi] - rBall[lo]) * f + YR;
  };

  const paidOut = () => Math.max(0, (path.length - 1) * RS);

  /** Which way the path runs at distance d along it, from the catch toward the ball. */
  function headingAt(d) {
    const i = clamp(Math.round(d / RS), 1, path.length - 1);
    const a = path[i - 1], b = path[i];
    const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1;
    return [dx / l, dz / l];
  }

  /** Ring j of the laid strand is the bit at arc length aLo + j·DL. */
  const aLo = () => end - MAX_LAID;

  /** Lays down every bit of strand that has reached the floor since last time. */
  function lay(s) {
    // From one ring short of the contact, as the draw range starts there.
    const first = clamp(Math.floor((end - s - aLo()) / DL) - 1, 0, NL - 1);
    if (first >= written) return;
    for (let j = first; j < written; j++) {
      const a = aLo() + j * DL;
      const d = clamp(end - a, 0, s);
      const k = Math.min(path.length - 1, Math.floor(d / RS)), t = d / RS - k;
      const p0 = path[k], p1 = path[Math.min(path.length - 1, k + 1)];
      C[3 * j] = p0[0] + (p1[0] - p0[0]) * t;
      C[3 * j + 1] = p0[1] + (p1[1] - p0[1]) * t + YR;
      C[3 * j + 2] = p0[2] + (p1[2] - p0[2]) * t;
      const [hx, hz] = headingAt(d);
      T[3 * j] = -hx; T[3 * j + 1] = 0; T[3 * j + 2] = -hz;
      NR[3 * j] = 0; NR[3 * j + 1] = -1; NR[3 * j + 2] = 0; // matches the wound frame at the contact
      A[j] = a; RAD[j] = YR; TILT[j] = 0;
    }
    refill(first, written);
    // The ring short of the contact sits at the contact until the strand reaches it: written again next time.
    written = Math.min(NL - 1, first + 1);
  }

  /** The end where it was caught: the cut end, rounded. */
  function capEnd() {
    const e = NL - 1;
    C[3 * e] = path[0][0]; C[3 * e + 1] = path[0][1] + YR; C[3 * e + 2] = path[0][2];
    // Until the ball has gone anywhere, the strand runs back the way it came in.
    T[3 * e + 1] = 0;
    NR[3 * e] = 0; NR[3 * e + 1] = -1; NR[3 * e + 2] = 0;
    A[e] = end;
    for (let k = 1; k <= CAPR; k++) {
      const j = e + k, b = (k / CAPR) * Math.PI * 0.5;
      C[3 * j] = C[3 * e] + T[3 * e] * YR * Math.sin(b) * 0.85;
      C[3 * j + 1] = C[3 * e + 1];
      C[3 * j + 2] = C[3 * e + 2] + T[3 * e + 2] * YR * Math.sin(b) * 0.85;
      T[3 * j] = T[3 * e]; T[3 * j + 1] = 0; T[3 * j + 2] = T[3 * e + 2];
      NR[3 * j] = 0; NR[3 * j + 1] = -1; NR[3 * j + 2] = 0;
      A[j] = end + YR * Math.sin(b);
      RAD[j] = Math.max(YR * Math.cos(b), 0.0002);
      TILT[j] = b;
    }
    refill(e, rings);
  }

  /** What has paid out, left where it lies: a piece of strand on the floor, in the house's tiles. */
  function cut(s) {
    // Everything up to the contact laid first: rings not laid yet still hold strand from an earlier catch.
    lay(s);
    const first = clamp(Math.floor((end - s - aLo()) / DL), 0, NL - 1);
    const n = rings - first;
    const geo = buildTube(GFX, n, C.slice(first * 3), T.slice(first * 3), NR.slice(first * 3), A.slice(first), RAD.slice(first), TILT.slice(first), laidAO);
    const piece = new GFX.Mesh(geo, material);
    piece.name = 'strand_lost';
    piece.castShadow = true;
    piece.receiveShadow = true;
    const group = new GFX.Group();
    group.name = 'lost-yarn';
    group.scale.setScalar(1 / TILE_METRES);
    group.add(piece);
    const tip = path[0];
    const along = [];
    for (let i = 0; i < path.length; i += 40) along.push([path[i][0] / TILE_METRES, path[i][2] / TILE_METRES]);
    return { group, metres: s, at: [tip[0] / TILE_METRES, tip[1] / TILE_METRES, tip[2] / TILE_METRES], along };
  }

  function release() {
    holder = null;
    path.length = 0;
    laid.visible = false;
    qFree.copy(qPosed);
  }

  const out = { radius: riding(end) / TILE_METRES, snapped: null, rewound: false, piece: null };

  return {
    root, ball, wound, laid, material,
    /** Yarn on the ball, in metres; what has paid out still counts until it snaps. */
    get metres() { return end; },
    get total() { return TOTAL; },
    get holder() { return holder; },
    get paid() { return holder ? paidOut() : 0; },
    /** The radius it rolls on now, in tiles. */
    get radius() { return out.radius; },
    /** Its turn while it rolls free, for the physics to keep turning; [x, y, z, w]. */
    freeTurn(q) { q[0] = qFree.x; q[1] = qFree.y; q[2] = qFree.z; q[3] = qFree.w; return q; },

    /**
     * The loose end is caught where the ball is, by `who`: { snap: how many
     * metres pay out before it snaps, letGo: whether it lets the strand wind
     * all the way back on }. False if it is already caught.
     */
    snag(b, q, who) {
      if (holder) return false;
      holder = who;
      const f = floor(b.x, b.z);
      path.length = 0;
      path.push([b.x * TILE_METRES, (f ?? b.y - b.r) * TILE_METRES, b.z * TILE_METRES]);
      // The end trails back the way the ball came.
      const v = Math.hypot(b.vx ?? 0, b.vz ?? 0);
      const e = NL - 1;
      T[3 * e] = v > 1e-3 ? -(b.vx / v) : 1; T[3 * e + 2] = v > 1e-3 ? -(b.vz / v) : 0;
      written = NL - 1;
      capEnd();
      laid.visible = true;
      qFree.set(q[0], q[1], q[2], q[3]);
      blend = 0;
      return true;
    },

    /**
     * Once a physics step, after the ball `b` (tiles) has moved: the strand
     * pays out or winds back on. Returns { radius (tiles, for the physics),
     * snapped (metres lost, or null), piece (what was left on the floor),
     * rewound (wound all the way back on) }.
     */
    step(b, dt) {
      out.snapped = null;
      out.piece = null;
      out.rewound = false;
      if (holder) {
        const x = b.x * TILE_METRES, z = b.z * TILE_METRES;
        const f = floor(b.x, b.z);
        const y = (f ?? b.y - b.r) * TILE_METRES;
        // Off the edge of the floor, or put down somewhere else all at once (back where it was safe, or in
        // the next room): the strand can't follow it there, so it snaps where it lies.
        const was = path[path.length - 1];
        if (f === null || Math.hypot(x - was[0], z - was[2]) > JUMP) {
          const s = paidOut();
          out.piece = s > RS * 4 ? cut(s) : null;
          out.snapped = s;
          end -= s;
          if (path.length > 1) strandPose(end, ...headingAt(s));
          release();
          out.radius = riding(end) / TILE_METRES;
          return out;
        }
        // Back over the strand: it winds back on. Anywhere else: it pays out.
        let best = path.length - 1, bestD = Infinity;
        for (let i = Math.max(0, path.length - 40); i < path.length; i++) {
          const d = Math.hypot(path[i][0] - x, path[i][2] - z);
          if (d < bestD) { bestD = d; best = i; }
        }
        if (best < path.length - 1 && bestD < 0.01) {
          path.length = best + 1;
          written = Math.max(written, clamp(Math.ceil((end - paidOut() - aLo()) / DL), 0, NL - 1));
        }
        let last = path[path.length - 1];
        let gap = Math.hypot(x - last[0], z - last[2]);
        while (gap >= RS) {
          const k = RS / gap;
          last = [last[0] + (x - last[0]) * k, last[1] + (y - last[1]) * k, last[2] + (z - last[2]) * k];
          path.push(last);
          gap -= RS;
        }
        const s = paidOut();
        if (s >= Math.min(MAX_LAID, holder.snap ?? MAX_LAID)) {
          out.piece = cut(s);
          out.snapped = s;
          end -= s;
          strandPose(end, ...headingAt(s));
          release();
        } else if (s <= RS && holder.letGo) {
          out.rewound = true;
          release();
        } else if (path.length > 1) {
          lay(s);
        }
      }
      out.radius = riding(holder ? end - paidOut() : end) / TILE_METRES;
      blend = Math.min(1, blend + dt / 0.2);
      return out;
    },

    /** Puts the ball where the physics has it: turned by `q` while free, posed from the strand while caught. */
    pose(b, q) {
      let lo;
      if (holder && path.length > 1) {
        const s = paidOut();
        lo = strandPose(end - s, ...headingAt(s));
        // Caught, it swings round onto the strand over a fifth of a second.
        if (blend < 1) {
          qL.copy(qPosed);
          qPosed.set(q[0], q[1], q[2], q[3]).slerp(qL, blend);
        }
        ball.quaternion.copy(qPosed);
        const start = Math.max(0, Math.floor((end - s - aLo()) / DL) - 1) * SEG_IDX;
        laidGeo.setDrawRange(start, laidCount - start);
      } else {
        lo = sampleAt(cum, N, end)[0];
        ball.quaternion.set(q[0], q[1], q[2], q[3]);
        qPosed.copy(ball.quaternion);
        if (holder) laidGeo.setDrawRange(0, 0);
      }
      ball.position.set(b.x * TILE_METRES, b.y * TILE_METRES, b.z * TILE_METRES);
      wound.geometry.setDrawRange(0, (Math.min(N - 2, lo + 1) + 1) * SEG_IDX);
      if (contact) {
        const ground = floor(b.x, b.z);
        const lift = ground === null ? Infinity : b.y - b.r - ground;
        contact.visible = lift < 0.6;
        if (contact.visible) {
          contact.position.set(b.x * TILE_METRES, ground * TILE_METRES + 0.0006, b.z * TILE_METRES);
          contact.material.opacity = clamp(1 - lift / 0.6, 0, 1);
          contact.scale.setScalar(b.r * TILE_METRES * 1.9);
        }
      }
    },

    /** Lets go of the strand where it is: whatever has paid out is lost. */
    snap() {
      if (!holder) return null;
      const s = paidOut();
      const piece = s > RS * 4 ? cut(s) : null;
      end -= s;
      release();
      out.radius = riding(end) / TILE_METRES;
      return piece;
    },

    /** Winds `metres` more on (a skein found), up to a whole ball; how much went on. */
    windOn(metres) {
      if (holder) return 0;
      const before = end;
      end = Math.min(TOTAL, end + metres);
      out.radius = riding(end) / TILE_METRES;
      return end - before;
    },

    /** How much yarn is on it, outright (a new run). */
    set(metres) {
      if (holder) release();
      end = clamp(metres, STEP * 8, TOTAL);
      out.radius = riding(end) / TILE_METRES;
    },
  };
}
