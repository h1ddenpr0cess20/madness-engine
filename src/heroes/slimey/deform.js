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
  const poles = [[], []];
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

  // SphereGeometry fans each pole into many coincident UV vertices too. They
  // must share a normal or the moving specular highlight pinches at the poles.
  for (let i = 0; i < uv.count; i++) {
    const v = uv.getY(i);
    if (v >= 1 - 1e-6) poles[0].push(i);
    else if (v <= 1e-6) poles[1].push(i);
  }
  for (const group of poles) {
    if (group.length < 2) continue;
    let x = 0, y = 0, z = 0;
    for (const i of group) {
      x += position.getX(i); y += position.getY(i); z += position.getZ(i);
    }
    x /= group.length; y /= group.length; z /= group.length;
    for (const i of group) position.setXYZ(i, x, y, z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();

  const normal = geometry.attributes.normal;
  if (!normal) return;
  const shareNormal = (indices) => {
    let x = 0, y = 0, z = 0;
    for (const i of indices) {
      x += normal.getX(i); y += normal.getY(i); z += normal.getZ(i);
    }
    const length = Math.hypot(x, y, z) || 1;
    x /= length; y /= length; z /= length;
    for (const i of indices) normal.setXYZ(i, x, y, z);
  };
  for (const [a, b] of pairs) shareNormal([a, b]);
  for (const group of poles) if (group.length > 1) shareNormal(group);
  normal.needsUpdate = true;
}

export function createDeformer(GFX) {
  const v = new GFX.Vector3();

  return function deform(geometry, base, lobes, { wobble, phase, scale, ampScale, freqScale, phaseScale, bubbling = 0 }) {
    const attribute = geometry.attributes.position;
    const arr = attribute.array;

    for (let i = 0; i < arr.length; i += 3) {
      v.set(base[i], base[i + 1], base[i + 2]);
      let d = 0;
      for (const l of lobes) {
        const alignment = v.dot(l.dir);
        d += l.amp * ampScale * Math.sin(l.freq * alignment * freqScale + phase * l.speed * phaseScale + l.phase);

        if (bubbling > 0) {
          // Localized, slowly inflating swells mimic bubbles of gas rising
          // beneath the molten crust. They pulse independently per lobe.
          const pulse = 0.5 + 0.5 * Math.sin(phase * (0.62 + l.speed * 0.18) + l.phase * 1.7);
          const radius = 1 - alignment;
          const envelope = Math.exp(-radius * radius * 72);
          d += bubbling * pulse * envelope;
        }
      }
      const s = (1 + d * wobble) * scale;
      arr[i] = v.x * s; arr[i + 1] = v.y * s; arr[i + 2] = v.z * s;
    }

    attribute.needsUpdate = true;
    smoothLongitudeSeam(geometry);
  };
}
