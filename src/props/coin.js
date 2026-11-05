import { METALS } from './metalglobe.js';

/**
 * A coin in metal, a raised logo struck on both faces: a disc with a raised rim and a milled edge, and the logo
 * (a canvas, white on black: white is the highest) lifted off each face as relief. The metal is any of `METALS`
 * (`props/metalglobe`), changed with `setMetal`. It stands on its edge, facing +z, and turns about the vertical.
 *
 *     const coin = createCoin(GFX, { logo: await loadCoinLogo(), metal: 'gold' });
 *     scene.add(coin.group);
 *     coin.setMetal('silver');
 */

/**
 * @param {object} GFX
 * @param {object} [options]
 * @param {number} [options.radius]
 * @param {HTMLCanvasElement} [options.logo]  the logo, white on black, square
 * @param {string} [options.metal]  a key of `METALS`
 */
export function createCoin(GFX, { radius = 0.3, logo = null, metal = 'gold' } = {}) {
  const half = radius * 0.09;                 // half the coin's thickness at the field
  const lip = radius * 0.05;                  // how far the rim stands above the field
  const material = new GFX.MeshPhysicalMaterial({ name: 'coin metal', color: new GFX.Color('#ffffff'), metalness: 1, roughness: 0.25, envMapIntensity: 3 });

  // The body: a profile turned about the axis: the field, the lip of the rim, the milled edge.
  const R = radius, inner = R * 0.9;
  const profile = [
    [0, -half], [inner, -half], [inner + R * 0.01, -half - lip], [R * 0.985, -half - lip], [R, -half - lip * 0.4],
    [R, half + lip * 0.4], [R * 0.985, half + lip], [inner + R * 0.01, half + lip], [inner, half], [0, half],
  ].map(([x, y]) => new GFX.Vector2(x, y));
  const lathe = new GFX.LatheGeometry(profile, 160);
  const body = new GFX.Mesh(lathe, material);
  body.name = 'coin body';
  body.castShadow = true;
  body.receiveShadow = true;
  // Lathe turns about y: lay it so the faces point along z.
  body.rotation.x = Math.PI / 2;

  const group = new GFX.Group();
  group.name = 'coin';
  const spin = new GFX.Group();
  spin.add(body);

  // The logo, lifted off each face: a finely cut plane whose displacement is the logo. It sits a hair inside the
  // face, so only the logo clears it. Its square is kept inside the field of the coin.
  if (logo) {
    // The logo is cut to its own box, so the strokes use all the face there is, not a square's worth of it.
    const ctx = logo.getContext('2d', { willReadFrequently: true });
    const W = logo.width, H = logo.height, pixels = ctx.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (pixels[(y * W + x) * 4] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    }
    const pad = 8;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    // As wide as the field allows: its box's corners just reach the inner edge of the rim.
    const fit = (R * 0.88 * 2) / Math.hypot(bw, bh);
    const width = bw * fit, height = bh * fit;
    // The relief is cut into the geometry itself, vertex by vertex from the logo's brightness (the renderer's
    // displacement maps are not relied on), so it is real height that catches the light. A vertex with no logo
    // sinks into the coin, so only the strokes show.
    const geometry = new GFX.PlaneGeometry(width, height, bw - 1, bh - 1);
    const pos = geometry.attributes.position;
    const at = (x, y) => pixels[(Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 4];
    // The height as a field, one value to a vertex (row by row from the top): the brightest pixel within three,
    // so the thin strokes are bolder, then blurred twice so they are rounded ridges, not steps.
    let field = new Float32Array(bw * bh);
    for (let iy = 0; iy < bh; iy++) for (let ix = 0; ix < bw; ix++) {
      let best = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const d = Math.hypot(dx, dy);
        if (d <= 3) best = Math.max(best, at(x0 + ix + dx, y0 + iy + dy) * (1 - d / 6));
      }
      field[iy * bw + ix] = Math.min(1, best / 255 * 1.3);
    }
    const blur = (src) => {
      const k = [1, 4, 6, 4, 1], tmp = new Float32Array(src.length), out = new Float32Array(src.length);
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        let v = 0; for (let j = -2; j <= 2; j++) v += src[y * bw + Math.min(bw - 1, Math.max(0, x + j))] * k[j + 2];
        tmp[y * bw + x] = v / 16;
      }
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        let v = 0; for (let j = -2; j <= 2; j++) v += tmp[Math.min(bh - 1, Math.max(0, y + j)) * bw + x] * k[j + 2];
        out[y * bw + x] = v / 16;
      }
      return out;
    };
    field = blur(blur(blur(field)));
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(1, field[i] * 2.2);
      const h = t * t * (3 - 2 * t);               // smoothstep: a rounded ridge
      pos.setZ(i, h > 0.004 ? h * lip * 2 : -0.004);
    }
    geometry.computeVertexNormals();
    const logoMaterial = new GFX.MeshPhysicalMaterial({ name: 'coin logo', color: new GFX.Color('#ffffff'), metalness: 1, roughness: 0.25, envMapIntensity: 3 });
    for (const side of [1, -1]) {
      const relief = new GFX.Mesh(geometry, logoMaterial);
      relief.name = 'coin logo';
      relief.castShadow = true;
      relief.position.z = side * (half - 0.0004);
      if (side < 0) relief.rotation.y = Math.PI;
      spin.add(relief);
    }
    material.userData.logos = [logoMaterial];
  }
  group.add(spin);

  const api = {
    group, spin, body, material, metal, spinRate: 0,
    /** Changes the metal: any key of `METALS`. */
    setMetal(name) {
      const m = METALS[name];
      if (!m) throw new Error(`no metal called ${name}`);
      // The field frosted and the logo polished, as a proof coin is struck, so the logo stands out in light.
      material.color.set(m.color); material.roughness = Math.min(1, m.roughness + 0.3);
      for (const mat of material.userData.logos ?? []) { mat.color.set(m.color); mat.roughness = m.roughness; }
      api.metal = name;
      return api;
    },
    update(dt) { if (api.spinRate) spin.rotation.y += api.spinRate * dt; },
  };
  return api.setMetal(metal);
}
