import { METALS } from './metalglobe.js';

/**
 * A coin in metal, a raised logo struck on both faces: a disc with a raised rim, a serrated edge, the year and "In Claude We Trust" arced round the top, and the logo
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
 * @param {HTMLCanvasElement} [options.logo]  the front logo, white on black, square
 * @param {HTMLCanvasElement} [options.backLogo]  the reverse logo; defaults to `logo`
 * @param {string} [options.metal]  a key of `METALS`
 * @param {string} [options.year]  struck small under the logo's right-hand end
 * @param {string} [options.motto]  struck in an arc round the top of the face
 */
export function createCoin(GFX, { radius = 0.3, logo = null, backLogo = logo, metal = 'gold', year = '2027', motto = 'In Claude We Trust' } = {}) {
  const half = radius * 0.09;                 // half the coin's thickness at the field
  const lip = radius * 0.05;                  // how far the rim stands above the field
  const material = new GFX.MeshPhysicalMaterial({ name: 'coin metal', color: new GFX.Color('#ffffff'), metalness: 1, roughness: 0.25, envMapIntensity: 3 });

  // The body: a profile turned about the axis: the field, the lip of the rim, the milled edge.
  const R = radius, inner = R * 0.9;
  const depth = R * 0.022, root = R - depth;   // the serrations: the body stops at their roots, the teeth reach R
  const profile = [
    [0, -half], [inner, -half], [inner + R * 0.01, -half - lip], [root * 0.995, -half - lip], [root, -half - lip * 0.4],
    [root, half + lip * 0.4], [root * 0.995, half + lip], [inner + R * 0.01, half + lip], [inner, half], [0, half],
  ].map(([x, y]) => new GFX.Vector2(x, y));
  const lathe = new GFX.LatheGeometry(profile, 220);
  const body = new GFX.Mesh(lathe, material);
  body.name = 'coin body';
  body.castShadow = true;
  body.receiveShadow = true;
  // Lathe turns about y: lay it so the faces point along z.
  body.rotation.x = Math.PI / 2;

  // The serrated edge: a ring of teeth round the body, each a V cut along the coin's thickness, flat-shaded so every
  // tooth catches the light on its own. Even vertices are the tips, odd the roots.
  const TEETH = 110;
  const ring = new GFX.CylinderGeometry(R, R, 2 * (half + lip * 0.4), TEETH * 2, 1, true);
  const rp = ring.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const k = i % (TEETH * 2 + 1);
    const r = k % 2 === 0 ? R : root;
    const a = Math.atan2(rp.getZ(i), rp.getX(i));
    rp.setX(i, Math.cos(a) * r); rp.setZ(i, Math.sin(a) * r);
  }
  ring.computeVertexNormals();
  const edgeMaterial = new GFX.MeshPhysicalMaterial({ name: 'coin edge', color: new GFX.Color('#ffffff'), metalness: 1, roughness: 0.25, envMapIntensity: 3, flatShading: true });
  const edge = new GFX.Mesh(ring, edgeMaterial);
  edge.name = 'coin edge';
  edge.castShadow = true;
  edge.rotation.x = Math.PI / 2;

  const group = new GFX.Group();
  group.name = 'coin';
  const spin = new GFX.Group();
  spin.add(body, edge);

  // The reliefs, lifted off each face: a canvas (white on black, white the highest) cut to the box that holds it
  // and made a finely meshed plane whose vertices are raised by it. The height is cut into the geometry itself,
  // vertex by vertex, so it is real height that catches the light; a vertex with nothing on it sinks into the
  // coin, so only the strokes show. `grow` is how many pixels the strokes are made bolder by, `ridge` how high.
  const boxOf = (px, w, h) => {
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    }
    return [x0, y0, x1, y1];
  };
  const reliefOf = (canvas, perPixel, { grow = 3, ridge = 2, pad = 8, soften = 3, gain = 2.2 } = {}) => {
    const W = canvas.width, H = canvas.height;
    const pixels = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    let [x0, y0, x1, y1] = boxOf(pixels, W, H);
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const geometry = new GFX.PlaneGeometry(bw * perPixel, bh * perPixel, bw - 1, bh - 1);
    const pos = geometry.attributes.position;
    const at = (x, y) => pixels[(Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 4];
    // One value to a vertex, row by row from the top: the brightest pixel within `grow`, so thin strokes are
    // bolder, then blurred so they are rounded ridges, not steps.
    let field = new Float32Array(bw * bh);
    for (let iy = 0; iy < bh; iy++) for (let ix = 0; ix < bw; ix++) {
      let best = 0;
      for (let dy = -grow; dy <= grow; dy++) for (let dx = -grow; dx <= grow; dx++) {
        const d = Math.hypot(dx, dy);
        if (d <= grow) best = Math.max(best, at(x0 + ix + dx, y0 + iy + dy) * (1 - d / (grow * 2)));
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
    for (let i = 0; i < soften; i++) field = blur(field);
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(1, field[i] * gain);
      const h = t * t * (3 - 2 * t);               // smoothstep: a rounded ridge
      pos.setZ(i, h > 0.004 ? h * lip * ridge : -0.004);
    }
    // Only the triangles with something on them are kept: the rest of the box would show beyond the coin's edge.
    const index = geometry.index.array, kept = [];
    for (let t = 0; t < index.length; t += 3) {
      if (pos.getZ(index[t]) > 0 || pos.getZ(index[t + 1]) > 0 || pos.getZ(index[t + 2]) > 0) kept.push(index[t], index[t + 1], index[t + 2]);
    }
    geometry.setIndex(kept);
    geometry.computeVertexNormals();
    // Where the box sits, from the canvas's middle, in the coin's units (y up).
    return { geometry, x: ((x0 + x1) / 2 - W / 2) * perPixel, y: -((y0 + y1) / 2 - H / 2) * perPixel };
  };
  const reliefMaterial = new GFX.MeshPhysicalMaterial({ name: 'coin relief', color: new GFX.Color('#ffffff'), metalness: 1, roughness: 0.25, envMapIntensity: 3 });
  const strike = ({ geometry, x, y }, face = null) => {
    const faces = face === null ? [1, -1] : [face];
    for (const side of faces) {
      const mesh = new GFX.Mesh(geometry, reliefMaterial);
      mesh.name = 'coin relief';
      mesh.castShadow = true;
      mesh.position.set(side * x, y, side * (half - 0.0004));
      if (side < 0) mesh.rotation.y = Math.PI;
      spin.add(mesh);
    }
  };
  material.userData.logos = [reliefMaterial];

  const strikeFace = (faceLogo, side) => {
    const W = faceLogo.width, H = faceLogo.height;
    const [, y0, x1, y1] = boxOf(faceLogo.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data, W, H);
    const dated = document.createElement('canvas');
    dated.width = W; dated.height = H;
    const dctx = dated.getContext('2d', { willReadFrequently: true });
    dctx.fillStyle = '#000'; dctx.fillRect(0, 0, W, H);
    dctx.fillStyle = '#ffffff';
    dctx.font = `600 ${Math.round((y1 - y0) * 0.1)}px Georgia, 'Times New Roman', serif`;
    dctx.textAlign = 'right'; dctx.textBaseline = 'top';
    dctx.fillText(year, x1, y1 + (y1 - y0) * 0.05);
    const both = document.createElement('canvas');
    both.width = W; both.height = H;
    const bctx = both.getContext('2d', { willReadFrequently: true });
    bctx.drawImage(faceLogo, 0, 0);
    bctx.globalCompositeOperation = 'lighten';
    bctx.drawImage(dated, 0, 0);
    const [bx0, by0, bx1, by1] = boxOf(bctx.getImageData(0, 0, W, H).data, W, H);
    const fit = (R * 0.72 * 2) / Math.hypot(bx1 - bx0 + 17, by1 - by0 + 17);
    strike(reliefOf(faceLogo, fit), side);
    strike(reliefOf(dated, fit, { grow: 1, ridge: 0.8, pad: 4, soften: 1, gain: 2.2 }), side);
  };
  if (logo || backLogo) {
    strikeFace(logo ?? backLogo, 1);
    strikeFace(backLogo ?? logo, -1);
  }

  // The motto, round the top of the rim as an arc, each letter turned to stand on the circle.
  if (motto) {
    const N = 1024, perPixel = (R * 1.8) / N;
    const canvas = document.createElement('canvas');
    canvas.width = N; canvas.height = N;
    const c = canvas.getContext('2d', { willReadFrequently: true });
    c.fillStyle = '#000'; c.fillRect(0, 0, N, N);
    c.fillStyle = '#fff';
    const baseline = (R * 0.775) / perPixel, cap = (R * 0.105) / perPixel;
    c.font = `700 ${Math.round(cap / 0.72)}px Georgia, 'Times New Roman', serif`;
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const letters = [...motto.toUpperCase()];
    const tracking = cap * 0.2;
    const widths = letters.map((ch) => (ch === ' ' ? cap * 0.5 : c.measureText(ch).width) + tracking);
    const total = widths.reduce((a, b) => a + b, 0) / baseline;
    let angle = -total / 2;
    c.translate(N / 2, N / 2);
    letters.forEach((ch, i) => {
      const step = widths[i] / baseline;
      c.save();
      c.rotate(angle + step / 2);
      c.fillText(ch, 0, -baseline);
      c.restore();
      angle += step;
    });
    strike(reliefOf(canvas, perPixel, { grow: 1, ridge: 1.4, pad: 4, soften: 1 }));
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
      for (const mat of [...(material.userData.logos ?? []), edgeMaterial]) { mat.color.set(m.color); mat.roughness = m.roughness; }
      api.metal = name;
      return api;
    },
    update(dt) { if (api.spinRate) spin.rotation.y += api.spinRate * dt; },
  };
  return api.setMetal(metal);
}

export const assetViewer = {
  id: 'coin',
  name: 'coin',
  category: 'Animated props',
  group: 'coin',
  options: { metal: ['steel', 'silver', 'gold', 'copper', 'bronze', 'brass', 'titanium', 'chrome', 'platinum', 'rose gold', 'iron', 'pewter'] },
  async build({ GFX, metal = 'gold', renderer = null } = {}) {
    const [{ studioEnvironment }, texture] = await Promise.all([import('./metalglobe.js'), import('../textures/coin/logo.js')]);
    const coin = createCoin(GFX, { radius: 0.3, logo: await texture.loadCoinLogo(), metal });
    coin.spinRate = 0.9;
    return Object.assign(coin, { frame: { center: [0, 0, 0], radius: 0.34 }, environment: studioEnvironment(GFX, renderer) });
  },
};
