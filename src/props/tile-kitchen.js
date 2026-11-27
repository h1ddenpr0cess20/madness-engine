/**
 * A bistro kitchen's counter and wall, for something to stand on and be
 * shot against: a slab of honed marble and, behind it, a wall of bottle-green
 * glazed subway tile with a brass rail on standoffs a hand's height up and a
 * brass quarter-round where the tile meets the stone. Ported from Short
 * Order's kitchen.
 *
 *   const kitchen = createTileKitchen(GFX);
 *   kitchen.group.position.set(0, floorY, -2.4);  // the wall is 2.4 tiles behind the origin
 *
 * The group's origin is on the counter's top at the foot of the wall: +x along
 * the wall, +y up, +z out into the room, the counter running forward from the
 * wall and the wall standing behind it. The slab and the wall are wide enough
 * that their ends are never in shot, and deep and high enough that the front
 * edge and the top are not either.
 *
 * @param {object} GFX
 * @param {object} [options]
 * @param {number} [options.width]  how far the counter and the wall run along x (110)
 * @param {number} [options.depth]  how far the counter comes out from the wall (60)
 * @param {number} [options.height]  how high the wall stands above the counter (60)
 * @param {number} [options.railHeight]  how high the brass rail is, above the counter (3.2)
 * @param {number} [options.marbleSize]  how far one repeat of the marble's veining runs, along the counter (8)
 * @param {number} [options.scale]  size of everything, the tile and the stone's veins with it: 1 is a subway tile two tiles wide
 */
import { brushedTexture, greenTileTexture, marbleTexture } from '../textures/kitchen.js';

export function createTileKitchen(GFX, { width = 110, depth = 60, height = 60, railHeight = 3.2, marbleSize = 8, scale = 1 } = {}) {
  const group = new GFX.Group();
  group.name = 'tile-kitchen';

  // The counter: one slab, its top on y = 0.
  const marble = marbleTexture(GFX);
  if (marble) marble.repeat.set(width / (marbleSize * scale), depth / (marbleSize * scale));
  const counter = new GFX.Mesh(
    new GFX.BoxGeometry(width, 2 * scale, depth),
    new GFX.MeshPhysicalMaterial({
      name: 'counter', color: 0xc2baab, map: marble, roughness: 0.34, metalness: 0,
      clearcoat: 0.25, clearcoatRoughness: 0.4,
    }),
  );
  counter.name = 'counter';
  counter.position.set(0, -scale, depth / 2);
  group.add(counter);

  // The wall: tile two wide and one high, eight to a repeat.
  const tiles = greenTileTexture(GFX);
  if (tiles) tiles.repeat.set(width / (16 * scale), height / (8 * scale));
  const wall = new GFX.Mesh(
    new GFX.PlaneGeometry(width, height),
    new GFX.MeshPhysicalMaterial({
      name: 'wall-tile', color: tiles ? 0xffffff : 0x24493a, map: tiles, roughness: 0.22, metalness: 0,
      clearcoat: 0.8, clearcoatRoughness: 0.12,
    }),
  );
  wall.name = 'wall';
  wall.position.set(0, height / 2, 0);
  group.add(wall);

  // Brass: a quarter-round where the tile meets the stone, and the rail ladles hang from.
  const brass = new GFX.MeshStandardMaterial({
    name: 'wall-brass', color: 0xc9a25a, map: brushedTexture(GFX, 256, '#b0b0b0'), roughness: 0.44, metalness: 1,
  });
  const trim = new GFX.Group();
  trim.name = 'wall-brass';
  const cove = new GFX.Mesh(new GFX.CylinderGeometry(0.22 * scale, 0.22 * scale, width, 12, 1, false, 0, Math.PI / 2), brass);
  cove.name = 'wall-cove';
  cove.rotation.z = Math.PI / 2;
  trim.add(cove);
  const rail = new GFX.Mesh(new GFX.CylinderGeometry(0.17 * scale, 0.17 * scale, width, 16), brass);
  rail.name = 'wall-rail';
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, railHeight, 0.75 * scale);
  trim.add(rail);
  const spacing = 12 * scale;
  for (let x = -Math.floor(width / 2 / spacing) * spacing; x <= width / 2; x += spacing) {
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.1 * scale, 0.16 * scale, 0.75 * scale, 12), brass);
    post.name = 'wall-standoff';
    post.rotation.x = Math.PI / 2;
    post.position.set(x, railHeight, 0.38 * scale);
    trim.add(post);
    const rose = new GFX.Mesh(new GFX.CylinderGeometry(0.34 * scale, 0.36 * scale, 0.08 * scale, 20), brass);
    rose.name = 'wall-rose';
    rose.rotation.x = Math.PI / 2;
    rose.position.set(x, railHeight, 0.04 * scale);
    trim.add(rose);
  }
  group.add(trim);

  for (const mesh of [counter, wall, ...trim.children]) {
    mesh.castShadow = false;
    mesh.receiveShadow = true;
  }

  return { group, counter, wall, rail, railHeight };
}
