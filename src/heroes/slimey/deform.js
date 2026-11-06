function smoothLongitudeSeam(geometry) {
  const uv = geometry.attributes.uv;
  const position = geometry.attributes.position;
  if (!uv || !position) {
    geometry.computeVertexNormals();
    return;
  }

  const starts = new Map();
  const ends = new Map();
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    if (u <= 1e-6) starts.set(Math.round(uv.getY(i) * 1e6), i);
    else if (u >= 1 - 1e-6) ends.set(Math.round(uv.getY(i) * 1e6), i);
  }

  const pairs = [];
  for (const [row, a] of starts) {
    const b = ends.get(row);
    if (b === undefined) continue;
    const x = (position.getX(a) + position.getX(b)) * 0.5;
    const y = (position.getY(a) + position.getY(b)) * 0.5;
    const z = (position.getZ(a) + position.getZ(b)) * 0.5;
    position.setXYZ(a, x, y, z);
    position.setXYZ(b, x, y, z);
    pairs.push([a, b]);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();

  const normal = geometry.attributes.normal;
  if (!normal) return;
  for (const [a, b] of pairs) {
    let x = normal.getX(a) + normal.getX(b);
    let y = normal.getY(a) + normal.getY(b);
    let z = normal.getZ(a) + normal.getZ(b);
    const length = Math.hypot(x, y, z) || 1;
    x /= length; y /= length; z /= length;
    normal.setXYZ(a, x, y, z);
    normal.setXYZ(b, x, y, z);
  }
  normal.needsUpdate = true;
}

export function createDeformer(GFX) {
  const v = new GFX.Vector3();

  return function deform(geometry, base, lobes, { wobble, phase, scale, ampScale, freqScale, phaseScale }) {
    const attribute = geometry.attributes.position;
    const arr = attribute.array;

    for (let i = 0; i < arr.length; i += 3) {
      v.set(base[i], base[i + 1], base[i + 2]);
      let d = 0;
      for (const l of lobes) {
        d += l.amp * ampScale * Math.sin(l.freq * v.dot(l.dir) * freqScale + phase * l.speed * phaseScale + l.phase);
      }
      const s = (1 + d * wobble) * scale;
      arr[i] = v.x * s; arr[i + 1] = v.y * s; arr[i + 2] = v.z * s;
    }

    attribute.needsUpdate = true;
    smoothLongitudeSeam(geometry);
  };
}
