/**
 * Bones, and skin over them. A creature's skeleton is a tree of bones, each
 * with a pivot in the creature's rest pose; a pose turns, moves and scales
 * each bone about its pivot, in its parent's frame. The skin — every vertex
 * of the sculpted mesh, with up to four bones and how much each pulls it —
 * is moved to match on the CPU, a blend of its bones' matrices, and handed
 * to the renderer as a fresh vertex buffer.
 *
 * Matrices are 3×4, row-major, twelve floats each: the rest pose is the
 * identity, so a bone's matrix takes rest-pose points straight to posed ones.
 */

/** A bone's pose: turned by `rot` (Euler x, y, z, radians), then scaled by `scale`, about its pivot; moved by `move`. */
const still = () => ({ rot: [0, 0, 0], move: [0, 0, 0], scale: [1, 1, 1] });

export class Skeleton {
  /** `bones`: [name, parent name or null, pivot [x, y, z]], parents before children. */
  constructor(bones) {
    this.names = bones.map(([name]) => name);
    this.parents = bones.map(([, parent]) => {
      if (parent === null) return -1;
      const i = this.names.indexOf(parent);
      if (i < 0) throw new Error(`rig: bone ${parent} comes after its child`);
      return i;
    });
    this.pivots = bones.map(([, , at]) => at);
    this.pose = bones.map(still);
    this.matrices = new Float32Array(bones.length * 12);
    this.index = new Map(this.names.map((n, i) => [n, i]));
  }

  /** Back to the rest pose. */
  reset() {
    for (const p of this.pose) {
      p.rot[0] = p.rot[1] = p.rot[2] = 0;
      p.move[0] = p.move[1] = p.move[2] = 0;
      p.scale[0] = p.scale[1] = p.scale[2] = 1;
    }
    return this;
  }

  /** The pose of the bone named `name`, to change in place; a no-op stand-in if there is no such bone. */
  bone(name) {
    const i = this.index.get(name);
    return i === undefined ? still() : this.pose[i];
  }

  /** Turns bone `name` by [x, y, z] more. */
  turn(name, x = 0, y = 0, z = 0) {
    const r = this.bone(name).rot;
    r[0] += x; r[1] += y; r[2] += z;
    return this;
  }

  move(name, x = 0, y = 0, z = 0) {
    const m = this.bone(name).move;
    m[0] += x; m[1] += y; m[2] += z;
    return this;
  }

  scale(name, x = 1, y = x, z = x) {
    const s = this.bone(name).scale;
    s[0] *= x; s[1] *= y; s[2] *= z;
    return this;
  }

  /** Works out every bone's matrix from the pose. */
  compute() {
    const M = this.matrices;
    for (let b = 0; b < this.pose.length; b++) {
      const { rot, move, scale } = this.pose[b];
      const [px, py, pz] = this.pivots[b];
      const cx = Math.cos(rot[0]), sx = Math.sin(rot[0]), cy = Math.cos(rot[1]), sy = Math.sin(rot[1]), cz = Math.cos(rot[2]), sz = Math.sin(rot[2]);
      // L = T(pivot + move) · Rz·Ry·Rx · S · T(−pivot)
      const r00 = cz * cy, r01 = cz * sy * sx - sz * cx, r02 = cz * sy * cx + sz * sx;
      const r10 = sz * cy, r11 = sz * sy * sx + cz * cx, r12 = sz * sy * cx - cz * sx;
      const r20 = -sy, r21 = cy * sx, r22 = cy * cx;
      const a00 = r00 * scale[0], a01 = r01 * scale[1], a02 = r02 * scale[2];
      const a10 = r10 * scale[0], a11 = r11 * scale[1], a12 = r12 * scale[2];
      const a20 = r20 * scale[0], a21 = r21 * scale[1], a22 = r22 * scale[2];
      const t0 = px + move[0] - (a00 * px + a01 * py + a02 * pz);
      const t1 = py + move[1] - (a10 * px + a11 * py + a12 * pz);
      const t2 = pz + move[2] - (a20 * px + a21 * py + a22 * pz);
      const o = b * 12, p = this.parents[b];
      if (p < 0) {
        M[o] = a00; M[o + 1] = a01; M[o + 2] = a02; M[o + 3] = t0;
        M[o + 4] = a10; M[o + 5] = a11; M[o + 6] = a12; M[o + 7] = t1;
        M[o + 8] = a20; M[o + 9] = a21; M[o + 10] = a22; M[o + 11] = t2;
      } else {
        // W = Wparent · L
        const q = p * 12;
        for (let r = 0; r < 3; r++) {
          const m0 = M[q + r * 4], m1 = M[q + r * 4 + 1], m2 = M[q + r * 4 + 2], m3 = M[q + r * 4 + 3];
          M[o + r * 4] = m0 * a00 + m1 * a10 + m2 * a20;
          M[o + r * 4 + 1] = m0 * a01 + m1 * a11 + m2 * a21;
          M[o + r * 4 + 2] = m0 * a02 + m1 * a12 + m2 * a22;
          M[o + r * 4 + 3] = m0 * t0 + m1 * t1 + m2 * t2 + m3;
        }
      }
    }
    return M;
  }

  /** Where the rest-pose point p is now, under bone `name`. */
  point(name, p) {
    const o = (this.index.get(name) ?? 0) * 12, M = this.matrices;
    return [
      M[o] * p[0] + M[o + 1] * p[1] + M[o + 2] * p[2] + M[o + 3],
      M[o + 4] * p[0] + M[o + 5] * p[1] + M[o + 6] * p[2] + M[o + 7],
      M[o + 8] * p[0] + M[o + 9] * p[1] + M[o + 10] * p[2] + M[o + 11],
    ];
  }
}

/**
 * Moves the skin: rest positions and normals (`rest`) to posed ones
 * (`position`, `normal`), under the bone matrices `M`.
 */
export function skin(rest, M, position, normal) {
  const { position: P, normal: N, skinIndex: I, skinWeight: W } = rest;
  const count = P.length / 3;
  for (let v = 0; v < count; v++) {
    const i4 = v * 4;
    let m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11;
    const w0 = W[i4];
    let o = I[i4] * 12;
    if (w0 >= 0.999) {
      m0 = M[o]; m1 = M[o + 1]; m2 = M[o + 2]; m3 = M[o + 3];
      m4 = M[o + 4]; m5 = M[o + 5]; m6 = M[o + 6]; m7 = M[o + 7];
      m8 = M[o + 8]; m9 = M[o + 9]; m10 = M[o + 10]; m11 = M[o + 11];
    } else {
      m0 = M[o] * w0; m1 = M[o + 1] * w0; m2 = M[o + 2] * w0; m3 = M[o + 3] * w0;
      m4 = M[o + 4] * w0; m5 = M[o + 5] * w0; m6 = M[o + 6] * w0; m7 = M[o + 7] * w0;
      m8 = M[o + 8] * w0; m9 = M[o + 9] * w0; m10 = M[o + 10] * w0; m11 = M[o + 11] * w0;
      for (let k = 1; k < 4; k++) {
        const w = W[i4 + k];
        if (w <= 0) break;
        o = I[i4 + k] * 12;
        m0 += M[o] * w; m1 += M[o + 1] * w; m2 += M[o + 2] * w; m3 += M[o + 3] * w;
        m4 += M[o + 4] * w; m5 += M[o + 5] * w; m6 += M[o + 6] * w; m7 += M[o + 7] * w;
        m8 += M[o + 8] * w; m9 += M[o + 9] * w; m10 += M[o + 10] * w; m11 += M[o + 11] * w;
      }
    }
    const v3 = v * 3;
    const x = P[v3], y = P[v3 + 1], z = P[v3 + 2];
    position[v3] = m0 * x + m1 * y + m2 * z + m3;
    position[v3 + 1] = m4 * x + m5 * y + m6 * z + m7;
    position[v3 + 2] = m8 * x + m9 * y + m10 * z + m11;
    // Normals by the same matrix: near enough for turns and gentle squashes.
    const a = N[v3], b = N[v3 + 1], c = N[v3 + 2];
    const nx = m0 * a + m1 * b + m2 * c, ny = m4 * a + m5 * b + m6 * c, nz = m8 * a + m9 * b + m10 * c;
    const l = 1 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1);
    normal[v3] = nx * l; normal[v3 + 1] = ny * l; normal[v3 + 2] = nz * l;
  }
}

/**
 * Moves the skin as `skin` does, but blends each vertex's bones as dual
 * quaternions (their turns and moves, not their matrices), so a joint bent
 * far, or twisted, keeps its volume instead of pinching thin: shoulders
 * and elbows stay round. Any squash or stretch a bone has (its matrix less
 * its turn) is added on as `skin` would. `skeleton`: the Skeleton whose
 * matrices (already computed) move it.
 */
export function skinDual(rest, skeleton, position, normal) {
  const { position: P, normal: N, skinIndex: I, skinWeight: W } = rest;
  const M = skeleton.matrices, n = skeleton.pivots.length;
  // Each bone: its turn as a quaternion (x, y, z, w), its move as the dual part, and what is left of its matrix.
  const Q = new Float64Array(n * 8), D = new Float64Array(n * 12), scaled = new Uint8Array(n);
  for (let b = 0; b < n; b++) {
    const o = b * 12;
    // The turn: the matrix's columns made unit length and square (enough for the slight squashes bones are given).
    let c0 = [M[o], M[o + 4], M[o + 8]], c1 = [M[o + 1], M[o + 5], M[o + 9]];
    const l0 = Math.hypot(...c0), l1 = Math.hypot(...c1), l2 = Math.hypot(M[o + 2], M[o + 6], M[o + 10]);
    c0 = c0.map((x) => x / l0);
    const d01 = c0[0] * c1[0] + c0[1] * c1[1] + c0[2] * c1[2];
    c1 = [c1[0] - c0[0] * d01, c1[1] - c0[1] * d01, c1[2] - c0[2] * d01];
    const l1b = Math.hypot(...c1);
    c1 = c1.map((x) => x / l1b);
    const c2 = [c0[1] * c1[2] - c0[2] * c1[1], c0[2] * c1[0] - c0[0] * c1[2], c0[0] * c1[1] - c0[1] * c1[0]];
    const r00 = c0[0], r10 = c0[1], r20 = c0[2], r01 = c1[0], r11 = c1[1], r21 = c1[2], r02 = c2[0], r12 = c2[1], r22 = c2[2];
    let qx, qy, qz, qw;
    const tr = r00 + r11 + r22;
    if (tr > 0) {
      const s = Math.sqrt(tr + 1) * 2;
      qw = s / 4; qx = (r21 - r12) / s; qy = (r02 - r20) / s; qz = (r10 - r01) / s;
    } else if (r00 > r11 && r00 > r22) {
      const s = Math.sqrt(1 + r00 - r11 - r22) * 2;
      qw = (r21 - r12) / s; qx = s / 4; qy = (r01 + r10) / s; qz = (r02 + r20) / s;
    } else if (r11 > r22) {
      const s = Math.sqrt(1 + r11 - r00 - r22) * 2;
      qw = (r02 - r20) / s; qx = (r01 + r10) / s; qy = s / 4; qz = (r12 + r21) / s;
    } else {
      const s = Math.sqrt(1 + r22 - r00 - r11) * 2;
      qw = (r10 - r01) / s; qx = (r02 + r20) / s; qy = (r12 + r21) / s; qz = s / 4;
    }
    // The move, taken so the bone's pivot lands where its matrix puts it.
    const [px, py, pz] = skeleton.pivots[b];
    const tx = M[o] * px + M[o + 1] * py + M[o + 2] * pz + M[o + 3] - (r00 * px + r01 * py + r02 * pz);
    const ty = M[o + 4] * px + M[o + 5] * py + M[o + 6] * pz + M[o + 7] - (r10 * px + r11 * py + r12 * pz);
    const tz = M[o + 8] * px + M[o + 9] * py + M[o + 10] * pz + M[o + 11] - (r20 * px + r21 * py + r22 * pz);
    const q = b * 8;
    Q[q] = qx; Q[q + 1] = qy; Q[q + 2] = qz; Q[q + 3] = qw;
    // Dual part: ½ (t, 0) · r.
    Q[q + 4] = 0.5 * (tx * qw + ty * qz - tz * qy);
    Q[q + 5] = 0.5 * (-tx * qz + ty * qw + tz * qx);
    Q[q + 6] = 0.5 * (tx * qy - ty * qx + tz * qw);
    Q[q + 7] = -0.5 * (tx * qx + ty * qy + tz * qz);
    // The squash left over (the matrix less its turn), about the pivot.
    if (Math.abs(l0 - 1) > 1e-5 || Math.abs(l1 - 1) > 1e-5 || Math.abs(l2 - 1) > 1e-5 || Math.abs(d01) > 1e-5) {
      scaled[b] = 1;
      const R = [r00, r01, r02, r10, r11, r12, r20, r21, r22];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) D[b * 12 + r * 3 + c] = M[o + r * 4 + c] - R[r * 3 + c];
      D[b * 12 + 9] = px; D[b * 12 + 10] = py; D[b * 12 + 11] = pz;
    }
  }
  const count = P.length / 3;
  for (let v = 0; v < count; v++) {
    const i4 = v * 4;
    let b = I[i4] * 8;
    const sx = Q[b], sy = Q[b + 1], sz = Q[b + 2], sw = Q[b + 3];
    let x0 = 0, y0 = 0, z0 = 0, w0 = 0, x1 = 0, y1 = 0, z1 = 0, w1 = 0;
    for (let k = 0; k < 4; k++) {
      let w = W[i4 + k];
      if (w <= 0) break;
      b = I[i4 + k] * 8;
      // The shorter way round, as the first bone turns.
      if (Q[b] * sx + Q[b + 1] * sy + Q[b + 2] * sz + Q[b + 3] * sw < 0) w = -w;
      x0 += Q[b] * w; y0 += Q[b + 1] * w; z0 += Q[b + 2] * w; w0 += Q[b + 3] * w;
      x1 += Q[b + 4] * w; y1 += Q[b + 5] * w; z1 += Q[b + 6] * w; w1 += Q[b + 7] * w;
    }
    const l = 1 / (Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0) || 1);
    x0 *= l; y0 *= l; z0 *= l; w0 *= l; x1 *= l; y1 *= l; z1 *= l; w1 *= l;
    // Translation: 2 · dual · conj(real).
    const tx = 2 * (-w1 * x0 + x1 * w0 - y1 * z0 + z1 * y0);
    const ty = 2 * (-w1 * y0 + x1 * z0 + y1 * w0 - z1 * x0);
    const tz = 2 * (-w1 * z0 - x1 * y0 + y1 * x0 + z1 * w0);
    // The rotation as a matrix.
    const xx = x0 * x0, yy = y0 * y0, zz = z0 * z0, xy = x0 * y0, xz = x0 * z0, yz = y0 * z0, wx = w0 * x0, wy = w0 * y0, wz = w0 * z0;
    const a00 = 1 - 2 * (yy + zz), a01 = 2 * (xy - wz), a02 = 2 * (xz + wy);
    const a10 = 2 * (xy + wz), a11 = 1 - 2 * (xx + zz), a12 = 2 * (yz - wx);
    const a20 = 2 * (xz - wy), a21 = 2 * (yz + wx), a22 = 1 - 2 * (xx + yy);
    const v3 = v * 3;
    const px = P[v3], py = P[v3 + 1], pz = P[v3 + 2];
    let ox = a00 * px + a01 * py + a02 * pz + tx, oy = a10 * px + a11 * py + a12 * pz + ty, oz = a20 * px + a21 * py + a22 * pz + tz;
    for (let k = 0; k < 4; k++) {
      const w = W[i4 + k];
      if (w <= 0) break;
      const s = I[i4 + k];
      if (!scaled[s]) continue;
      const d = s * 12, qx = px - D[d + 9], qy = py - D[d + 10], qz = pz - D[d + 11];
      ox += w * (D[d] * qx + D[d + 1] * qy + D[d + 2] * qz);
      oy += w * (D[d + 3] * qx + D[d + 4] * qy + D[d + 5] * qz);
      oz += w * (D[d + 6] * qx + D[d + 7] * qy + D[d + 8] * qz);
    }
    position[v3] = ox; position[v3 + 1] = oy; position[v3 + 2] = oz;
    const na = N[v3], nb = N[v3 + 1], nc = N[v3 + 2];
    normal[v3] = a00 * na + a01 * nb + a02 * nc;
    normal[v3 + 1] = a10 * na + a11 * nb + a12 * nc;
    normal[v3 + 2] = a20 * na + a21 * nb + a22 * nc;
  }
}
