/**
 * A glass entryway: a storefront of glass set into a wall, with a pair of glass doors in the middle, side lights
 * either side of them, a transom above, all in a bronze (or black, or white) frame, long pulls on the doors and a
 * mat just inside. Behind the glass is daylight: a soft sky over a pavement, unlit, so it reads as outside.
 *
 * `width` and `height` are the opening's, `doorWidth` the pair of doors together, `doorHeight` where the transom
 * starts; `frame` the metal (bronze, black, white); `outside` false leaves the glass clear, for a real view beyond;
 * `mat` false leaves out the mat.
 *
 * Coordinates are metres: the middle of the opening on the floor, facing +z (into the room). Set it flush with the
 * inside of a wall. `doorway` says where someone walks through: its middle on the floor and its width.
 *
 *   const entry = createGlassEntry(GFX, { width: 4.4 });
 *   entry.group.position.set(7.18, 0, 0);
 *   entry.group.rotation.y = -Math.PI / 2;
 *   scene.add(entry.group);
 */

export const FRAMES = Object.freeze({
  bronze: { color: '#4a3a2a', roughness: 0.35, metalness: 0.8 },
  black: { color: '#25252b', roughness: 0.45, metalness: 0.85 },
  white: { color: '#e6e3dc', roughness: 0.5, metalness: 0.2 },
});

export const DEFAULTS = Object.freeze({
  width: 4.4, height: 3.0, doorWidth: 1.8, doorHeight: 2.35, frame: 'bronze', outside: true, mat: true,
});

/** Daylight beyond the glass: sky over pavement, as a small gradient. Needs a canvas; null where there is none. */
function daylight(GFX) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#cfe3f2');
  g.addColorStop(0.62, '#eef4f7');
  g.addColorStop(0.66, '#b9b4a8');
  g.addColorStop(1, '#8f8a80');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);
  const texture = new GFX.CanvasTexture(c);
  texture.colorSpace = GFX.SRGBColorSpace;
  return texture;
}

/** A glass entryway, as described above. */
export function createGlassEntry(GFX, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const frameStyle = FRAMES[o.frame];
  if (!frameStyle) throw new Error(`glass-entry: unknown frame ${o.frame}`);
  if (!(o.width > 0 && o.height > 0 && o.doorWidth > 0 && o.doorHeight > 0)) throw new Error('glass-entry: measures must be positive');
  if (o.doorWidth > o.width - 0.2 || o.doorHeight > o.height - 0.1) throw new Error('glass-entry: the doors must fit in the opening');

  const group = new GFX.Group();
  group.name = 'glass entryway';
  const frame = new GFX.MeshStandardMaterial({ name: 'entry-frame', color: new GFX.Color(frameStyle.color), roughness: frameStyle.roughness, metalness: frameStyle.metalness });
  const glass = new GFX.MeshStandardMaterial({
    name: 'entry-glass', color: new GFX.Color('#dfeef5'), roughness: 0.04, metalness: 0.1,
    transparent: true, opacity: 0.22, depthWrite: false,
  });

  if (o.outside) {
    const map = daylight(GFX);
    const sky = new GFX.MeshBasicMaterial(map ? { map } : { color: new GFX.Color('#dfe9ef') });
    const outside = new GFX.Mesh(new GFX.PlaneGeometry(o.width, o.height), sky);
    outside.name = 'entry daylight';
    outside.position.set(0, o.height / 2, -0.012);
    group.add(outside);
  }

  const pane = (w, h, x, y) => {
    const m = new GFX.Mesh(new GFX.PlaneGeometry(w, h), glass);
    m.name = 'entry glass';
    m.position.set(x, y, 0);
    m.renderOrder = 3;
    group.add(m);
  };
  const bar = (w, h, x, y, depth = 0.08) => {
    const m = new GFX.Mesh(new GFX.BoxGeometry(w, h, depth), frame);
    m.name = 'entry frame';
    m.position.set(x, y, 0);
    m.castShadow = true;
    group.add(m);
  };

  const side = (o.width - o.doorWidth) / 2;
  // Side lights and the transom.
  pane(side, o.height, -(o.doorWidth + side) / 2, o.height / 2);
  pane(side, o.height, (o.doorWidth + side) / 2, o.height / 2);
  pane(o.doorWidth, o.height - o.doorHeight, 0, (o.height + o.doorHeight) / 2);
  // Two door leaves, each a pane in its own frame, with a long pull.
  const doors = [];
  for (const sign of [-1, 1]) {
    const cx = (sign * o.doorWidth) / 4;
    pane(o.doorWidth / 2 - 0.08, o.doorHeight - 0.12, cx, o.doorHeight / 2);
    bar(0.05, o.doorHeight, sign * (o.doorWidth / 2 - 0.025), o.doorHeight / 2, 0.06);
    bar(0.05, o.doorHeight, sign * 0.025, o.doorHeight / 2, 0.06);
    bar(o.doorWidth / 2, 0.12, cx, 0.06, 0.06);
    const pull = new GFX.Mesh(new GFX.CylinderGeometry(0.014, 0.014, 0.9, 10), frame);
    pull.name = 'entry pull';
    pull.position.set(sign * 0.12, 1.05, 0.07);
    group.add(pull);
    doors.push({ x: cx, width: o.doorWidth / 2 });
  }
  // The storefront frame: head, sill, jambs, the mullions either side of the doors and the transom bar.
  bar(o.width + 0.12, 0.12, 0, o.height);
  bar(o.width + 0.12, 0.04, 0, 0.02);
  for (const x of [-o.width / 2, o.width / 2, -o.doorWidth / 2 - 0.03, o.doorWidth / 2 + 0.03]) bar(0.1, o.height, x, o.height / 2);
  bar(o.doorWidth + 0.12, 0.08, 0, o.doorHeight);

  if (o.mat) {
    const mat = new GFX.Mesh(new GFX.BoxGeometry(o.doorWidth + 0.2, 0.012, 1.0), new GFX.MeshStandardMaterial({ name: 'entry-mat', color: new GFX.Color('#2c2620'), roughness: 0.95 }));
    mat.name = 'entry mat';
    mat.position.set(0, 0.006, 0.65);
    mat.receiveShadow = true;
    group.add(mat);
  }

  return { group, doors, doorway: { x: 0, z: 0, width: o.doorWidth }, materials: { frame, glass } };
}
