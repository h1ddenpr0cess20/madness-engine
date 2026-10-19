/**
 * Carol's body: the wound ball and the strand laid out behind it, as two tubes
 * built once, and `pose(s)` — everything about how she looks follows from how
 * far along the floor she has rolled.
 */

import { NUB, buildRoute } from './path.js';
import { R_TARGET, STEP, YR, cellOf, windBall } from './winding.js';

/** Sides round the tube. */
const RADIAL = 8;
/** Three plies, one full twist every three centimetres. */
const PLY = 3;
const TWIST = 0.03;
/** Ply phase per metre along the strand. */
const PHASE = PLY / TWIST;
/** How many ply phases one tile of the texture holds along the strand. */
const TILE = 4;
/** The rounded cut end of the strand, in rings. */
const CAPR = 4;

/** Red wool. */
export const WOOL = 0xec3013;
const SHEEN = 0xffb4a2;

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

/** A small, stable hash: the fibres in the plies. */
function hash(x, y) {
  let a = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1);
  a = Math.imul(a ^ (a >>> 15), 0x2c1b3c6d);
  a = Math.imul(a ^ (a >>> 12), 0x297a2d39);
  return ((a ^ (a >>> 15)) >>> 0) / 4294967296;
}

/**
 * The plies, as texels: one tile of strand, `TILE` twists long and once round.
 * Red is how much light a spot gets — the groove between plies is darker, and
 * the fibres in each ply are each a shade off — and green is its height, for
 * the bump. The phase runs diagonally, so the plies spiral round the strand.
 * Plain bytes, so it can be measured without a canvas.
 */
export function plyTexels(width = 512, height = 256) {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const phase = v * PLY + u * TILE;
      const c = 2 * (phase - Math.floor(phase)) - 1;
      const bulge = Math.sqrt(Math.max(1 - c * c, 0));
      // Eleven fibres to a ply, and six runs of them to a tile along the strand.
      const fibre = hash(Math.floor(phase * 11), Math.floor(u * 6));
      const shade = (0.66 + 0.34 * bulge) * (0.82 + 0.3 * fibre);
      const i = (y * width + x) * 4;
      out[i] = out[i + 1] = out[i + 2] = Math.round(clamp(shade, 0, 1) * 255);
      out[i + 3] = 255;
    }
  }
  return out;
}

/** The ply heights: the round of each ply, with a little fibre roughness on top. */
export function plyHeights(width = 512, height = 256) {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const phase = v * PLY + u * TILE;
      const c = 2 * (phase - Math.floor(phase)) - 1;
      const bulge = Math.sqrt(Math.max(1 - c * c, 0));
      const fibre = hash(Math.floor(phase * 11), Math.floor(u * 6));
      const h = 0.85 * bulge + 0.15 * fibre;
      const i = (y * width + x) * 4;
      out[i] = out[i + 1] = out[i + 2] = Math.round(clamp(h, 0, 1) * 255);
      out[i + 3] = 255;
    }
  }
  return out;
}

function canvasTexture(GFX, texels, width, height) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const g = c.getContext('2d');
  if (!g) return null;
  g.putImageData(new ImageData(texels, width, height), 0, 0);
  const t = new GFX.CanvasTexture(c);
  t.wrapS = GFX.RepeatWrapping;
  t.wrapT = GFX.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Rings stay fixed to the strand, so nothing swims as it rolls. */
export function buildTube(GFX, rings, C, T, NR, A, RAD, TILT, aoFn) {
  const per = RADIAL + 1, V = rings * per;
  const pos = new Float32Array(V * 3), nor = new Float32Array(V * 3), col = new Float32Array(V * 3);
  const uv = new Float32Array(V * 2);
  for (let i = 0; i < rings; i++) {
    const tx = T[3 * i], ty = T[3 * i + 1], tz = T[3 * i + 2];
    const nx = NR[3 * i], ny = NR[3 * i + 1], nz = NR[3 * i + 2];
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    const tilt = TILT ? TILT[i] : 0, cb = Math.cos(tilt), sb = Math.sin(tilt);
    const r = RAD ? RAD[i] : YR;
    for (let j = 0; j <= RADIAL; j++) {
      const th = (j / RADIAL) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
      const mx = nx * c + bx * s, my = ny * c + by * s, mz = nz * c + bz * s;
      const v = i * per + j;
      const px = C[3 * i] + mx * r, py = C[3 * i + 1] + my * r, pz = C[3 * i + 2] + mz * r;
      const qx = mx * cb + tx * sb, qy = my * cb + ty * sb, qz = mz * cb + tz * sb;
      pos[3 * v] = px; pos[3 * v + 1] = py; pos[3 * v + 2] = pz;
      nor[3 * v] = qx; nor[3 * v + 1] = qy; nor[3 * v + 2] = qz;
      const ao = aoFn(i, px, py, pz, qx, qy, qz);
      col[3 * v] = col[3 * v + 1] = col[3 * v + 2] = ao;
      // Along the strand in tiles of the ply texture, and once round it.
      uv[2 * v] = (A[i] * PHASE) / TILE;
      uv[2 * v + 1] = j / RADIAL;
    }
  }
  const segs = rings - 1;
  const idx = new Uint32Array(segs * RADIAL * 6);
  let k = 0;
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const a = i * per + j, b = (i + 1) * per + j, c = b + 1, d = a + 1;
      idx[k++] = a; idx[k++] = d; idx[k++] = b;
      idx[k++] = b; idx[k++] = d; idx[k++] = c;
    }
  }
  const geo = new GFX.BufferGeometry();
  geo.setAttribute('position', new GFX.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new GFX.BufferAttribute(nor, 3));
  geo.setAttribute('color', new GFX.BufferAttribute(col, 3));
  geo.setAttribute('uv', new GFX.BufferAttribute(uv, 2));
  geo.setIndex(new GFX.BufferAttribute(idx, 1));
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/** Index entries per segment of tube. */
export const SEG_IDX = RADIAL * 6;

/**
 * Builds the ball and the strand. `root` holds both; `ball` is the wound part,
 * which rolls; `pose(s)` puts her `s` metres along the route and returns the
 * `s` it settled on (clamped to the route).
 */
export function createYarn(GFX, { seed } = {}) {
  const wind = windBall({ seed });
  const { N, P, dirs, cum, tS, rBall, HM, HMpre, iLast } = wind;
  const TOTAL = wind.total;
  const route = buildRoute();
  const routeLen = route.length;
  const { floorAt } = route;

  const material = new GFX.MeshPhysicalMaterial({
    color: WOOL, roughness: 0.94, metalness: 0,
    sheen: 0.3, sheenRoughness: 0.55, sheenColor: new GFX.Color(SHEEN),
    vertexColors: true,
  });
  material.name = 'yarn';
  const W = 512, H = 256;
  const map = canvasTexture(GFX, plyTexels(W, H), W, H);
  const bump = canvasTexture(GFX, plyHeights(W, H), W, H);
  if (map) material.map = map;
  if (bump) {
    material.bumpMap = bump;
    material.bumpScale = 2.2;
  }

  // The wound part: the whole strand, in the ball's own frame. Occlusion is how
  // far below the outer surface each vertex sits; strands under the final band
  // read against the surface before it was wound, so they look right once that
  // band has rolled off.
  const woundGeo = (() => {
    const T = new Float32Array(N * 3), NR = new Float32Array(N * 3), A = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
      let x = P[3 * b] - P[3 * a], y = P[3 * b + 1] - P[3 * a + 1], z = P[3 * b + 2] - P[3 * a + 2];
      const l = Math.hypot(x, y, z) || 1;
      x /= l; y /= l; z /= l;
      T[3 * i] = x; T[3 * i + 1] = y; T[3 * i + 2] = z;
      const ox = dirs[3 * i], oy = dirs[3 * i + 1], oz = dirs[3 * i + 2];
      const d = ox * x + oy * y + oz * z;
      const px = ox - d * x, py = oy - d * y, pz = oz - d * z; // outward, square to the strand
      const pl = Math.hypot(px, py, pz) || 1;
      NR[3 * i] = px / pl; NR[3 * i + 1] = py / pl; NR[3 * i + 2] = pz / pl;
      A[i] = cum[i];
    }
    return buildTube(GFX, N, P, T, NR, A, null, null, (i, x, y, z) => {
      const surface = HMpre && i < iLast ? HMpre : HM;
      const depth = surface[cellOf(x, y, z)] - Math.hypot(x, y, z);
      const o = clamp(1 - depth / (7 * YR), 0, 1);
      return 0.26 + 0.74 * Math.pow(o, 1.4);
    });
  })();

  // The laid part: where each bit of strand rests once it is down. No slip —
  // the bit at arc length a touches the floor exactly where the ball was when
  // it got there, so its floor position never changes.
  const aLo = TOTAL - NUB - routeLen - 0.02;
  const NL = Math.ceil((TOTAL - aLo) / STEP) + 1;
  const DL = (TOTAL - aLo) / (NL - 1);
  const laidGeo = (() => {
    const rings = NL + CAPR;
    const C = new Float32Array(rings * 3), T = new Float32Array(rings * 3), NR = new Float32Array(rings * 3);
    const A = new Float32Array(rings), RAD = new Float32Array(rings), TILT = new Float32Array(rings);
    for (let j = 0; j < NL; j++) {
      const a = aLo + j * DL;
      const f = floorAt(TOTAL - NUB - a);
      C[3 * j] = f.x; C[3 * j + 1] = YR; C[3 * j + 2] = f.z;
      T[3 * j] = -f.dx; T[3 * j + 1] = 0; T[3 * j + 2] = -f.dz;
      NR[3 * j + 1] = -1; // matches the wound frame at the contact
      A[j] = a;
      RAD[j] = YR;
    }
    const e = NL - 1;
    for (let k = 1; k <= CAPR; k++) { // the cut end, rounded
      const j = e + k, b = (k / CAPR) * Math.PI * 0.5;
      C[3 * j] = C[3 * e] + T[3 * e] * YR * Math.sin(b) * 0.85;
      C[3 * j + 1] = YR;
      C[3 * j + 2] = C[3 * e + 2] + T[3 * e + 2] * YR * Math.sin(b) * 0.85;
      T[3 * j] = T[3 * e]; T[3 * j + 2] = T[3 * e + 2];
      NR[3 * j + 1] = -1;
      A[j] = TOTAL + YR * Math.sin(b);
      RAD[j] = Math.max(YR * Math.cos(b), 0.0002);
      TILT[j] = b;
    }
    return buildTube(GFX, rings, C, T, NR, A, RAD, TILT, (i, x, y, z, nx, ny) => {
      const t = clamp((ny + 0.9) / 1.5, 0, 1);
      return 0.42 + 0.58 * t * t * (3 - 2 * t);
    });
  })();
  const laidCount = laidGeo.index.count;

  const root = new GFX.Group();
  root.name = 'carol';
  const ball = new GFX.Group();
  ball.name = 'ball';
  root.add(ball);
  const wound = new GFX.Mesh(woundGeo, material);
  wound.name = 'strand_wound';
  ball.add(wound);
  const laid = new GFX.Mesh(laidGeo, material);
  laid.name = 'strand_laid';
  root.add(laid);

  // The pose. The bit of strand at a = TOTAL − NUB − s is at the contact patch,
  // and the ball's orientation is fixed by putting that bit at the bottom,
  // running back along the path — so rolling out and rolling back are exact
  // inverses, and the wound part simply ends where the laid part begins.
  const mL = new GFX.Matrix4(), mW = new GFX.Matrix4();
  const qL = new GFX.Quaternion();
  const vA = new GFX.Vector3(), vB = new GFX.Vector3(), vC = new GFX.Vector3();
  const wA = new GFX.Vector3(), wB = new GFX.Vector3(0, -1, 0), wC = new GFX.Vector3();

  function pose(s) {
    s = clamp(s, 0, routeLen);
    const aC = TOTAL - NUB - s;
    let lo = 0, hi = N - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= aC) lo = mid; else hi = mid;
    }
    const f = clamp((aC - cum[lo]) / (cum[hi] - cum[lo] || 1), 0, 1);
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
    const rb = rBall[lo] + (rBall[hi] - rBall[lo]) * f;
    const fl = floorAt(s);
    ball.position.set(fl.x, rb + YR, fl.z);
    wA.set(-fl.dx, 0, -fl.dz);
    wC.set(-fl.dz, 0, fl.dx);
    // The turn that takes the strand's frame there onto the floor's frame here.
    qL.setFromRotationMatrix(mL.makeBasis(vA, vB, vC)).invert();
    ball.quaternion.setFromRotationMatrix(mW.makeBasis(wA, wB, wC)).multiply(qL);

    woundGeo.setDrawRange(0, (Math.min(N - 2, lo + 1) + 1) * SEG_IDX);
    const start = Math.max(0, Math.floor((aC - aLo) / DL) - 1) * SEG_IDX;
    laidGeo.setDrawRange(start, laidCount - start);
    return s;
  }

  return {
    root, ball, wound, laid, material, pose,
    /** The winding the strand was built from. */
    wind,
    /** The route's length, the strand's, and how many samples wind it. */
    routeLen, total: TOTAL, points: N,
    /** The ball's mean radius once wound. */
    radius: R_TARGET,
    /** How much strand lies on the floor at `s`, and how much is still on the ball. */
    onFloor: (s) => clamp(s, 0, routeLen) + NUB,
    onBall: (s) => TOTAL - clamp(s, 0, routeLen) - NUB,
  };
}
